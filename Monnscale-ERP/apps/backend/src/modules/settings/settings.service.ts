import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { UpdateLocaleDto, UpdatePasswordDto, UpdateProfileDto } from './dto';
import { TokenService } from '../auth/token.service';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<void> {
    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: userId } },
      });
      if (existing) throw new BadRequestException('Email is already in use.');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { name: dto.name, email: dto.email, emailVerifiedAt: null },
    });
  }

  async updatePassword(userId: string, dto: UpdatePasswordDto): Promise<void> {
    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException('Passwords do not match.');
    }
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const ok = await argon2.verify(user.password, dto.currentPassword);
    if (!ok) throw new UnauthorizedException('Current password is incorrect.');
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: await argon2.hash(dto.password) },
    });
    await this.tokens.revokeAllForUser(userId);
  }

  async updateLocale(userId: string, dto: UpdateLocaleDto): Promise<void> {
    await this.prisma.user.update({ where: { id: userId }, data: { locale: dto.locale } });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({ where: { id: userId } });
  }
}
