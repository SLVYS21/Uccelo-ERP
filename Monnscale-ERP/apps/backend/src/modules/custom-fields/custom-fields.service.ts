import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  CrmEntity,
  CustomFieldType,
  customFieldHasChoices,
  customFieldIsMultiple,
  type CustomFieldDefinition,
} from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CustomFieldUpsertDto } from './dto';

/**
 * Port of App\Application\Crm\Services\CustomFields.
 *
 *  - `definitions(entityType)` loads team-scoped definitions ordered by position
 *  - `normalize(entityType, input)` keeps only declared keys and coerces values
 *    by type. Stored on the host document as JSON.
 *  - `validate(...)` enforces required + type rules; throws BadRequestException
 *    with a fields object for the frontend form.
 */
@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async definitionsByEntity(teamId: string, entityType: CrmEntity): Promise<CustomFieldDefinition[]> {
    const rows = await this.prisma.customFieldDefinition.findMany({
      where: { teamId, entityType, deletedAt: { isSet: false } },
      orderBy: { position: 'asc' },
    });
    return rows.map((d) => this.toDto(d));
  }

  async listAll(teamId: string): Promise<Record<CrmEntity, CustomFieldDefinition[]>> {
    const rows = await this.prisma.customFieldDefinition.findMany({
      where: { teamId, deletedAt: { isSet: false } },
      orderBy: [{ entityType: 'asc' }, { position: 'asc' }],
    });
    const out: Record<string, CustomFieldDefinition[]> = {};
    for (const entity of [CrmEntity.Company, CrmEntity.Contact, CrmEntity.Deal]) {
      out[entity] = [];
    }
    for (const r of rows) out[r.entityType]?.push(this.toDto(r));
    return out as Record<CrmEntity, CustomFieldDefinition[]>;
  }

  async create(teamId: string, dto: CustomFieldUpsertDto): Promise<CustomFieldDefinition> {
    await this.assertKeyAvailable(teamId, dto.entityType, dto.key);
    const max = await this.prisma.customFieldDefinition.aggregate({
      where: { teamId, entityType: dto.entityType, deletedAt: { isSet: false } },
      _max: { position: true },
    });
    const created = await this.prisma.customFieldDefinition.create({
      data: {
        teamId,
        entityType: dto.entityType,
        key: dto.key,
        label: dto.label,
        type: dto.type,
        options: (dto.options as object | null) ?? null,
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? false,
        helpText: dto.helpText ?? null,
        position: (max._max.position ?? -1) + 1,
      },
    });
    return this.toDto(created);
  }

  async update(teamId: string, id: string, dto: CustomFieldUpsertDto): Promise<CustomFieldDefinition> {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
    });
    if (!existing) throw new NotFoundException('Custom field not found.');
    if (existing.key !== dto.key || existing.entityType !== dto.entityType) {
      await this.assertKeyAvailable(teamId, dto.entityType, dto.key, id);
    }
    const updated = await this.prisma.customFieldDefinition.update({
      where: { id },
      data: {
        entityType: dto.entityType,
        key: dto.key,
        label: dto.label,
        type: dto.type,
        options: (dto.options as object | null) ?? null,
        isRequired: dto.isRequired ?? false,
        isFilterable: dto.isFilterable ?? false,
        helpText: dto.helpText ?? null,
      },
    });
    return this.toDto(updated);
  }

  async remove(teamId: string, id: string): Promise<void> {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
    });
    if (!existing) throw new NotFoundException('Custom field not found.');
    await this.prisma.customFieldDefinition.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async reorder(teamId: string, entityType: CrmEntity, orderedIds: string[]): Promise<void> {
    await this.prisma.$transaction(
      orderedIds.map((id, idx) =>
        this.prisma.customFieldDefinition.updateMany({
          where: { id, teamId, entityType },
          data: { position: idx },
        }),
      ),
    );
  }

  async normalize(
    teamId: string,
    entityType: CrmEntity,
    input: Record<string, unknown> | null,
  ): Promise<Prisma.InputJsonObject> {
    const definitions = await this.definitionsByEntity(teamId, entityType);
    const out: Record<string, Prisma.InputJsonValue> = {};
    const errors: Record<string, string> = {};

    for (const def of definitions) {
      const raw = input?.[def.key];
      const value = this.coerce(def.type, raw, customFieldIsMultiple(def.type));

      if (def.isRequired && (value === null || value === undefined || (Array.isArray(value) && value.length === 0))) {
        errors[def.key] = `Le champ « ${def.label} » est requis.`;
        continue;
      }
      if (value !== null && value !== undefined) {
        if (customFieldHasChoices(def.type)) {
          const allowed = (def.options?.choices ?? []).map((c) => c.value);
          const provided = Array.isArray(value) ? value : [value];
          if (provided.some((v) => !allowed.includes(v as string))) {
            errors[def.key] = `Valeur invalide pour « ${def.label} ».`;
            continue;
          }
        }
        out[def.key] = value as Prisma.InputJsonValue;
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new BadRequestException({ message: 'Custom fields validation failed.', fields: errors });
    }
    return out as Prisma.InputJsonObject;
  }

  private coerce(type: CustomFieldType, raw: unknown, multiple: boolean): unknown {
    if (raw === null || raw === undefined || raw === '') return null;
    switch (type) {
      case CustomFieldType.Number:
        return typeof raw === 'number' ? raw : Number(raw);
      case CustomFieldType.Checkbox:
        return Boolean(raw);
      case CustomFieldType.Date:
        return new Date(raw as string).toISOString();
      case CustomFieldType.MultiSelect:
        return Array.isArray(raw) ? raw.map(String) : [String(raw)];
      default:
        if (multiple) return Array.isArray(raw) ? raw.map(String) : [String(raw)];
        return String(raw);
    }
  }

  private async assertKeyAvailable(teamId: string, entityType: CrmEntity, key: string, excludeId?: string): Promise<void> {
    const existing = await this.prisma.customFieldDefinition.findFirst({
      where: { teamId, entityType, key, deletedAt: { isSet: false }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    });
    if (existing) throw new BadRequestException('A custom field with this key already exists.');
  }

  private toDto(row: any): CustomFieldDefinition {
    return {
      id: row.id,
      entityType: row.entityType as CrmEntity,
      key: row.key,
      label: row.label,
      type: row.type as CustomFieldType,
      options: (row.options as CustomFieldDefinition['options']) ?? null,
      isRequired: row.isRequired,
      isFilterable: row.isFilterable,
      position: row.position,
      helpText: row.helpText,
    };
  }
}
