import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { DealsService } from './deals.service';
import { DealUpsertDto, MoveDealDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/deals')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ViewCrm)
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get('board')
  board(@CurrentTeam() team: AuthenticatedTeam, @Query('pipelineId') pipelineId?: string) {
    return this.deals.board(team.id, pipelineId ?? null);
  }

  @Get(':id')
  show(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.deals.show(team.id, id);
  }

  @Post()
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  create(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: DealUpsertDto) {
    return this.deals.create(team.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  update(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: DealUpsertDto) {
    return this.deals.update(team.id, id, dto);
  }

  @Patch(':id/move')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  move(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: MoveDealDto) {
    return this.deals.move(team.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.deals.remove(team.id, id);
  }
}
