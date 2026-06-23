import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import {
  ASSIGNABLE_ROLES,
  permissionsForRole,
  TeamRole,
  type TeamDetail,
  type TeamMember,
  type TeamRef,
} from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { generateUniqueTeamSlug } from '../../common/utils/slug';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<TeamRef[]> {
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { team: true },
      orderBy: { createdAt: 'asc' },
    });
    return memberships
      .filter((m) => !m.team.deletedAt)
      .map((m) => ({
        id: m.team.id,
        name: m.team.name,
        slug: m.team.slug,
        isPersonal: m.team.isPersonal,
      }));
  }

  async create(userId: string, name: string): Promise<TeamRef> {
    const slug = await generateUniqueTeamSlug(this.prisma, name);
    const team = await this.prisma.$transaction(async (tx) => {
      const t = await tx.team.create({ data: { name, slug, isPersonal: false } });
      await tx.membership.create({ data: { teamId: t.id, userId, role: TeamRole.Owner } });
      return t;
    });
    return { id: team.id, name: team.name, slug: team.slug, isPersonal: team.isPersonal };
  }

  async rename(teamId: string, userId: string, name: string): Promise<TeamRef> {
    await this.requireRole(teamId, userId, TeamRole.Admin);
    const slug = await generateUniqueTeamSlug(this.prisma, name, teamId);
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: { name, slug },
    });
    return { id: team.id, name: team.name, slug: team.slug, isPersonal: team.isPersonal };
  }

  async remove(teamId: string, userId: string): Promise<void> {
    await this.requireRole(teamId, userId, TeamRole.Owner);
    const team = await this.prisma.team.findUniqueOrThrow({ where: { id: teamId } });
    if (team.isPersonal) {
      throw new BadRequestException('You cannot delete a personal team.');
    }
    await this.prisma.team.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    });
  }

  async switchActiveTeam(userId: string, teamId: string): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) throw new ForbiddenException('You are not a member of this team.');
    await this.prisma.user.update({ where: { id: userId }, data: { currentTeamId: teamId } });
  }

  async detail(teamId: string, userId: string): Promise<TeamDetail> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        memberships: { include: { user: true }, orderBy: { createdAt: 'asc' } },
        invitations: { include: { invitedBy: true }, orderBy: { createdAt: 'desc' } },
      },
    });
    if (!team) throw new NotFoundException('Team not found.');

    const me = team.memberships.find((m) => m.userId === userId);
    if (!me) throw new ForbiddenException('You are not a member of this team.');

    const role = me.role as TeamRole;
    const members: TeamMember[] = team.memberships.map((m) => ({
      id: m.id,
      userId: m.user.id,
      name: m.user.name,
      email: m.user.email,
      role: m.role as TeamRole,
      joinedAt: m.createdAt.toISOString(),
    }));

    return {
      id: team.id,
      name: team.name,
      slug: team.slug,
      isPersonal: team.isPersonal,
      myRole: role,
      permissions: permissionsForRole(role),
      members,
      invitations: team.invitations.map((inv) => ({
        id: inv.id,
        teamId: inv.teamId,
        email: inv.email,
        role: inv.role as TeamRole,
        invitedBy: inv.invitedBy ? { id: inv.invitedBy.id, name: inv.invitedBy.name } : null,
        expiresAt: inv.expiresAt?.toISOString() ?? null,
        acceptedAt: inv.acceptedAt?.toISOString() ?? null,
        createdAt: inv.createdAt.toISOString(),
      })),
    };
  }

  async inviteMember(teamId: string, inviterId: string, email: string, role: TeamRole): Promise<void> {
    await this.requireRole(teamId, inviterId, TeamRole.Admin);
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new BadRequestException('Cannot assign this role.');
    }
    const code = randomBytes(24).toString('hex');
    await this.prisma.teamInvitation.create({
      data: {
        code,
        teamId,
        email,
        role,
        invitedById: inviterId,
        expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    // TODO: send email — kept as a log mailer entry for now.
  }

  async cancelInvitation(teamId: string, userId: string, invitationId: string): Promise<void> {
    await this.requireRole(teamId, userId, TeamRole.Admin);
    await this.prisma.teamInvitation.delete({ where: { id: invitationId } });
  }

  async acceptInvitation(userId: string, code: string): Promise<TeamRef> {
    const invitation = await this.prisma.teamInvitation.findUnique({ where: { code } });
    if (!invitation || invitation.acceptedAt) {
      throw new NotFoundException('Invitation not found or already used.');
    }
    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired.');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      throw new ForbiddenException('This invitation was sent to a different email.');
    }
    const team = await this.prisma.$transaction(async (tx) => {
      await tx.membership.upsert({
        where: { teamId_userId: { teamId: invitation.teamId, userId } },
        update: { role: invitation.role },
        create: { teamId: invitation.teamId, userId, role: invitation.role },
      });
      await tx.teamInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });
      await tx.user.update({ where: { id: userId }, data: { currentTeamId: invitation.teamId } });
      return tx.team.findUniqueOrThrow({ where: { id: invitation.teamId } });
    });
    return { id: team.id, name: team.name, slug: team.slug, isPersonal: team.isPersonal };
  }

  async updateMemberRole(teamId: string, userId: string, memberId: string, role: TeamRole): Promise<void> {
    await this.requireRole(teamId, userId, TeamRole.Admin);
    if (!ASSIGNABLE_ROLES.includes(role)) {
      throw new BadRequestException('Cannot assign this role.');
    }
    const membership = await this.prisma.membership.findUnique({ where: { id: memberId } });
    if (!membership || membership.teamId !== teamId) {
      throw new NotFoundException('Member not found.');
    }
    if (membership.role === TeamRole.Owner) {
      throw new ForbiddenException("Cannot modify the team owner's role.");
    }
    await this.prisma.membership.update({ where: { id: memberId }, data: { role } });
  }

  async removeMember(teamId: string, userId: string, memberId: string): Promise<void> {
    await this.requireRole(teamId, userId, TeamRole.Admin);
    const membership = await this.prisma.membership.findUnique({ where: { id: memberId } });
    if (!membership || membership.teamId !== teamId) {
      throw new NotFoundException('Member not found.');
    }
    if (membership.role === TeamRole.Owner) {
      throw new ForbiddenException('Cannot remove the team owner.');
    }
    await this.prisma.membership.delete({ where: { id: memberId } });
  }

  private async requireRole(teamId: string, userId: string, minimum: TeamRole): Promise<void> {
    const membership = await this.prisma.membership.findUnique({
      where: { teamId_userId: { teamId, userId } },
    });
    if (!membership) throw new ForbiddenException('Not a member of this team.');
    const role = membership.role as TeamRole;
    const order = { [TeamRole.Member]: 1, [TeamRole.Admin]: 2, [TeamRole.Owner]: 3 };
    if (order[role] < order[minimum]) {
      throw new ForbiddenException(`Requires role ${minimum} or higher.`);
    }
  }
}
