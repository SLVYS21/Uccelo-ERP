import type { CrmEntity } from '../enums/crm-entity.enum';
import type { CustomFieldType } from '../enums/custom-field-type.enum';
import type { CustomFieldOptions } from '../types/crm.types';

/**
 * Payload of `POST` / `PATCH /teams/:slug/custom-fields(/:id)`.
 */
export interface CustomFieldUpsertDto {
  entityType: CrmEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options?: CustomFieldOptions | null;
  isRequired?: boolean;
  isFilterable?: boolean;
  helpText?: string | null;
}

/**
 * Payload of `PATCH /teams/:slug/custom-fields/reorder`.
 */
export interface ReorderCustomFieldsDto {
  entityType: CrmEntity;
  orderedIds: string[];
}
