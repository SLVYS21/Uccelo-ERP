import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class CompanyUpsertDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsOptional() @IsString() domain?: string | null;
  @IsOptional() @IsString() industry?: string | null;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() @IsString() website?: string | null;
  @IsOptional() @IsString() address?: string | null;
  @IsOptional() @IsString() city?: string | null;
  @IsOptional() @IsString() postalCode?: string | null;
  @IsOptional() @IsString() country?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}
