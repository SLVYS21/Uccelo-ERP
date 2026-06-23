import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { TasksService } from './tasks.service';
import { TaskUpsertDto, ToggleTaskDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/tasks')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ViewCrm)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  list(
    @CurrentTeam() team: AuthenticatedTeam,
    @Query() raw: { page?: string; pageSize?: string; assigneeId?: string; completed?: string },
  ) {
    return this.tasks.list(team.id, {
      page: raw.page ? Number(raw.page) : undefined,
      pageSize: raw.pageSize ? Number(raw.pageSize) : undefined,
      assigneeId: raw.assigneeId,
      completed:
        raw.completed === undefined ? undefined : raw.completed === 'true',
    });
  }

  @Post()
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  create(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: TaskUpsertDto) {
    return this.tasks.create(team.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  update(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: TaskUpsertDto) {
    return this.tasks.update(team.id, id, dto);
  }

  @Patch(':id/toggle')
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  toggle(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: ToggleTaskDto) {
    return this.tasks.toggle(team.id, id, dto.isCompleted);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.tasks.remove(team.id, id);
  }
}
