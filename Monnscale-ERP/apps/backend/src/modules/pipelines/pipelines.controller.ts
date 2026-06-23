import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { PipelinesService } from './pipelines.service';
import { PipelineStageUpsertDto, ReorderStagesDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/pipelines')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ViewCrm)
export class PipelinesController {
  constructor(private readonly pipelines: PipelinesService) {}

  @Get()
  list(@CurrentTeam() team: AuthenticatedTeam) {
    return this.pipelines.list(team.id);
  }

  @Post(':pipelineId/stages')
  @RequirePermissions(TeamPermission.ManageCustomFields)
  addStage(@CurrentTeam() team: AuthenticatedTeam, @Param('pipelineId') pipelineId: string, @Body() dto: PipelineStageUpsertDto) {
    return this.pipelines.addStage(team.id, pipelineId, dto);
  }

  @Patch('stages/:stageId')
  @RequirePermissions(TeamPermission.ManageCustomFields)
  updateStage(@CurrentTeam() team: AuthenticatedTeam, @Param('stageId') stageId: string, @Body() dto: PipelineStageUpsertDto) {
    return this.pipelines.updateStage(team.id, stageId, dto);
  }

  @Delete('stages/:stageId')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCustomFields)
  removeStage(@CurrentTeam() team: AuthenticatedTeam, @Param('stageId') stageId: string) {
    return this.pipelines.removeStage(team.id, stageId);
  }

  @Patch('stages/reorder')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCustomFields)
  reorder(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: ReorderStagesDto) {
    return this.pipelines.reorderStages(team.id, dto.pipelineId, dto.orderedIds);
  }
}
