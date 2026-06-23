import type { CrmEntity } from '../enums/crm-entity.enum';

/**
 * Payload of `POST /teams/:slug/activities`. Logged against the host record
 * identified by (`subjectableType`, `subjectableId`).
 */
export interface CreateActivityDto {
  type: string;
  subject?: string | null;
  body?: string | null;
  occurredAt: string;
  subjectableType: CrmEntity;
  subjectableId: string;
}
