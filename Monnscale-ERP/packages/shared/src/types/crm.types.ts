import type { CrmEntity } from '../enums/crm-entity.enum';
import type { CustomFieldType } from '../enums/custom-field-type.enum';
import type { DealStatus } from '../enums/deal-status.enum';
import type { Picklist } from '../enums/picklist.enum';
import type { TaskPriority } from '../enums/task-priority.enum';

// ----------------------------------------------------------------------
// Custom fields
// ----------------------------------------------------------------------

/**
 * One choice in a `Select` / `MultiSelect` custom field definition.
 */
export interface CustomFieldChoice {
  value: string;
  label: string;
  color?: string | null;
}

/**
 * Configuration payload of a custom field definition. Stored as JSON.
 */
export interface CustomFieldOptions {
  choices?: CustomFieldChoice[];
  relatedModule?: CrmEntity;
}

/**
 * Runtime value of a single custom field on a host record. Kept as a permissive
 * union because the actual TypeScript type depends on the definition's `type`.
 */
export type CustomFieldValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | null
  | undefined;

/**
 * Map of `field key -> value` stored under `customFields` on host records.
 */
export type CustomFieldValues = Record<string, CustomFieldValue>;

/**
 * Team-scoped custom field definition. The frontend reads these to render
 * dynamic form fields and to display values on detail pages.
 */
export interface CustomFieldDefinition {
  id: string;
  entityType: CrmEntity;
  key: string;
  label: string;
  type: CustomFieldType;
  options: CustomFieldOptions | null;
  isRequired: boolean;
  isFilterable: boolean;
  position: number;
  helpText: string | null;
}

// ----------------------------------------------------------------------
// Companies
// ----------------------------------------------------------------------

/**
 * Minimal projection used in list / table views and in relations
 * (e.g. `DealCard.company`).
 */
export interface CompanyListItem {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  city: string | null;
  phone: string | null;
  owner: { id: string; name: string } | null;
}

/**
 * Full projection used on the company detail page.
 */
export interface CompanyDetail extends CompanyListItem {
  website: string | null;
  address: string | null;
  postalCode: string | null;
  country: string | null;
  ownerId: string | null;
  customFields: CustomFieldValues;
  createdAt: string;
}

// ----------------------------------------------------------------------
// Contacts
// ----------------------------------------------------------------------

export interface ContactListItem {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  jobTitle: string | null;
  company: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
}

export interface ContactDetail extends ContactListItem {
  companyId: string | null;
  ownerId: string | null;
  customFields: CustomFieldValues;
  createdAt: string;
}

// ----------------------------------------------------------------------
// Pipelines + deals
// ----------------------------------------------------------------------

export interface PipelineRef {
  id: string;
  name: string;
}

export interface PipelineStageRef {
  id: string;
  name: string;
  key: string;
  color: string | null;
  position: number;
  isWon: boolean;
  isLost: boolean;
}

export interface PipelineWithStages extends PipelineRef {
  stages: PipelineStageRef[];
}

/**
 * Card-shaped projection used on the kanban board (one column per stage,
 * one card per deal).
 */
export interface DealCard {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  position: number;
  company: { id: string; name: string } | null;
  contact: { id: string; name: string } | null;
  owner: { id: string; name: string } | null;
}

/**
 * Column data for the kanban board: the stage metadata plus the deals
 * currently in it and the running total of their amounts.
 */
export interface BoardStage {
  id: string;
  name: string;
  key: string;
  color: string | null;
  isWon: boolean;
  isLost: boolean;
  totalAmount: number;
  deals: DealCard[];
}

/**
 * Full projection used on the deal detail page.
 */
export interface DealDetail {
  id: string;
  name: string;
  amount: number | null;
  currency: string;
  status: DealStatus;
  statusLabel: string;
  pipelineId: string;
  pipelineStageId: string;
  stage: { id: string; name: string; color: string | null } | null;
  companyId: string | null;
  company: { id: string; name: string } | null;
  contactId: string | null;
  contact: { id: string; name: string } | null;
  ownerId: string | null;
  owner: { id: string; name: string } | null;
  expectedCloseDate: string | null;
  closedAt: string | null;
  customFields: CustomFieldValues;
  createdAt: string;
}

// ----------------------------------------------------------------------
// Tasks
// ----------------------------------------------------------------------

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  dueAt: string | null;
  priority: TaskPriority;
  priorityLabel: string;
  isCompleted: boolean;
  completedAt: string | null;
  assignee: { id: string; name: string } | null;
  related: { type: CrmEntity; id: string; label: string } | null;
}

// ----------------------------------------------------------------------
// Activities
// ----------------------------------------------------------------------

export interface ActivityItem {
  id: string;
  type: string;
  typeLabel: string;
  subject: string | null;
  body: string | null;
  occurredAt: string;
  user: { id: string; name: string } | null;
}

// ----------------------------------------------------------------------
// Picklists
// ----------------------------------------------------------------------

export interface PicklistOptionItem {
  id: string;
  picklist: Picklist | string;
  value: string;
  label: string;
  color: string | null;
  position: number;
  isSystem: boolean;
}
