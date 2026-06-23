import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { DashboardService } from './dashboard.service';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/dashboard')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ViewCrm)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  page(@CurrentTeam() team: AuthenticatedTeam, @Query() range: { from?: string; to?: string }) {
    return this.dashboard.page(team.id, range);
  }
}
