/**
 * Granular permissions checked by the backend `PermissionsGuard` and the
 * frontend route guards. Stored as plain strings so they cross the JSON wire
 * cleanly and remain readable in logs.
 */
export const TeamPermission = {
  ManageTeam: 'manageTeam',
  ManageMembers: 'manageMembers',
  ViewCrm: 'viewCrm',
  ManageCrmRecords: 'manageCrmRecords',
  ManageCustomFields: 'manageCustomFields',
  ManagePipelines: 'managePipelines',
  UseAssistant: 'useAssistant',
} as const;

export type TeamPermission = typeof TeamPermission[keyof typeof TeamPermission];

export const ALL_TEAM_PERMISSIONS: readonly TeamPermission[] = Object.values(TeamPermission);
