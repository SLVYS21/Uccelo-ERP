import { ArrayMinSize, IsArray, IsBoolean, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PipelineStageUpsertDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() key?: string;
  @IsOptional() @IsHexColor() color?: string | null;
  @IsOptional() @IsBoolean() isWon?: boolean;
  @IsOptional() @IsBoolean() isLost?: boolean;
}

export class ReorderStagesDto {
  @IsString() @IsNotEmpty() pipelineId!: string;
  @IsArray() @ArrayMinSize(1) orderedIds!: string[];
}
