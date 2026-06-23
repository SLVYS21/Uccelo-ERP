import type { CustomFieldValues } from '../types/crm.types';

/**
 * Payload of `POST` / `PATCH /teams/:slug/contacts(/:id)`.
 */
export interface ContactUpsertDto {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  companyId?: string | null;
  ownerId?: string | null;
  customFields?: CustomFieldValues;
}
