import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PICKLIST_DEFAULTS, Picklist, type PicklistOptionItem } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { PicklistOptionUpsertDto } from './dto';

@Injectable()
export class PicklistsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Mirrors Picklists::seedDefaults: when a team has no options for a picklist
   * yet, populate it with the system defaults (idempotent).
   */
  async ensureDefaults(teamId: string): Promise<void> {
    for (const list of Object.values(Picklist)) {
      const count = await this.prisma.picklistOption.count({
        where: { teamId, picklist: list, deletedAt: { isSet: false } },
      });
      if (count > 0) continue;
      const defaults = PICKLIST_DEFAULTS[list];
      await this.prisma.picklistOption.createMany({
        data: defaults.map((d, idx) => ({
          teamId,
          picklist: list,
          value: d.value,
          label: d.label,
          color: d.color,
          isSystem: d.isSystem,
          position: idx,
        })),
      });
    }
  }

  async list(teamId: string): Promise<Record<Picklist, PicklistOptionItem[]>> {
    await this.ensureDefaults(teamId);
    const rows = await this.prisma.picklistOption.findMany({
      where: { teamId, deletedAt: { isSet: false } },
      orderBy: [{ picklist: 'asc' }, { position: 'asc' }],
    });
    const out: Record<string, PicklistOptionItem[]> = {};
    for (const list of Object.values(Picklist)) out[list] = [];
    for (const r of rows) {
      out[r.picklist]?.push({
        id: r.id,
        picklist: r.picklist,
        value: r.value,
        label: r.label,
        color: r.color,
        position: r.position,
        isSystem: r.isSystem,
      });
    }
    return out as Record<Picklist, PicklistOptionItem[]>;
  }

  async byPicklist(teamId: string, picklist: Picklist): Promise<PicklistOptionItem[]> {
    await this.ensureDefaults(teamId);
    const rows = await this.prisma.picklistOption.findMany({
      where: { teamId, picklist, deletedAt: { isSet: false } },
      orderBy: { position: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      picklist: r.picklist,
      value: r.value,
      label: r.label,
      color: r.color,
      position: r.position,
      isSystem: r.isSystem,
    }));
  }

  async create(teamId: string, dto: PicklistOptionUpsertDto): Promise<PicklistOptionItem> {
    const dup = await this.prisma.picklistOption.findFirst({
      where: { teamId, picklist: dto.picklist, value: dto.value, deletedAt: { isSet: false } },
    });
    if (dup) throw new BadRequestException('Value already exists in this picklist.');
    const max = await this.prisma.picklistOption.aggregate({
      where: { teamId, picklist: dto.picklist, deletedAt: { isSet: false } },
      _max: { position: true },
    });
    const created = await this.prisma.picklistOption.create({
      data: {
        teamId,
        picklist: dto.picklist,
        value: dto.value,
        label: dto.label,
        color: dto.color ?? null,
        position: (max._max.position ?? -1) + 1,
        isSystem: false,
      },
    });
    return { ...created, color: created.color };
  }

  async update(teamId: string, id: string, dto: PicklistOptionUpsertDto): Promise<PicklistOptionItem> {
    const existing = await this.prisma.picklistOption.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
    });
    if (!existing) throw new NotFoundException('Option not found.');
    const updated = await this.prisma.picklistOption.update({
      where: { id },
      data: { label: dto.label, value: dto.value, color: dto.color ?? null },
    });
    return updated;
  }

  async remove(teamId: string, id: string): Promise<void> {
    const existing = await this.prisma.picklistOption.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
    });
    if (!existing) throw new NotFoundException('Option not found.');
    if (existing.isSystem) {
      throw new BadRequestException('System options cannot be removed.');
    }
    await this.prisma.picklistOption.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async reorder(teamId: string, picklist: Picklist, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.picklistOption.updateMany({
          where: { id, teamId, picklist },
          data: { position: idx },
        }),
      ),
    );
  }
}
