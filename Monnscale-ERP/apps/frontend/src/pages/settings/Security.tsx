import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api';

export function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = useMutation({
    mutationFn: async (input: { currentPassword: string; password: string; passwordConfirmation: string }) =>
      api.patch('/auth/password', input),
    onSuccess: () => {
      toast.success('Mot de passe mis à jour');
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
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
    update.mutate({ currentPassword, password, passwordConfirmation });
  };

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Paramètres de sécurité</h1>

      <div className="space-y-0.5">
        <h2 className="text-lg font-medium tracking-tight">Mettre à jour le mot de passe</h2>
        <p className="text-sm text-muted-foreground">
          Assurez-vous d'utiliser un mot de passe long et aléatoire pour rester en sécurité
        </p>
      </div>

      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="current_password">Mot de passe actuel</Label>
          <Input
            id="current_password"
            type="password"
            name="current_password"
            className="mt-1 block w-full"
            autoComplete="current-password"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input
            id="password"
            type="password"
            name="password"
            className="mt-1 block w-full"
            autoComplete="new-password"
            placeholder="Nouveau mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password_confirmation">Confirmer le mot de passe</Label>
          <Input
            id="password_confirmation"
            type="password"
            name="password_confirmation"
            className="mt-1 block w-full"
            autoComplete="new-password"
            placeholder="Confirmer le mot de passe"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {errors.passwordConfirmation && <p className="text-xs text-destructive">{errors.passwordConfirmation}</p>}
        </div>

        <div className="flex items-center gap-4">
          <Button disabled={update.isPending} data-test="update-password-button">
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
