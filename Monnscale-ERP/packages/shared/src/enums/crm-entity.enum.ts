/**
 * Discriminator used for polymorphic relations (tasks, activities, custom
 * fields). Values must stay in lowercase singular form so they map directly
 * to the values stored in MongoDB (`taskableType`, `subjectableType`, etc.).
 */
export const CrmEntity = {
  Company: 'company',
  Contact: 'contact',
  Deal: 'deal',
  Task: 'task',
} as const;

export type CrmEntity = typeof CrmEntity[keyof typeof CrmEntity];
