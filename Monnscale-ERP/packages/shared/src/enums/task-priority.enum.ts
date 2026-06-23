/**
 * Priority level on a task. Stored as a string for portability and to match
 * the `Task.priority` column on the backend.
 */
export const TaskPriority = {
  Low: 'low',
  Normal: 'normal',
  High: 'high',
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];
