import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes } from 'crypto';
import type { AuthTokens } from '@Moonscale/shared';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issue(userId: string, email: string, ctx: { ip?: string; userAgent?: string } = {}): Promise<AuthTokens> {
    const accessTtl = Number(this.config.get<string>('JWT_ACCESS_TTL') ?? 900);
    const refreshTtl = Number(this.config.get<string>('JWT_REFRESH_TTL') ?? 60 * 60 * 24 * 30);

    const accessToken = await this.jwt.signAsync({ sub: userId, email }, { expiresIn: accessTtl });

    const rawRefresh = randomBytes(48).toString('hex');
    const tokenHash = this.hash(rawRefresh);
    const refreshExpiresAt = new Date(Date.now() + refreshTtl * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: refreshExpiresAt,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefresh,
      accessTokenExpiresAt: new Date(Date.now() + accessTtl * 1000).toISOString(),
      refreshTokenExpiresAt: refreshExpiresAt.toISOString(),
    };
  }

  async rotate(rawRefresh: string, ctx: { ip?: string; userAgent?: string } = {}): Promise<AuthTokens> {
    const tokenHash = this.hash(rawRefresh);
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new Error('Invalid refresh token.');
    }
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
    return this.issue(user.id, user.email, ctx);
  }

  async revoke(rawRefresh: string): Promise<void> {
    const tokenHash = this.hash(rawRefresh);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
