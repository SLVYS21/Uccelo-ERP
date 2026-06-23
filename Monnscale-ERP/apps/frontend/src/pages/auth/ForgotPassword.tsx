import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">Mot de passe oublié</h1>
        <p className="text-sm text-muted-foreground">Indiquez votre email pour recevoir un lien de réinitialisation</p>
      </div>

      {status && <p className="text-center text-sm font-medium text-emerald-600">{status}</p>}

      <form
        className="space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          setTimeout(() => {
            setSubmitting(false);
            setStatus("Si l'adresse existe, vous recevrez un lien dans quelques minutes.");
          }, 400);
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="email">Adresse email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="off"
            autoFocus
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner className="mr-2" />}
          Envoyer le lien
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Ou,{' '}
        <Link to="/login" className="text-foreground underline underline-offset-4">
          retour à la connexion
        </Link>
      </p>
    </div>
  );
}
