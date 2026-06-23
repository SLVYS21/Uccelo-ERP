import { Injectable } from '@nestjs/common';
import { DealStatus, type DashboardPage } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async page(teamId: string, range?: { from?: string; to?: string }): Promise<DashboardPage> {
    const now = new Date();
    const to = range?.to ? new Date(range.to) : now;
    const from = range?.from ? new Date(range.from) : new Date(now.getTime() - 30 * 24 * 3600 * 1000);

    const [
      totalCompanies,
      totalContacts,
      openDeals,
      wonDealsInRange,
      openTasks,
      overdueTasks,
      stages,
      recentDeals,
      upcomingTasks,
      recentActivities,
    ] = await Promise.all([
      this.prisma.company.count({ where: { teamId, deletedAt: { isSet: false } } }),
      this.prisma.contact.count({ where: { teamId, deletedAt: { isSet: false } } }),
      this.prisma.deal.aggregate({
        where: { teamId, deletedAt: { isSet: false }, status: DealStatus.Open },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.deal.aggregate({
        where: { teamId, deletedAt: { isSet: false }, status: DealStatus.Won, closedAt: { gte: from, lte: to } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      this.prisma.task.count({ where: { teamId, isCompleted: false } }),
      this.prisma.task.count({
        where: { teamId, isCompleted: false, dueAt: { lt: now, not: null } },
      }),
      this.prisma.pipelineStage.findMany({
        where: { deletedAt: { isSet: false }, pipeline: { teamId, deletedAt: { isSet: false }, isDefault: true } },
        include: { _count: { select: { deals: { where: { deletedAt: { isSet: false } } } } }, deals: { where: { deletedAt: { isSet: false } }, select: { amount: true } } },
        orderBy: { position: 'asc' },
      }),
      this.prisma.deal.findMany({
        where: { teamId, deletedAt: { isSet: false } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: { id: true, name: true, amount: true, updatedAt: true },
      }),
      this.prisma.task.findMany({
        where: { teamId, isCompleted: false },
        orderBy: { dueAt: 'asc' },
        take: 5,
        select: { id: true, title: true, dueAt: true },
      }),
      this.prisma.activity.findMany({
        where: { teamId },
        orderBy: { occurredAt: 'desc' },
        take: 5,
        select: { id: true, type: true, subject: true, occurredAt: true },
      }),
    ]);

    const wonAmount = wonDealsInRange._sum.amount ?? 0;
    const openAmount = openDeals._sum.amount ?? 0;
    const totalClosed = (wonDealsInRange._count._all ?? 0) + (openDeals._count._all ?? 0);
    const conversionRate = totalClosed > 0 ? ((wonDealsInRange._count._all ?? 0) / totalClosed) * 100 : 0;

    return {
      kpis: {
        totalCompanies,
        totalContacts,
        openDealsCount: openDeals._count._all,
        openDealsAmount: openAmount,
        wonDealsCount: wonDealsInRange._count._all,
        wonDealsAmount: wonAmount,
        conversionRate: Math.round(conversionRate * 10) / 10,
        openTasksCount: openTasks,
        overdueTasksCount: overdueTasks,
      },
      charts: {
        stageDistribution: stages.map((s) => ({
          stageId: s.id,
          stageName: s.name,
          color: s.color,
          count: s._count.deals,
          amount: s.deals.reduce((sum, d) => sum + (d.amount ?? 0), 0),
        })),
        weeklyDeals: this.buildWeeklySeries(from, to),
        weeklyActivities: this.buildWeeklySeries(from, to),
      },
      lists: {
        recentDeals: recentDeals.map((d) => ({
          id: d.id,
          name: d.name,
          amount: d.amount,
          updatedAt: d.updatedAt.toISOString(),
        })),
        upcomingTasks: upcomingTasks.map((t) => ({
          id: t.id,
          title: t.title,
          dueAt: t.dueAt?.toISOString() ?? null,
        })),
        recentActivities: recentActivities.map((a) => ({
          id: a.id,
          type: a.type,
          subject: a.subject,
          occurredAt: a.occurredAt.toISOString(),
        })),
      },
      range: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  private buildWeeklySeries(from: Date, to: Date) {
    const weeks: { weekStart: string; count: number; amount: number }[] = [];
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    while (start <= to) {
      weeks.push({ weekStart: start.toISOString(), count: 0, amount: 0 });
      start.setDate(start.getDate() + 7);
    }
    return weeks;
  }
}
