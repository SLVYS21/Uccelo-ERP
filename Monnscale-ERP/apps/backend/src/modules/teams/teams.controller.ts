import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import {
  AcceptInvitationDto,
  CreateTeamDto,
  InviteMemberDto,
  SwitchTeamDto,
  UpdateMemberRoleDto,
  UpdateTeamDto,
} from './dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authed-request';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.teams.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTeamDto) {
    return this.teams.create(user.id, dto.name);
  }

  @Post('switch')
  @HttpCode(204)
  async switch(@CurrentUser() user: AuthenticatedUser, @Body() dto: SwitchTeamDto): Promise<void> {
    await this.teams.switchActiveTeam(user.id, dto.teamId);
  }

  @Post('invitations/accept')
  accept(@CurrentUser() user: AuthenticatedUser, @Body() dto: AcceptInvitationDto) {
    return this.teams.acceptInvitation(user.id, dto.code);
  }

  // ----- team-scoped routes -----

  @Get(':teamSlug')
  @UseGuards(TeamMembershipGuard)
  detail(@CurrentUser() user: AuthenticatedUser, @Param('teamSlug') _slug: string) {
    return this.teams.detail(user.currentTeamId!, user.id);
  }

  @Patch(':teamSlug')
  @UseGuards(TeamMembershipGuard)
  update(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateTeamDto) {
    return this.teams.rename(user.currentTeamId!, user.id, dto.name);
  }

  @Delete(':teamSlug')
  @UseGuards(TeamMembershipGuard)
  @HttpCode(204)
  async remove(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.teams.remove(user.currentTeamId!, user.id);
  }

  @Post(':teamSlug/invitations')
  @UseGuards(TeamMembershipGuard)
  @HttpCode(204)
  async invite(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteMemberDto): Promise<void> {
    await this.teams.inviteMember(user.currentTeamId!, user.id, dto.email, dto.role);
  }

  @Delete(':teamSlug/invitations/:invitationId')
  @UseGuards(TeamMembershipGuard)
  @HttpCode(204)
  async cancelInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invitationId') invitationId: string,
  ): Promise<void> {
    await this.teams.cancelInvitation(user.currentTeamId!, user.id, invitationId);
  }

  @Patch(':teamSlug/members/:memberId')
  @UseGuards(TeamMembershipGuard)
  @HttpCode(204)
  async updateMemberRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<void> {
    await this.teams.updateMemberRole(user.currentTeamId!, user.id, memberId, dto.role);
  }

  @Delete(':teamSlug/members/:memberId')
  @UseGuards(TeamMembershipGuard)
  @HttpCode(204)
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ): Promise<void> {
    await this.teams.removeMember(user.currentTeamId!, user.id, memberId);
  }
}
