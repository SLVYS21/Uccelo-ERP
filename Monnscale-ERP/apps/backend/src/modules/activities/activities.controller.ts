import { Body, Controller, Delete, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedTeam, AuthenticatedUser } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/activities')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ManageCrmRecords)
export class ActivitiesController {
  constructor(private readonly activities: ActivitiesService) {}

  @Post()
  create(
    @CurrentTeam() team: AuthenticatedTeam,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateActivityDto,
  ) {
    return this.activities.create(team.id, user.id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.activities.remove(team.id, id);
  }
}
