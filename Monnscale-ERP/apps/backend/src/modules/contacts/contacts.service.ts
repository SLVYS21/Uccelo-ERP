import { Injectable, NotFoundException } from '@nestjs/common';
import { CrmEntity, type ContactDetail, type ContactListItem, type CustomFieldValues, type Paginated } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { normalizePagination, paginate } from '../../common/utils/pagination';
import { CustomFieldsService } from '../custom-fields/custom-fields.service';
import { ContactUpsertDto } from './dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly customFields: CustomFieldsService,
  ) {}

  async list(teamId: string, params: { page?: number; pageSize?: number; search?: string }): Promise<Paginated<ContactListItem>> {
    const { skip, take, page, pageSize } = normalizePagination(params);
    const where = {
      teamId,
      deletedAt: { isSet: false },
      ...(params.search
        ? {
            OR: [
              { firstName: { contains: params.search, mode: 'insensitive' as const } },
              { lastName: { contains: params.search, mode: 'insensitive' as const } },
              { email: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        skip,
        take,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        include: { owner: true, company: true },
      }),
      this.prisma.contact.count({ where }),
    ]);
    return paginate(rows.map((c) => this.toListItem(c)), total, page, pageSize);
  }

  async show(teamId: string, id: string): Promise<ContactDetail> {
    const contact = await this.prisma.contact.findFirst({
      where: { id, teamId, deletedAt: { isSet: false } },
      include: { owner: true, company: true },
    });
    if (!contact) throw new NotFoundException('Contact not found.');
    return this.toDetail(contact);
  }

  async create(teamId: string, dto: ContactUpsertDto): Promise<ContactDetail> {
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Contact, dto.customFields ?? null);
    const contact = await this.prisma.contact.create({
      data: {
        teamId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        jobTitle: dto.jobTitle ?? null,
        companyId: dto.companyId ?? null,
        ownerId: dto.ownerId ?? null,
        customFields,
      },
      include: { owner: true, company: true },
    });
    return this.toDetail(contact);
  }

  async update(teamId: string, id: string, dto: ContactUpsertDto): Promise<ContactDetail> {
    await this.show(teamId, id);
    const customFields = await this.customFields.normalize(teamId, CrmEntity.Contact, dto.customFields ?? null);
    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        jobTitle: dto.jobTitle ?? null,
        companyId: dto.companyId ?? null,
        ownerId: dto.ownerId ?? null,
        customFields,
      },
      include: { owner: true, company: true },
    });
    return this.toDetail(contact);
  }

  async remove(teamId: string, id: string): Promise<void> {
    await this.show(teamId, id);
    await this.prisma.contact.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private toListItem(c: any): ContactListItem {
    return {
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: `${c.firstName} ${c.lastName}`.trim(),
      email: c.email,
      phone: c.phone,
      jobTitle: c.jobTitle,
      company: c.company ? { id: c.company.id, name: c.company.name } : null,
      owner: c.owner ? { id: c.owner.id, name: c.owner.name } : null,
    };
  }

  private toDetail(c: any): ContactDetail {
    return {
      ...this.toListItem(c),
      companyId: c.companyId,
      ownerId: c.ownerId,
      customFields: ((c.customFields as CustomFieldValues | null) ?? {}) as CustomFieldValues,
      createdAt: c.createdAt.toISOString(),
    } as ContactDetail;
  }
}
