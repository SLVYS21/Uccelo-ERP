import { IsDateString, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator';

export class DealUpsertDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() pipelineId!: string;
  @IsString() @IsNotEmpty() pipelineStageId!: string;
  @IsOptional() @IsNumber() amount?: number | null;
  @IsOptional() @IsString() currency?: string | null;
  @IsOptional() @IsString() companyId?: string | null;
  @IsOptional() @IsString() contactId?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsDateString() expectedCloseDate?: string | null;
  @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}

export class MoveDealDto {
  @IsString() @IsNotEmpty() pipelineStageId!: string;
  @IsInt() @Min(0) position!: number;
}
