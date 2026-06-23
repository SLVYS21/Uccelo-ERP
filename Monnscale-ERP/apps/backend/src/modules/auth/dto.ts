import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsEmail() email!: string;
  @IsString() @MinLength(8) password!: string;
  @IsString() @IsNotEmpty() passwordConfirmation!: string;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() @IsNotEmpty() password!: string;
  @IsOptional() @IsString() twoFactorCode?: string;
}

export class RefreshDto {
  @IsString() @IsNotEmpty() refreshToken!: string;
}

export class LogoutDto {
  @IsString() @IsNotEmpty() refreshToken!: string;
}
