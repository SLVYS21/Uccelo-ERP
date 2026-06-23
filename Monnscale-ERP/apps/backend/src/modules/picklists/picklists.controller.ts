import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { PicklistsService } from './picklists.service';
import { PicklistOptionUpsertDto, ReorderPicklistDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/picklists')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ManageCustomFields)
export class PicklistsController {
  constructor(private readonly picklists: PicklistsService) {}

  @Get()
  list(@CurrentTeam() team: AuthenticatedTeam) {
    return this.picklists.list(team.id);
  }

  @Post()
  create(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: PicklistOptionUpsertDto) {
    return this.picklists.create(team.id, dto);
  }

  @Patch('reorder')
  @HttpCode(204)
  reorder(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: ReorderPicklistDto) {
    return this.picklists.reorder(team.id, dto.picklist, dto.orderedIds);
  }

  @Patch(':id')
  update(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: PicklistOptionUpsertDto) {
    return this.picklists.update(team.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.picklists.remove(team.id, id);
  }
}
