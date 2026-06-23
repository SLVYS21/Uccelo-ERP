import { IsArray, IsEnum, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Picklist } from '@Moonscale/shared';

export class PicklistOptionUpsertDto {
  @IsEnum(Picklist) picklist!: Picklist;
  @IsString() @IsNotEmpty() value!: string;
  @IsString() @IsNotEmpty() label!: string;
  @IsOptional() @IsHexColor() color?: string | null;
}

export class ReorderPicklistDto {
  @IsEnum(Picklist) picklist!: Picklist;
  @IsArray() orderedIds!: string[];
}
