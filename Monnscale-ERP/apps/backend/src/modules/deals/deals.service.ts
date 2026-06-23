import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CrmEntity,
  DealStatus,
  dealStatusFromStageFlags,
  type BoardStage,
  type CustomFieldValues,
  type DealCard,
  type DealDetail,
  type PipelineRef,
} from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import { DealUpsertDto, MoveDealDto } from './dto';

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customFields: CustomFieldsService,
    private readonly pipelines: PipelinesService,
  ) {}

  async board(teamId: string, requestedPipelineId?: string | null): Promise<{ pipeline: PipelineRef; pipelines: PipelineRef[]; stages: BoardStage[] }> {
    const pipelineId = await this.pipelines.resolveForBoard(teamId, requestedPipelineId);
    const [pipeline, allPipelines, stages] = await Promise.all([
      this.prisma.pipeline.findUniqueOrThrow({ where: { id: pipelineId } }),
      this.prisma.pipeline.findMany({
        where: { teamId, deletedAt: { isSet: false } },
        orderBy: [{ isDefault: 'desc' }, { position: 'asc' }],
      }),
      this.prisma.pipelineStage.findMany({
        where: { pipelineId, deletedAt: { isSet: false } },
        orderBy: { position: 'asc' },
        include: {
          deals: {
            where: { deletedAt: { isSet: false }, teamId },
            include: { company: true, contact: true, owner: true },
            orderBy: { position: 'asc' },
          },
        },
      }),
    ]);

    const boardStages: BoardStage[] = stages.map((stage) => ({
      id: stage.id,
      name: stage.name,
      key: stage.key,
      color: stage.color,
      isWon: stage.isWon,
      isLost: stage.isLost,
      totalAmount: stage.deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
      deals: stage.deals.map((d) => this.toCard(d)),
    }));

    return {
      pipeline: { id: pipeline.id, name: pipeline.name },
      pipelines: allPipelines.map((p) => ({ id: p.id, name: p.name })),
      stages: boardStages,
    };
  }

  async show(teamId: string, id: string): Promise<DealDetail> {
    const deal = await this.prisma.deal.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
      include: { company: true, contact: true, owner: true, stage: true },
    });
    if (!deal) throw new NotFoundException('Deal not found.');
    return this.toDetail(deal);
  }

  async create(teamId: string, dto: DealUpsertDto): Promise<DealDetail> {
    const stage = await this.pipelines.findStageOrFail(teamId, dto.pipelineStageId);
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Deal, dto.customFields ?? null);
    const status = dealStatusFromStageFlags(stage.isWon, stage.isLost);
    const max = await this.prisma.deal.aggregate({
      where: { pipelineStageId: stage.id, deletedAt: { isSet: false } },
      _max: { position: true },
    });
    const deal = await this.prisma.deal.create({
      data: {
        teamId,
        pipelineId: dto.pipelineId,
        pipelineStageId: dto.pipelineStageId,
        companyId: dto.companyId ?? null,
        contactId: dto.contactId ?? null,
        ownerId: dto.ownerId ?? null,
        name: dto.name,
        amount: dto.amount ?? null,
        currency: dto.currency ?? 'EUR',
        status,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        closedAt: status === DealStatus.Open ? null : new Date(),
        position: (max._max.position ?? -1) + 1,
        customFields,
      },
      include: { company: true, contact: true, owner: true, stage: true },
    });
    return this.toDetail(deal);
  }

  async update(teamId: string, id: string, dto: DealUpsertDto): Promise<DealDetail> {
    await this.show(teamId, id);
    const stage = await this.pipelines.findStageOrFail(teamId, dto.pipelineStageId);
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Deal, dto.customFields ?? null);
    const status = dealStatusFromStageFlags(stage.isWon, stage.isLost);
    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        pipelineId: dto.pipelineId,
        pipelineStageId: dto.pipelineStageId,
        companyId: dto.companyId ?? null,
        contactId: dto.contactId ?? null,
        ownerId: dto.ownerId ?? null,
        name: dto.name,
        amount: dto.amount ?? null,
        currency: dto.currency ?? 'EUR',
        status,
        expectedCloseDate: dto.expectedCloseDate ? new Date(dto.expectedCloseDate) : null,
        closedAt: status === DealStatus.Open ? null : new Date(),
        customFields,
      },
      include: { company: true, contact: true, owner: true, stage: true },
    });
    return this.toDetail(deal);
  }

  async remove(teamId: string, id: string): Promise<void> {
    await this.show(teamId, id);
    await this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  /**
   * Reorder deals when one is dropped onto a stage at a given index.
   * - Sets the moved deal's stage + status from stage flags (won/lost/open).
   * - Re-numbers positions in the destination stage (and origin if different).
   */
  async move(teamId: string, dealId: string, dto: MoveDealDto): Promise<void> {
    const deal = await this.prisma.deal.findFirst({ where: { id: dealId, teamId, deletedAt: { isSet: false } } });
    if (!deal) throw new NotFoundException('Deal not found.');
    const targetStage = await this.pipelines.findStageOrFail(teamId, dto.pipelineStageId);
    const status = dealStatusFromStageFlags(targetStage.isWon, targetStage.isLost);

    await this.prisma.$transaction(async (tx) => {
      const targetDeals = await tx.deal.findMany({
        where: { pipelineStageId: targetStage.id, deletedAt: { isSet: false }, id: { not: dealId } },
        orderBy: { position: 'asc' },
        select: { id: true },
      });
      const reordered = [...targetDeals];
      reordered.splice(dto.position, 0, { id: dealId });

      for (let i = 0; i < reordered.length; i += 1) {
        await tx.deal.update({
          where: { id: reordered[i].id },
          data: {
            position: i,
            ...(reordered[i].id === dealId
              ? {
                  pipelineStageId: targetStage.id,
                  pipelineId: targetStage.pipelineId,
                  status,
                  closedAt: status === DealStatus.Open ? null : new Date(),
                }
              : {}),
          },
        });
      }

      if (deal.pipelineStageId !== targetStage.id) {
        const sourceDeals = await tx.deal.findMany({
          where: { pipelineStageId: deal.pipelineStageId, deletedAt: { isSet: false } },
          orderBy: { position: 'asc' },
          select: { id: true },
        });
        for (let i = 0; i < sourceDeals.length; i += 1) {
          await tx.deal.update({ where: { id: sourceDeals[i].id }, data: { position: i } });
        }
      }
    });
  }

  private toCard(d: any): DealCard {
    return {
      id: d.id,
      name: d.name,
      amount: d.amount,
      currency: d.currency,
      position: d.position,
      company: d.company ? { id: d.company.id, name: d.company.name } : null,
      contact: d.contact ? { id: d.contact.id, name: `${d.contact.firstName} ${d.contact.lastName}`.trim() } : null,
      owner: d.owner ? { id: d.owner.id, name: d.owner.name } : null,
    };
  }

  private toDetail(d: any): DealDetail {
    return {
      id: d.id,
      name: d.name,
      amount: d.amount,
      currency: d.currency,
      status: d.status as DealStatus,
      statusLabel:
        d.status === DealStatus.Won ? 'Gagné' : d.status === DealStatus.Lost ? 'Perdu' : 'Ouvert',
      pipelineId: d.pipelineId,
      pipelineStageId: d.pipelineStageId,
      stage: d.stage ? { id: d.stage.id, name: d.stage.name, color: d.stage.color } : null,
      companyId: d.companyId,
      company: d.company ? { id: d.company.id, name: d.company.name } : null,
      contactId: d.contactId,
      contact: d.contact ? { id: d.contact.id, name: `${d.contact.firstName} ${d.contact.lastName}`.trim() } : null,
      ownerId: d.ownerId,
      owner: d.owner ? { id: d.owner.id, name: d.owner.name } : null,
      expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
      closedAt: d.closedAt?.toISOString() ?? null,
      customFields: ((d.customFields as CustomFieldValues | null) ?? {}) as CustomFieldValues,
      createdAt: d.createdAt.toISOString(),
    };
  }
}
