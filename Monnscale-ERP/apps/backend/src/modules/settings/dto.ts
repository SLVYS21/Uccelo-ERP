import { IsEmail, IsIn, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
}

export class UpdatePasswordDto {
  @IsString() @IsNotEmpty() currentPassword!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() passwordConfirmation!: string;
}

export class UpdateLocaleDto {
  @IsString() @IsIn(['fr', 'en']) locale!: string;
}
