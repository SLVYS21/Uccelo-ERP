/**
 * Payload of `POST /auth/register`.
 */
export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Payload of `POST /auth/login`.
 */
export interface LoginDto {
  email: string;
  password: string;
  twoFactorCode?: string;
}

/**
 * Payload of `POST /auth/refresh`.
 */
export interface RefreshDto {
  refreshToken: string;
}

/**
 * Payload of `POST /auth/logout`.
 */
export interface LogoutDto {
  refreshToken: string;
}
