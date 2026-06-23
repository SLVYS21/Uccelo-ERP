import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { TeamPermission } from '@Moonscale/shared';
import { CompaniesService } from './companies.service';
import { CompanyUpsertDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import type { AuthenticatedTeam } from '../../common/types/authed-request';

@Controller('teams/:teamSlug/companies')
@UseGuards(TeamMembershipGuard, PermissionsGuard)
@RequirePermissions(TeamPermission.ViewCrm)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list(@CurrentTeam() team: AuthenticatedTeam, @Query() params: { page?: number; pageSize?: number; search?: string }) {
    return this.companies.list(team.id, params);
  }

  @Get(':id')
  show(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.companies.show(team.id, id);
  }

  @Post()
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  create(@CurrentTeam() team: AuthenticatedTeam, @Body() dto: CompanyUpsertDto) {
    return this.companies.create(team.id, dto);
  }

  @Patch(':id')
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  update(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string, @Body() dto: CompanyUpsertDto) {
    return this.companies.update(team.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @RequirePermissions(TeamPermission.ManageCrmRecords)
  remove(@CurrentTeam() team: AuthenticatedTeam, @Param('id') id: string) {
    return this.companies.remove(team.id, id);
  }
}
