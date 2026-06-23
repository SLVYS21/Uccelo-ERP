import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { AuthApi } from '@/api/auth.api';
import { useAuthStore } from '@/lib/auth-store';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const login = useMutation({
    mutationFn: AuthApi.login,
    onSuccess: ({ user, tokens }) => {
      setSession(user, tokens);
      const target = user.currentTeam ? `/${user.currentTeam.slug}/dashboard` : '/teams';
      navigate(target);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Identifiants invalides.'),
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Connexion à votre compte</h1>
        <p className="text-sm text-muted-foreground">Entrez votre email et votre mot de passe ci-dessous</p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          login.mutate({ email, password });
        }}
      >
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link to="/forgot-password" className="text-sm text-muted-foreground underline-offset-4 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <Label htmlFor="remember" className="flex items-center gap-2 font-normal">
            <Checkbox id="remember" />
            <span>Se souvenir de moi</span>
          </Label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending && <Spinner className="mr-2" />}
            Se connecter
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-foreground underline-offset-4 hover:underline">
            Créer un compte
          </Link>
        </div>
      </form>
    </div>
  );
}
