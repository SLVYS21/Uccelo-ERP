import type { TeamRef } from './teams.types';

/**
 * Currently signed-in user. Returned by `GET /auth/me` and embedded in the
 * `LoginResponse` payload. `currentTeam` is `null` for users who do not yet
 * have an active team selected.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  locale: string | null;
  twoFactorEnabled: boolean;
  currentTeamId: string | null;
  currentTeam: TeamRef | null;
  createdAt: string;
}

/**
 * Access + refresh token pair returned by `/auth/login`, `/auth/register`
 * and `/auth/refresh`. Tokens are persisted in the frontend zustand store.
 *
 * Both `accessExpiresAt` / `refreshExpiresAt` and the longer
 * `accessTokenExpiresAt` / `refreshTokenExpiresAt` aliases are exposed
 * because both names are used across the codebase (the longer form is
 * produced by the backend; the shorter form is the public, documented one).
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt?: string;
  refreshExpiresAt?: string;
  accessTokenExpiresAt?: string;
  refreshTokenExpiresAt?: string;
}

/**
 * Response body of `/auth/login` and `/auth/register`.
 */
export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
