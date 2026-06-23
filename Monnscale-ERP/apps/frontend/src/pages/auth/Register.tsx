import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { AuthApi } from '@/api/auth.api';
import { useAuthStore } from '@/lib/auth-store';

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({ name: '', email: '', password: '', passwordConfirmation: '' });
  const [error, setError] = useState<string | null>(null);

  const register = useMutation({
    mutationFn: AuthApi.register,
    onSuccess: ({ user, tokens }) => {
      setSession(user, tokens);
      const target = user.currentTeam ? `/${user.currentTeam.slug}/dashboard` : '/teams';
      navigate(target);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Inscription impossible.'),
  });

  const set = <K extends keyof typeof form>(k: K, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground">Renseignez vos informations pour démarrer</p>
      </div>

      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          register.mutate(form);
        }}
      >
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom complet</Label>
            <Input id="name" required autoFocus value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
            <Input
              id="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              value={form.passwordConfirmation}
              onChange={(e) => set('passwordConfirmation', e.target.value)}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={register.isPending}>
            {register.isPending && <Spinner className="mr-2" />}
            Créer le compte
          </Button>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link to="/login" className="text-foreground underline underline-offset-4">
            Se connecter
          </Link>
        </div>
      </form>
    </div>
  );
}
