import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CrmEntity, TaskPriority } from '@Moonscale/shared';

export class TaskUpsertDto {
  @IsString() @IsNotEmpty() title!: string;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsDateString() dueAt?: string | null;
  @IsEnum(TaskPriority) priority!: TaskPriority;
  @IsOptional() @IsString() assigneeId?: string | null;
  @IsOptional() @IsEnum(CrmEntity) taskableType?: CrmEntity | null;
  @IsOptional() @IsString() taskableId?: string | null;
}

export class ToggleTaskDto {
  @IsBoolean() isCompleted!: boolean;
}
