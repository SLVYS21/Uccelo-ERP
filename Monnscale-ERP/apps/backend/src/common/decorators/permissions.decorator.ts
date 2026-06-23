import { SetMetadata } from '@nestjs/common';
import type { TeamPermission } from '@Moonscale/shared';

export const PERMISSIONS_KEY = 'requiredPermissions';
export const RequirePermissions = (...permissions: TeamPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
