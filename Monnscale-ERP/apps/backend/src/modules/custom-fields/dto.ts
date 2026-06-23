import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { CrmEntity, CustomFieldType } from '@Moonscale/shared';

export class CustomFieldUpsertDto {
  @IsEnum(CrmEntity) entityType!: CrmEntity;
  @IsString() @IsNotEmpty() key!: string;
  @IsString() @IsNotEmpty() label!: string;
  @IsEnum(CustomFieldType) type!: CustomFieldType;
  @IsOptional() @IsObject() options?: { choices?: { value: string; label: string }[]; relatedModule?: CrmEntity } | null;
  @IsOptional() @IsBoolean() isRequired?: boolean;
  @IsOptional() @IsBoolean() isFilterable?: boolean;
  @IsOptional() @IsString() helpText?: string | null;
}

export class ReorderCustomFieldsDto {
  @IsEnum(CrmEntity) entityType!: CrmEntity;
  @IsArray() orderedIds!: string[];
}
