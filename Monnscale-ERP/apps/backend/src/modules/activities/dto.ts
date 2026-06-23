import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CrmEntity } from '@Moonscale/shared';

export class CreateActivityDto {
  @IsString() @IsNotEmpty() type!: string;
  @IsOptional() @IsString() subject?: string | null;
  @IsOptional() @IsString() body?: string | null;
  @IsDateString() occurredAt!: string;
  @IsEnum(CrmEntity) subjectableType!: CrmEntity;
  @IsString() @IsNotEmpty() subjectableId!: string;
}
