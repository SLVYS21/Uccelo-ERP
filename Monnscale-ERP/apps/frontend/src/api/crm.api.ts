import type {
  ActivityItem,
  AssistantMessage,
  AssistantReply,
  BoardStage,
  CompanyDetail,
  CompanyListItem,
  CompanyUpsertDto,
  ContactDetail,
  ContactListItem,
  ContactUpsertDto,
  CreateActivityDto,
  CrmEntity,
  CustomFieldDefinition,
  CustomFieldUpsertDto,
  DashboardPage,
  DealDetail,
  DealUpsertDto,
  MoveDealDto,
  Paginated,
  PicklistOptionItem,
  PicklistOptionUpsertDto,
  PipelineRef,
  PipelineStageUpsertDto,
  PipelineWithStages,
  Picklist,
  ReorderCustomFieldsDto,
  ReorderPicklistDto,
  ReorderStagesDto,
  TaskItem,
  TaskUpsertDto,
} from '@Moonscale/shared';
import { api } from '@/lib/api';

const t = (slug: string) => `/teams/${slug}`;

// ----- Companies -----
export const CompaniesApi = {
  list: (slug: string, params: { page?: number; pageSize?: number; search?: string } = {}) =>
    api.get<Paginated<CompanyListItem>>(`${t(slug)}/companies`, { params }).then((r) => r.data),
  show: (slug: string, id: string) => api.get<CompanyDetail>(`${t(slug)}/companies/${id}`).then((r) => r.data),
  create: (slug: string, dto: CompanyUpsertDto) => api.post<CompanyDetail>(`${t(slug)}/companies`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: CompanyUpsertDto) =>
    api.patch<CompanyDetail>(`${t(slug)}/companies/${id}`, dto).then((r) => r.data),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/companies/${id}`),
};

// ----- Contacts -----
export const ContactsApi = {
  list: (slug: string, params: { page?: number; pageSize?: number; search?: string } = {}) =>
    api.get<Paginated<ContactListItem>>(`${t(slug)}/contacts`, { params }).then((r) => r.data),
  show: (slug: string, id: string) => api.get<ContactDetail>(`${t(slug)}/contacts/${id}`).then((r) => r.data),
  create: (slug: string, dto: ContactUpsertDto) =>
    api.post<ContactDetail>(`${t(slug)}/contacts`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: ContactUpsertDto) =>
    api.patch<ContactDetail>(`${t(slug)}/contacts/${id}`, dto).then((r) => r.data),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/contacts/${id}`),
};

// ----- Pipelines -----
export const PipelinesApi = {
  list: (slug: string) => api.get<PipelineWithStages[]>(`${t(slug)}/pipelines`).then((r) => r.data),
  addStage: (slug: string, pipelineId: string, dto: PipelineStageUpsertDto) =>
    api.post(`${t(slug)}/pipelines/${pipelineId}/stages`, dto).then((r) => r.data),
  updateStage: (slug: string, stageId: string, dto: PipelineStageUpsertDto) =>
    api.patch(`${t(slug)}/pipelines/stages/${stageId}`, dto).then((r) => r.data),
  removeStage: (slug: string, stageId: string) => api.delete(`${t(slug)}/pipelines/stages/${stageId}`),
  reorder: (slug: string, dto: ReorderStagesDto) => api.patch(`${t(slug)}/pipelines/stages/reorder`, dto),
};

// ----- Deals -----
type BoardResponse = { pipeline: PipelineRef; pipelines: PipelineRef[]; stages: BoardStage[] };
export const DealsApi = {
  board: (slug: string, pipelineId?: string) =>
    api.get<BoardResponse>(`${t(slug)}/deals/board`, { params: { pipelineId } }).then((r) => r.data),
  show: (slug: string, id: string) => api.get<DealDetail>(`${t(slug)}/deals/${id}`).then((r) => r.data),
  create: (slug: string, dto: DealUpsertDto) => api.post<DealDetail>(`${t(slug)}/deals`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: DealUpsertDto) =>
    api.patch<DealDetail>(`${t(slug)}/deals/${id}`, dto).then((r) => r.data),
  move: (slug: string, id: string, dto: MoveDealDto) => api.patch(`${t(slug)}/deals/${id}/move`, dto),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/deals/${id}`),
};

// ----- Tasks -----
export const TasksApi = {
  list: (slug: string, params: { page?: number; assigneeId?: string; completed?: boolean } = {}) =>
    api.get<Paginated<TaskItem>>(`${t(slug)}/tasks`, { params }).then((r) => r.data),
  create: (slug: string, dto: TaskUpsertDto) => api.post<TaskItem>(`${t(slug)}/tasks`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: TaskUpsertDto) =>
    api.patch<TaskItem>(`${t(slug)}/tasks/${id}`, dto).then((r) => r.data),
  toggle: (slug: string, id: string, isCompleted: boolean) =>
    api.patch(`${t(slug)}/tasks/${id}/toggle`, { isCompleted }),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/tasks/${id}`),
};

// ----- Activities -----
export const ActivitiesApi = {
  create: (slug: string, dto: CreateActivityDto) => api.post<ActivityItem>(`${t(slug)}/activities`, dto).then((r) => r.data),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/activities/${id}`),
};

// ----- Custom Fields -----
export const CustomFieldsApi = {
  byEntity: (slug: string, entityType: CrmEntity) =>
    api.get<CustomFieldDefinition[]>(`${t(slug)}/custom-fields`, { params: { entityType } }).then((r) => r.data),
  all: (slug: string) =>
    api.get<Record<CrmEntity, CustomFieldDefinition[]>>(`${t(slug)}/custom-fields`).then((r) => r.data),
  create: (slug: string, dto: CustomFieldUpsertDto) =>
    api.post<CustomFieldDefinition>(`${t(slug)}/custom-fields`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: CustomFieldUpsertDto) =>
    api.patch<CustomFieldDefinition>(`${t(slug)}/custom-fields/${id}`, dto).then((r) => r.data),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/custom-fields/${id}`),
  reorder: (slug: string, dto: ReorderCustomFieldsDto) => api.patch(`${t(slug)}/custom-fields/reorder`, dto),
};

// ----- Picklists -----
export const PicklistsApi = {
  list: (slug: string) => api.get<Record<Picklist, PicklistOptionItem[]>>(`${t(slug)}/picklists`).then((r) => r.data),
  create: (slug: string, dto: PicklistOptionUpsertDto) =>
    api.post<PicklistOptionItem>(`${t(slug)}/picklists`, dto).then((r) => r.data),
  update: (slug: string, id: string, dto: PicklistOptionUpsertDto) =>
    api.patch<PicklistOptionItem>(`${t(slug)}/picklists/${id}`, dto).then((r) => r.data),
  remove: (slug: string, id: string) => api.delete(`${t(slug)}/picklists/${id}`),
  reorder: (slug: string, dto: ReorderPicklistDto) => api.patch(`${t(slug)}/picklists/reorder`, dto),
};

// ----- Dashboard -----
export const DashboardApi = {
  page: (slug: string, params: { from?: string; to?: string } = {}) =>
    api.get<DashboardPage>(`${t(slug)}/dashboard`, { params }).then((r) => r.data),
};

// ----- Assistant -----
export const AssistantApi = {
  chat: (slug: string, history: AssistantMessage[]) =>
    api.post<AssistantReply>(`${t(slug)}/assistant/chat`, { history }).then((r) => r.data),
};
