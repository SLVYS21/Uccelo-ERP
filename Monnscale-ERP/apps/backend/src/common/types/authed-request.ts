import type { Request } from 'express';
import type { TeamRole } from '@Moonscale/shared';

/**
 * Shape attached to req.user by JwtStrategy and req.team by TeamMembershipGuard.
 * Use the @CurrentUser and @CurrentTeam decorators in controllers instead of
 * reading req.user / req.team directly.
 */
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  currentTeamId: string | null;
};

export type AuthenticatedTeam = {
  id: string;
  slug: string;
  role: TeamRole;
};

export type AuthedRequest = Request & {
  user: AuthenticatedUser;
  team?: AuthenticatedTeam;
};
