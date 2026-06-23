import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmEntity, type CompanyDetail, type CompanyListItem, type CustomFieldValues, type Paginated } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { normalizePagination, paginate } from '../../common/utils/pagination';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { CompanyUpsertDto } from './dto';

@Injectable()
export class CompaniesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customFields: CustomFieldsService,
  ) {}

  async list(teamId: string, params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<CompanyListItem>> {
    const { skip, take, page, pageSize } = normalizePagination(params);
    const where = {
      teamId,
      deletedAt: { isSet: false },
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' as const } },
              { domain: { contains: params.search, mode: 'insensitive' as const } },
              { city: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { owner: true },
      }),
      this.prisma.company.count({ where }),
    ]);
    return paginate(rows.map((c) => this.toListItem(c)), total, page, pageSize);
  }

  async show(teamId: string, id: string): Promise<CompanyDetail> {
    const company = await this.prisma.company.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
      include: { owner: true },
    });
    if (!company) throw new NotFoundException('Company not found.');
    return this.toDetail(company);
  }

  async create(teamId: string, dto: CompanyUpsertDto): Promise<CompanyDetail> {
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Company, dto.customFields ?? null);
    const company = await this.prisma.company.create({
      data: {
        teamId,
        name: dto.name,
        domain: dto.domain ?? null,
        industry: dto.industry ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        postalCode: dto.postalCode ?? null,
        country: dto.country ?? null,
        ownerId: dto.ownerId ?? null,
        customFields,
      },
      include: { owner: true },
    });
    return this.toDetail(company);
  }

  async update(teamId: string, id: string, dto: CompanyUpsertDto): Promise<CompanyDetail> {
    await this.show(teamId, id); // ensure exists & tenant-bound
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Company, dto.customFields ?? null);
    const company = await this.prisma.company.update({
      where: { id },
      data: {
        name: dto.name,
        domain: dto.domain ?? null,
        industry: dto.industry ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        address: dto.address ?? null,
        city: dto.city ?? null,
        postalCode: dto.postalCode ?? null,
        country: dto.country ?? null,
        ownerId: dto.ownerId ?? null,
        customFields,
      },
      include: { owner: true },
    });
    return this.toDetail(company);
  }

  async remove(teamId: string, id: string): Promise<void> {
    await this.show(teamId, id);
    await this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private toListItem(c: { id: string; name: string; domain: string | null; industry: string | null; city: string | null; phone: string | null; owner: { id: string; name: string } | null }): CompanyListItem {
    return {
      id: c.id,
      name: c.name,
      domain: c.domain,
      industry: c.industry,
      city: c.city,
      phone: c.phone,
      owner: c.owner ? { id: c.owner.id, name: c.owner.name } : null,
    };
  }

  private toDetail(c: any): CompanyDetail {
    return {
      ...this.toListItem(c),
      website: c.website,
      address: c.address,
      postalCode: c.postalCode,
      country: c.country,
      ownerId: c.ownerId,
      customFields: ((c.customFields as CustomFieldValues | null) ?? {}) as CustomFieldValues,
      createdAt: c.createdAt.toISOString(),
    } as CompanyDetail;
  }
}
