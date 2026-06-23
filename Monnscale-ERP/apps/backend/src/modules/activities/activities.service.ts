import { Injectable, NotFoundException } from '@nestjs/common';
import type { ActivityItem, CrmEntity } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateActivityDto } from './dto';

const TYPE_LABELS: Record<string, string> = {
  call: 'Appel',
  email: 'E-mail',
  meeting: 'Rendez-vous',
  note: 'Note',
};

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async forSubject(teamId: string, type: CrmEntity, id: string): Promise<ActivityItem[]> {
    const activities = await this.prisma.activity.findMany({
      where: { teamId, subjectableType: type, subjectableId: id },
      orderBy: { occurredAt: 'desc' },
      include: { user: true },
    });
    return activities.map((a) => this.toItem(a));
  }

  async create(teamId: string, userId: string, dto: CreateActivityDto): Promise<ActivityItem> {
    const activity = await this.prisma.activity.create({
      data: {
        teamId,
        userId,
        type: dto.type,
        subject: dto.subject ?? null,
        body: dto.body ?? null,
        occurredAt: new Date(dto.occurredAt),
        subjectableType: dto.subjectableType,
        subjectableId: dto.subjectableId,
      },
      include: { user: true },
    });
    return this.toItem(activity);
  }

  async remove(teamId: string, id: string): Promise<void> {
    const existing = await this.prisma.activity.findFirst({ where: { id, teamId } });
    if (!existing) throw new NotFoundException('Activity not found.');
    await this.prisma.activity.delete({ where: { id } });
  }

  private toItem(a: any): ActivityItem {
    return {
      id: a.id,
      type: a.type,
      typeLabel: TYPE_LABELS[a.type] ?? a.type,
      subject: a.subject,
      body: a.body,
      occurredAt: a.occurredAt.toISOString(),
      user: a.user ? { id: a.user.id, name: a.user.name } : null,
    };
  }
}
