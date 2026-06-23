import { TeamPermission } from './team-permission.enum';

/**
 * Membership role on a team. Three levels, ordered by hierarchy:
 *   Owner > Admin > Member
 *
 * - `Owner` is created with the team and cannot be reassigned through
 *   invitations or member-role updates (see `ASSIGNABLE_ROLES`).
 * - `Admin` can manage the team and its members.
 * - `Member` can use the CRM but cannot change administrative settings.
 */
export const TeamRole = {
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member',
} as const;

export type TeamRole = typeof TeamRole[keyof typeof TeamRole];

/**
 * Roles that can be assigned via invitations or member updates. Owner is
 * excluded — ownership transfer requires a dedicated flow.
 */
export const ASSIGNABLE_ROLES: readonly TeamRole[] = [TeamRole.Admin, TeamRole.Member];

/**
 * Numeric hierarchy used to compare roles ("is role X at least role Y?").
 * Higher value = more privileges.
 */
export const ROLE_HIERARCHY: Record<TeamRole, number> = {
  [TeamRole.Member]: 1,
  [TeamRole.Admin]: 2,
  [TeamRole.Owner]: 3,
};

const ROLE_PERMISSIONS: Record<TeamRole, readonly TeamPermission[]> = {
  [TeamRole.Owner]: [
    TeamPermission.ManageTeam,
    TeamPermission.ManageMembers,
    TeamPermission.ViewCrm,
    TeamPermission.ManageCrmRecords,
    TeamPermission.ManageCustomFields,
    TeamPermission.ManagePipelines,
    TeamPermission.UseAssistant,
  ],
  [TeamRole.Admin]: [
    TeamPermission.ManageTeam,
    TeamPermission.ManageMembers,
    TeamPermission.ViewCrm,
    TeamPermission.ManageCrmRecords,
    TeamPermission.ManageCustomFields,
    TeamPermission.ManagePipelines,
    TeamPermission.UseAssistant,
  ],
  [TeamRole.Member]: [
    TeamPermission.ViewCrm,
    TeamPermission.ManageCrmRecords,
    TeamPermission.UseAssistant,
  ],
};

/**
 * Returns the full set of permissions granted by `role`. The list is
 * deduplicated and returned in a stable order.
 */
export function permissionsForRole(role: TeamRole): TeamPermission[] {
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

/**
 * `true` if `role` grants `permission`.
 */
export function roleHasPermission(role: TeamRole, permission: TeamPermission): boolean {
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

/**
 * `true` if `role` is hierarchically equal to or higher than `minimum`.
 */
export function roleIsAtLeast(role: TeamRole, minimum: TeamRole): boolean {
  return (ROLE_HIERARCHY[role] ?? 0) >= (ROLE_HIERARCHY[minimum] ?? 0);
}
