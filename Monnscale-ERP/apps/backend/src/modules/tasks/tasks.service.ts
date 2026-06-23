import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CrmEntity,
  TaskPriority,
  type Paginated,
  type TaskItem,
} from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { normalizePagination, paginate } from '../../common/utils/pagination';
import { TaskUpsertDto } from './dto';

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Low]: 'Basse',
  [TaskPriority.Normal]: 'Normale',
  [TaskPriority.High]: 'Haute',
};

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(
    teamId: string,
    params: { page?: number; pageSize?: number; assigneeId?: string; completed?: boolean },
  ): Promise<Paginated<TaskItem>> {
    const { skip, take, page, pageSize } = normalizePagination(params);
    const where = {
      teamId,
      ...(params.assigneeId ? { assigneeId: params.assigneeId } : {}),
      ...(params.completed !== undefined ? { isCompleted: params.completed } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: [{ isCompleted: 'asc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
        include: { assignee: true },
      }),
      this.prisma.task.count({ where }),
    ]);
    const items: TaskItem[] = await Promise.all(rows.map((t) => this.toItem(t)));
    return paginate(items, total, page, pageSize);
  }

  async forSubject(teamId: string, type: CrmEntity, id: string): Promise<TaskItem[]> {
    const tasks = await this.prisma.task.findMany({
      where: { teamId, taskableType: type, taskableId: id },
      orderBy: [{ isCompleted: 'asc' }, { dueAt: 'asc' }],
      include: { assignee: true },
    });
    return Promise.all(tasks.map((t) => this.toItem(t)));
  }

  async create(teamId: string, dto: TaskUpsertDto): Promise<TaskItem> {
    const task = await this.prisma.task.create({
      data: {
        teamId,
        title: dto.title,
        description: dto.description ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        priority: dto.priority,
        assigneeId: dto.assigneeId ?? null,
        taskableType: dto.taskableType ?? null,
        taskableId: dto.taskableId ?? null,
      },
      include: { assignee: true },
    });
    return this.toItem(task);
  }

  async update(teamId: string, id: string, dto: TaskUpsertDto): Promise<TaskItem> {
    const existing = await this.prisma.task.findFirst({ where: { id, teamId } });
    if (!existing) throw new NotFoundException('Task not found.');
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description ?? null,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        priority: dto.priority,
        assigneeId: dto.assigneeId ?? null,
        taskableType: dto.taskableType ?? null,
        taskableId: dto.taskableId ?? null,
      },
      include: { assignee: true },
    });
    return this.toItem(task);
  }

  async toggle(teamId: string, id: string, isCompleted: boolean): Promise<TaskItem> {
    const existing = await this.prisma.task.findFirst({ where: { id, teamId } });
    if (!existing) throw new NotFoundException('Task not found.');
    const task = await this.prisma.task.update({
      where: { id },
      data: {
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
      },
      include: { assignee: true },
    });
    return this.toItem(task);
  }

  async remove(teamId: string, id: string): Promise<void> {
    const existing = await this.prisma.task.findFirst({ where: { id, teamId } });
    if (!existing) throw new NotFoundException('Task not found.');
    await this.prisma.task.delete({ where: { id } });
  }

  private async toItem(t: any): Promise<TaskItem> {
    let related: TaskItem['related'] = null;
    if (t.taskableType && t.taskableId) {
      const label = await this.relatedLabel(t.taskableType, t.taskableId);
      related = label ? { type: t.taskableType as CrmEntity, id: t.taskableId, label } : null;
    }
    return {
      id: t.id,
      title: t.title,
      description: t.description,
      dueAt: t.dueAt?.toISOString() ?? null,
      priority: t.priority as TaskPriority,
      priorityLabel: PRIORITY_LABELS[t.priority as TaskPriority] ?? t.priority,
      isCompleted: t.isCompleted,
      completedAt: t.completedAt?.toISOString() ?? null,
      assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name } : null,
      related,
    };
  }

  private async relatedLabel(type: string, id: string): Promise<string | null> {
    if (type === CrmEntity.Company) {
      const c = await this.prisma.company.findUnique({ where: { id }, select: { name: true } });
      return c?.name ?? null;
    }
    if (type === CrmEntity.Contact) {
      const c = await this.prisma.contact.findUnique({ where: { id }, select: { firstName: true, lastName: true } });
      return c ? `${c.firstName} ${c.lastName}` : null;
    }
    if (type === CrmEntity.Deal) {
      const d = await this.prisma.deal.findUnique({ where: { id }, select: { name: true } });
      return d?.name ?? null;
    }
    return null;
  }
}
