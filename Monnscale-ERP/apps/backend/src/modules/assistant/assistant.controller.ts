import { Body, Controller, NotFoundException, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AssistantService } from './assistant.service';
import { AssistantChatDto } from './dto';
import { TeamMembershipGuard } from '../../common/guards/team-membership.guard';
import { CurrentTeam } from '../../common/decorators/current-team.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedTeam, AuthenticatedUser } from '../../common/types/authed-request';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Controller('teams/:teamSlug/assistant')
@UseGuards(TeamMembershipGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('chat')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async chat(
    @CurrentTeam() team: AuthenticatedTeam,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AssistantChatDto,
  ) {
    const teamRecord = await this.prisma.team.findUnique({ where: { id: team.id } });
    if (!teamRecord) throw new NotFoundException('Team not found.');
    return this.assistant.ask(dto.history, team.id, teamRecord.name, user.name);
  }
}
