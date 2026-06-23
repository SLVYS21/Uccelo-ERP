import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { TeamRole, type LoginResponse, type AuthUser } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { TokenService } from './token.service';
import { PipelinesService } from '../pipelines/pipelines.service';
import { PicklistsService } from '../picklists/picklists.service';
import { generateUniqueTeamSlug } from '../../common/utils/slug';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly pipelines: PipelinesService,
    private readonly picklists: PicklistsService,
  ) {}

  /**
   * Mirrors RegisterUser use case: creates the user + their personal team in
   * one transaction so the user always lands on a usable workspace.
   */
  async register(input: { name: string; email: string; password: string }, ctx: { ip?: string; userAgent?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const passwordHash = await argon2.hash(input.password);

    const { user, teamId } = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: { name: input.name, email: input.email, password: passwordHash, locale: 'fr' },
      });

      const slug = await generateUniqueTeamSlug(this.prisma, `${input.name}'s team`);
      const team = await tx.team.create({
        data: { name: `${input.name}'s team`, slug, isPersonal: true },
      });
      await tx.membership.create({
        data: { teamId: team.id, userId: created.id, role: TeamRole.Owner },
      });
      const updated = await tx.user.update({
        where: { id: created.id },
        data: { currentTeamId: team.id },
      });
      return { user: updated, teamId: team.id };
    });

    // Seed the workspace so new users land on a functional CRM.
    await this.pipelines.ensureDefaultForTeam(teamId);
    await this.picklists.ensureDefaults(teamId);

    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    return { user: await this.toAuthUser(user.id), tokens } satisfies LoginResponse;
  }

  async login(input: { email: string; password: string }, ctx: { ip?: string; userAgent?: string }): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials.');
    const ok = await argon2.verify(user.password, input.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials.');

    const tokens = await this.tokens.issue(user.id, user.email, ctx);
    return { user: await this.toAuthUser(user.id), tokens };
  }

  async refresh(rawRefresh: string, ctx: { ip?: string; userAgent?: string }) {
    return this.tokens.rotate(rawRefresh, ctx);
  }

  async logout(rawRefresh: string): Promise<void> {
    await this.tokens.revoke(rawRefresh);
  }

  async me(userId: string): Promise<AuthUser> {
    return this.toAuthUser(userId);
  }

  private async toAuthUser(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { currentTeam: true },
    });
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
      locale: user.locale,
      twoFactorEnabled: Boolean(user.twoFactorConfirmedAt),
      currentTeamId: user.currentTeamId,
      currentTeam: user.currentTeam
        ? {
            id: user.currentTeam.id,
            name: user.currentTeam.name,
            slug: user.currentTeam.slug,
            isPersonal: user.currentTeam.isPersonal,
          }
        : null,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
