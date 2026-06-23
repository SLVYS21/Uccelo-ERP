import type { CustomFieldValues } from '../types/crm.types';

/**
 * Payload of `POST` / `PATCH /teams/:slug/companies(/:id)`.
 */
export interface CompanyUpsertDto {
  name: string;
  domain?: string | null;
  industry?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  country?: string | null;
  ownerId?: string | null;
  customFields?: CustomFieldValues;
}
