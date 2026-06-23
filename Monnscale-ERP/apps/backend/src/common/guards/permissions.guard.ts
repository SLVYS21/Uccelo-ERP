import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { roleHasPermission, type TeamPermission } from '@Moonscale/shared';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { AuthedRequest } from '../types/authed-request';

/**
 * Use AFTER TeamMembershipGuard. Reads @RequirePermissions(...) and asserts
 * the user's role on the active team grants every requested permission.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<TeamPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = context.switchToHttp().getRequest<AuthedRequest>();
    if (!req.team) {
      throw new ForbiddenException('No team context.');
    }

    const missing = required.filter((perm) => !roleHasPermission(req.team!.role, perm));
    if (missing.length > 0) {
      throw new ForbiddenException(`Missing permissions: ${missing.join(', ')}.`);
    }
    return true;
  }
}
