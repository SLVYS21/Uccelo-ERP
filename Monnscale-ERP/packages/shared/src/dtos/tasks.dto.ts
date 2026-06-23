import type { CrmEntity } from '../enums/crm-entity.enum';
import type { TaskPriority } from '../enums/task-priority.enum';

/**
 * Payload of `POST` / `PATCH /teams/:slug/tasks(/:id)`.
 */
export interface TaskUpsertDto {
  title: string;
  description?: string | null;
  dueAt?: string | null;
  priority: TaskPriority;
  assigneeId?: string | null;
  taskableType?: CrmEntity | null;
  taskableId?: string | null;
}

/**
 * Payload of `PATCH /teams/:slug/tasks/:id/toggle`.
 */
export interface ToggleTaskDto {
  isCompleted: boolean;
}
