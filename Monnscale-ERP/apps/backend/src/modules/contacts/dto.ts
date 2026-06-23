import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ContactUpsertDto {
  @IsString() @IsNotEmpty() firstName!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsOptional() @IsEmail() email?: string | null;
  @IsOptional() @IsString() phone?: string | null;
  @IsOptional() @IsString() jobTitle?: string | null;
  @IsOptional() @IsString() companyId?: string | null;
  @IsOptional() @IsString() ownerId?: string | null;
  @IsOptional() @IsObject() customFields?: Record<string, unknown>;
}
