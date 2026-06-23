import type {
  CreateTeamDto,
  InviteMemberDto,
  TeamDetail,
  TeamRef,
  UpdateMemberRoleDto,
  UpdateTeamDto,
} from '@Moonscale/shared';
import { api } from '@/lib/api';

export const TeamsApi = {
  list: () => api.get<TeamRef[]>('/teams').then((r) => r.data),
  create: (dto: CreateTeamDto) => api.post<TeamRef>('/teams', dto).then((r) => r.data),
  switch: (teamId: string) => api.post('/teams/switch', { teamId }),
  detail: (slug: string) => api.get<TeamDetail>(`/teams/${slug}`).then((r) => r.data),
  update: (slug: string, dto: UpdateTeamDto) => api.patch<TeamRef>(`/teams/${slug}`, dto).then((r) => r.data),
  remove: (slug: string) => api.delete(`/teams/${slug}`),
  invite: (slug: string, dto: InviteMemberDto) => api.post(`/teams/${slug}/invitations`, dto),
  cancelInvitation: (slug: string, id: string) => api.delete(`/teams/${slug}/invitations/${id}`),
  updateMemberRole: (slug: string, memberId: string, dto: UpdateMemberRoleDto) =>
    api.patch(`/teams/${slug}/members/${memberId}`, dto),
  removeMember: (slug: string, memberId: string) => api.delete(`/teams/${slug}/members/${memberId}`),
  acceptInvitation: (code: string) => api.post<TeamRef>('/teams/invitations/accept', { code }).then((r) => r.data),
};
