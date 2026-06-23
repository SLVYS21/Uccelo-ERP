import type { AuthUser, LoginResponse } from '@Moonscale/shared';
import { api } from '@/lib/api';

export const AuthApi = {
  register: (input: { name: string; email: string; password: string; passwordConfirmation: string }) =>
    api.post<LoginResponse>('/auth/register', input).then((r) => r.data),

  login: (input: { email: string; password: string }) =>
    api.post<LoginResponse>('/auth/login', input).then((r) => r.data),

  logout: (refreshToken: string) => api.post('/auth/logout', { refreshToken }),

  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
};
