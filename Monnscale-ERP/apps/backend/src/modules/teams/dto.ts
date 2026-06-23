import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TeamRole } from '@Moonscale/shared';

export class CreateTeamDto {
  @IsString() @IsNotEmpty() name!: string;
}

export class UpdateTeamDto {
  @IsString() @IsNotEmpty() name!: string;
}

export class InviteMemberDto {
  @IsEmail() email!: string;
  @IsEnum(TeamRole) role!: TeamRole;
}

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole) role!: TeamRole;
}

export class SwitchTeamDto {
  @IsString() @IsNotEmpty() teamId!: string;
}

export class AcceptInvitationDto {
  @IsString() @IsNotEmpty() code!: string;
}
