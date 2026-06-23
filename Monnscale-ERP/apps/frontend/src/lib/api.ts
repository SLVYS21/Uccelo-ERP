import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { AuthTokens } from '@Moonscale/shared';
import { useAuthStore } from './auth-store';

const baseURL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000') + '/api/v1';

export const api = axios.create({ baseURL, withCredentials: false });

// ---------- Request interceptor: inject bearer + x-team-slug ----------

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { tokens, user } = useAuthStore.getState();
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  if (user?.currentTeam?.slug && !config.headers.has('x-team-slug')) {
    config.headers.set('x-team-slug', user.currentTeam.slug);
  }
  return config;
});

// ---------- Response interceptor: refresh on 401 once ----------

let refreshing: Promise<AuthTokens> | null = null;

async function performRefresh(): Promise<AuthTokens> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const { tokens, clear, setTokens } = useAuthStore.getState();
    if (!tokens?.refreshToken) throw new Error('No refresh token.');
    try {
      const { data } = await axios.post<AuthTokens>(`${baseURL}/auth/refresh`, {
        refreshToken: tokens.refreshToken,
      });
      setTokens(data);
      return data;
    } catch (e) {
      clear();
      throw e;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !config._retry && !config.url?.includes('/auth/')) {
      config._retry = true;
      try {
        const newTokens = await performRefresh();
        config.headers.set('Authorization', `Bearer ${newTokens.accessToken}`);
        return api.request(config);
      } catch {
        // fall through to reject
      }
    }
    return Promise.reject(error);
  },
);
