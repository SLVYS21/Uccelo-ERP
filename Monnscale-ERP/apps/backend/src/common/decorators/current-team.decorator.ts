import { createParamDecorator, ExecutionContext, ForbiddenException } from '@nestjs/common';
import type { AuthedRequest, AuthenticatedTeam } from '../types/authed-request';

export const CurrentTeam = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedTeam => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    if (!req.team) {
      throw new ForbiddenException('No team context. Use TeamMembershipGuard.');
    }
    return req.team;
  },
);
