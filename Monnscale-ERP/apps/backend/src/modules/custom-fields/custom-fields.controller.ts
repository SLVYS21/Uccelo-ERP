import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CrmEntity, TeamPermission } from '@Moonscale/shared';
import { CustomFieldsService } from './custom-fields.service';
import { CustomFieldUpsertDto, ReorderCustomFieldsDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/custom-fields')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ManageCustomFields)
export class CustomFieldsController {
  constructor(private readonly fields: CustomFieldsService) {}

  @Get()
  list(@CurrentTeam() team: AuthenticatedTeam, @Query('entityType') entityType?: CrmEntity) {
    if (entityType) return this.fields.definitionsByEntity(team.id, entityType);
    return this.fields.listAll(team.id);
  }

  @Post()
  create(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: CustomFieldUpsertDto) {
    return this.fields.create(team.id, dto);
  }

  @Patch('reorder')
  @HttpCode(204)
  reorder(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: ReorderCustomFieldsDto) {
    return this.fields.reorder(team.id, dto.entityType, dto.orderedIds);
  }

  @Patch(':id')
  update(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: CustomFieldUpsertDto) {
    return this.fields.update(team.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.fields.remove(team.id, id);
  }
}
