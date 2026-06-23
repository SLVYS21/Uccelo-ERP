import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import type { PipelineWithStages } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PipelineStageUpsertDto } from './dto';

@Injectable()
export class PipelinesService {
  private readonly logger = new Logger(PipelinesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Ensures every team has at least one pipeline with the standard stages.
   * Uses sequential creates (no $transaction) so it works on any MongoDB
   * deployment — Prisma Mongo transactions require a replica set and were
   * previously failing silently when unavailable.
   */
  async ensureDefaultForTeam(teamId: string): Promise<void> {
    const existing = await this.prisma.pipeline.findFirst({
      where: { teamId, deletedAt: { isSet: false } },
    });
    if (existing) return;

    try {
      const pipeline = await this.prisma.pipeline.create({
        data: { teamId, name: 'Ventes', isDefault: true, position: 0 },
      });
      const stages = [
        { name: 'Prospection', key: 'prospecting', color: '#94a3b8', isWon: false, isLost: false, position: 0 },
        { name: 'Qualification', key: 'qualified', color: '#06b6d4', isWon: false, isLost: false, position: 1 },
        { name: 'Proposition', key: 'proposal', color: '#2740e0', isWon: false, isLost: false, position: 2 },
        { name: 'Gagné', key: 'won', color: '#10b981', isWon: true, isLost: false, position: 3 },
        { name: 'Perdu', key: 'lost', color: '#f43f5e', isWon: false, isLost: true, position: 4 },
      ];
      for (const stage of stages) {
        await this.prisma.pipelineStage.create({ data: { pipelineId: pipeline.id, ...stage } });
      }
      this.logger.log(`Default pipeline + 5 stages created for team ${teamId}`);
    } catch (err) {
      this.logger.error(`Failed to seed default pipeline for team ${teamId}: ${(err as Error).message}`);
      throw err;
    }
  }

  async list(teamId: string): Promise<PipelineWithStages[]> {
    await this.ensureDefaultForTeam(teamId);
    const pipelines = await this.prisma.pipeline.findMany({
      where: { teamId, deletedAt: { isSet: false } },
      include: { stages: { orderBy: { position: 'asc' } } },
      orderBy: { position: 'asc' },
    });
    return pipelines.map((p) => ({
      id: p.id,
      name: p.name,
      stages: p.stages.map((s) => ({
        id: s.id,
        name: s.name,
        key: s.key,
        color: s.color,
        position: s.position,
        isWon: s.isWon,
        isLost: s.isLost,
      })),
    }));
  }

  async resolveForBoard(teamId: string, pipelineId?: string | null): Promise<string> {
    await this.ensureDefaultForTeam(teamId);
    if (pipelineId) {
      const pipeline = await this.prisma.pipeline.findFirst({
        where: { id: pipelineId, teamId, deletedAt: { isSet: false } },
      });
      if (pipeline) return pipeline.id;
    }
    const defaultPipeline = await this.prisma.pipeline.findFirst({
      where: { teamId, deletedAt: { isSet: false } },
      orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
    });
    if (!defaultPipeline) throw new NotFoundException('No pipeline found.');
    return defaultPipeline.id;
  }

  async addStage(teamId: string, pipelineId: string, dto: PipelineStageUpsertDto) {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, teamId, deletedAt: { isSet: false } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found.');
    if (dto.isWon && dto.isLost) {
      throw new BadRequestException('A stage cannot be both won and lost.');
    }
    const key = dto.key || slugify(dto.name, { lower: true, strict: true });
    const maxPosition = await this.prisma.pipelineStage.aggregate({
      where: { pipelineId, deletedAt: { isSet: false } },
      _max: { position: true },
    });
    return this.prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: dto.name,
        key,
        color: dto.color ?? null,
        isWon: dto.isWon ?? false,
        isLost: dto.isLost ?? false,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  async updateStage(teamId: string, stageId: string, dto: PipelineStageUpsertDto) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, deletedAt: { isSet: false }, pipeline: { teamId, deletedAt: { isSet: false } } },
    });
    if (!stage) throw new NotFoundException('Stage not found.');
    if (dto.isWon && dto.isLost) {
      throw new BadRequestException('A stage cannot be both won and lost.');
    }
    return this.prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        name: dto.name,
        color: dto.color ?? null,
        isWon: dto.isWon ?? stage.isWon,
        isLost: dto.isLost ?? stage.isLost,
      },
    });
  }

  async removeStage(teamId: string, stageId: string): Promise<void> {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, deletedAt: { isSet: false }, pipeline: { teamId, deletedAt: { isSet: false } } },
      include: { _count: { select: { deals: true } } },
    });
    if (!stage) throw new NotFoundException('Stage not found.');
    if (stage._count.deals > 0) {
      throw new BadRequestException(
        'Cannot delete a stage with deals. Move deals to another stage first.',
      );
    }
    await this.prisma.pipelineStage.update({ where: { id: stageId }, data: { deletedAt: new Date() } });
  }

  async reorderStages(teamId: string, pipelineId: string, orderedIds: string[]): Promise<void> {
    const pipeline = await this.prisma.pipeline.findFirst({
      where: { id: pipelineId, teamId, deletedAt: { isSet: false } },
    });
    if (!pipeline) throw new NotFoundException('Pipeline not found.');
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.pipelineStage.update({ where: { id }, data: { position: idx } }),
      ),
    );
  }

  async findStageOrFail(teamId: string, stageId: string) {
    const stage = await this.prisma.pipelineStage.findFirst({
      where: { id: stageId, deletedAt: { isSet: false }, pipeline: { teamId, deletedAt: { isSet: false } } },
    });
    if (!stage) throw new NotFoundException('Stage not found.');
    return stage;
  }
}
