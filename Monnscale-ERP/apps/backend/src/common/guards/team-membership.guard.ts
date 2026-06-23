import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { TeamRole } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import type { AuthedRequest } from '../types/authed-request';

/**
 * Resolves the active team for the request, validates the user is a member,
 * and exposes (id, slug, role) via @CurrentTeam.
 *
 * The team identifier is taken from (in order):
 *   1. req.params.teamSlug   (typical for /api/v1/teams/:teamSlug/...)
 *   2. req.headers['x-team-slug']
 *   3. user.currentTeamId    (fallback)
 *
 * Mirrors the Laravel EnsureTeamMembership middleware + BelongsToTeam global
 * scope: any service called downstream MUST filter by team.id.
 */
@Injectable()
export class TeamMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.user) {
      throw new ForbiddenException('Authentication required.');
    }

    const slug =
      (req.params as Record<string, string | undefined>)?.teamSlug ??
      (req.headers['x-team-slug'] as string | undefined);

    const team = slug
      ? await this.prisma.team.findUnique({ where: { slug } })
      : req.user.currentTeamId
        ? await this.prisma.team.findUnique({ where: { id: req.user.currentTeamId } })
        : null;

    if (!team) {
      throw new ForbiddenException('No team context.');
    }

    const membership = await this.prisma.membership.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: req.user.id } },
    });
    if (!membership) {
      throw new ForbiddenException('You are not a member of this team.');
    }

    if (req.user.currentTeamId !== team.id) {
      await this.prisma.user.update({
        where: { id: req.user.id },
        data: { currentTeamId: team.id },
      });
      req.user.currentTeamId = team.id;
    }

    req.team = { id: team.id, slug: team.slug, role: membership.role as TeamRole };
    return true;
  }
}
