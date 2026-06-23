import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthApi } from '@/api/auth.api';
import { useAuthStore } from '@/lib/auth-store';
import { api } from '@/lib/api';
import type { AuthUser } from '@Moonscale/shared';

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: async (input: { name: string; email: string }) => {
      const { data } = await api.patch<AuthUser>('/auth/me', input);
      return data;
    },
    onSuccess: (u) => {
      setUser(u);
      toast.success('Profil mis à jour');
    },
    onError: (e: any) => {
      const data = e?.response?.data;
      if (data?.errors) setErrors(data.errors);
      toast.error(data?.message ?? 'Échec de la mise à jour.');
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    update.mutate({ name, email });
  };

  if (!user) return null;

  const verified = Boolean(user.emailVerifiedAt);

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="sr-only">Paramètres du profil</h1>

      <div className="space-y-0.5">
        <h2 className="text-lg font-medium tracking-tight">Profil</h2>
        <p className="text-sm text-muted-foreground">Mettez à jour votre nom et votre adresse e-mail</p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            name="name"
            className="mt-1 block w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            placeholder="Nom complet"
          />
          {errors.name && <p className="mt-2 text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Adresse e-mail</Label>
          <Input
            id="email"
            type="email"
            name="email"
            className="mt-1 block w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="Adresse e-mail"
          />
          {errors.email && <p className="mt-2 text-xs text-destructive">{errors.email}</p>}
        </div>

        {!verified && (
          <div>
            <p className="-mt-4 text-sm text-muted-foreground">
              Votre adresse e-mail n'est pas vérifiée.
            </p>
          </div>
        )}

        <div className="flex items-center gap-4">
          <Button disabled={update.isPending} data-test="update-profile-button">
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
