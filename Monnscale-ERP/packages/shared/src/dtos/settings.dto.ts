/**
 * Payload of `PATCH /auth/me` (account settings → profile).
 */
export interface UpdateProfileDto {
  name: string;
  email: string;
}

/**
 * Payload of the password change endpoint.
 */
export interface UpdatePasswordDto {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
}

/**
 * Payload of the locale change endpoint.
 */
export interface UpdateLocaleDto {
  locale: string;
}
