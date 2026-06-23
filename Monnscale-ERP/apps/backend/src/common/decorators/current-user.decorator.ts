import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthedRequest, AuthenticatedUser } from '../types/authed-request';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    return req.user;
  },
);
