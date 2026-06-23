import type { TeamRole } from '../enums/team-role.enum';

export interface CreateTeamDto {
  name: string;
}

export interface UpdateTeamDto {
  name?: string;
}

export interface InviteMemberDto {
  email: string;
  role: TeamRole;
}

export interface UpdateMemberRoleDto {
  role: TeamRole;
}

export interface SwitchTeamDto {
  teamId: string;
}

export interface AcceptInvitationDto {
  code: string;
}
