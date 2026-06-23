import type { Picklist } from '../enums/picklist.enum';

/**
 * Payload of `POST` / `PATCH /teams/:slug/picklists(/:id)`.
 */
export interface PicklistOptionUpsertDto {
  picklist: Picklist;
  value: string;
  label: string;
  color?: string | null;
}

/**
 * Payload of `PATCH /teams/:slug/picklists/reorder`.
 */
export interface ReorderPicklistDto {
  picklist: Picklist;
  orderedIds: string[];
}
