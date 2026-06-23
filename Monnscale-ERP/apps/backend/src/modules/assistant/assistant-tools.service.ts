import { Injectable } from '@nestjs/common';
import { CrmEntity, type AssistantToolTrace } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

type ToolFilter = Record<string, unknown>;

/**
 * Tool implementations the assistant can invoke. Mirrors the SearchRecordsTool,
 * GetRecordTool and AggregateRecordsTool from the Laravel codebase, adapted to
 * MongoDB + Prisma. All queries are team-scoped via the caller-provided teamId.
 */
@Injectable()
export class AssistantToolsService {
  private trace: AssistantToolTrace[] = [];

  constructor(private readonly prisma: PrismaService) {}

  // ----- tool API the agent can call -----

  async searchRecords(teamId: string, entity: CrmEntity, filters: ToolFilter = {}, limit = 20) {
    const { whereCustom, scalarFilters } = this.splitFilters(filters);
    const where: any = { teamId, deletedAt: { isSet: false }, ...scalarFilters };
    if (Object.keys(whereCustom).length > 0) {
      where.AND = Object.entries(whereCustom).map(([k, v]) => ({
        customFields: { path: [k], equals: v },
      }));
    }
    const records = await this.collection(entity).findMany({ where, take: limit });
    this.log('search_records', `${entity}: ${records.length} résultat(s)`);
    return records.map((r) => this.summarize(entity, r));
  }

  async getRecord(teamId: string, entity: CrmEntity, id: string) {
    const record = await this.collection(entity).findFirst({ where: { id, teamId, deletedAt: { isSet: false } } });
    this.log('get_record', `${entity}#${id} ${record ? 'trouvé' : 'introuvable'}`);
    return record ? this.summarize(entity, record) : null;
  }

  async aggregateRecords(teamId: string, entity: CrmEntity, op: 'count' | 'sum', field?: string, filters: ToolFilter = {}) {
    const where: any = { teamId, deletedAt: { isSet: false }, ...filters };
    if (op === 'count') {
      const count = await this.collection(entity).count({ where });
      this.log('aggregate_records', `${entity}: ${op}=${count}`);
      return { op, entity, value: count };
    }
    if (op === 'sum' && field === 'amount' && entity === CrmEntity.Deal) {
      const agg = await this.prisma.deal.aggregate({ where, _sum: { amount: true } });
      const value = agg._sum.amount ?? 0;
      this.log('aggregate_records', `${entity}: sum(amount)=${value}`);
      return { op, entity, field, value };
    }
    return { op, entity, value: null };
  }

  takeTrace(): AssistantToolTrace[] {
    const t = this.trace;
    this.trace = [];
    return t;
  }

  // ----- helpers -----

  private log(name: string, summary: string): void {
    this.trace.push({ name, summary });
  }

  private collection(entity: CrmEntity) {
    switch (entity) {
      case CrmEntity.Company:
        return this.prisma.company;
      case CrmEntity.Contact:
        return this.prisma.contact;
      case CrmEntity.Deal:
        return this.prisma.deal;
      case CrmEntity.Task:
        return this.prisma.task as any;
    }
  }

  private splitFilters(filters: ToolFilter): { whereCustom: ToolFilter; scalarFilters: ToolFilter } {
    // Naive split: scalar filters that match column names go to where{},
    // anything else assumed to target customFields JSON.
    const scalarKeys = new Set(['name', 'city', 'industry', 'email', 'status', 'currency']);
    const scalarFilters: ToolFilter = {};
    const whereCustom: ToolFilter = {};
    for (const [k, v] of Object.entries(filters)) {
      if (scalarKeys.has(k)) scalarFilters[k] = v;
      else whereCustom[k] = v;
    }
    return { whereCustom, scalarFilters };
  }

  private summarize(entity: CrmEntity, r: any) {
    if (entity === CrmEntity.Company) return { id: r.id, name: r.name, industry: r.industry, city: r.city };
    if (entity === CrmEntity.Contact) return { id: r.id, name: `${r.firstName} ${r.lastName}`, email: r.email, jobTitle: r.jobTitle };
    if (entity === CrmEntity.Deal) return { id: r.id, name: r.name, amount: r.amount, currency: r.currency, status: r.status };
    return { id: r.id, ...r };
  }
}
