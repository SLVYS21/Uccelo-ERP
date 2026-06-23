import type { CustomFieldValues } from '../types/crm.types';

/**
 * Payload of `POST` / `PATCH /teams/:slug/deals(/:id)`.
 */
export interface DealUpsertDto {
  name: string;
  pipelineId: string;
  pipelineStageId: string;
  amount?: number | null;
  currency?: string | null;
  companyId?: string | null;
  contactId?: string | null;
  ownerId?: string | null;
  expectedCloseDate?: string | null;
  customFields?: CustomFieldValues;
}

/**
 * Payload of `PATCH /teams/:slug/deals/:id/move`. Sent when a card is
 * dropped onto another stage in the kanban board.
 */
export interface MoveDealDto {
  pipelineStageId: string;
  position: number;
}
