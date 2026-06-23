import type { TeamRole } from '../enums/team-role.enum';
import type { TeamPermission } from '../enums/team-permission.enum';

/**
 * Minimal team reference used in lists, switchers and the auth payload.
 */
export interface TeamRef {
  id: string;
  name: string;
  slug: string;
  isPersonal: boolean;
}

/**
 * A user's membership on a team, as exposed by the API (joins the underlying
 * `Membership` row with the related `User`).
 */
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: TeamRole;
  joinedAt: string;
}

/**
 * A pending invitation on a team. The `code` field is omitted from API
 * responses; the frontend only receives invitation metadata.
 */
export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: { id: string; name: string } | null;
  expiresAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

/**
 * Full team detail returned by `GET /teams/:slug`, including the viewer's
 * role + granted permissions and the membership / invitation lists used by
 * the team management UI.
 */
export interface TeamDetail extends TeamRef {
  myRole: TeamRole;
  permissions: TeamPermission[];
  members: TeamMember[];
  invitations: TeamInvitation[];
}
