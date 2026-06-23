import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/lib/auth-store';
import { AuthApi } from '@/api/auth.api';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, tokens, setUser } = useAuthStore();

  const enabled = Boolean(tokens?.accessToken && !user);
  const { data, isError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: AuthApi.me,
    enabled,
  });

  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  if (!tokens?.accessToken) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (isError && enabled) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
