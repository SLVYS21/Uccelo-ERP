import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Pencil, Plus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { TeamsApi } from '@/api/teams.api';

function CreateTeamModal() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: TeamsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Équipe créée');
      setOpen(false);
      setName('');
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? 'Échec de la création.'),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-test="teams-new-team-button">
          <Plus /> Nouvelle équipe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Créer une équipe</DialogTitle>
          <DialogDescription>Donnez un nom à votre nouvelle équipe.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            create.mutate({ name });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="team-name">Nom de l'équipe</Label>
            <Input id="team-name" required value={name} onChange={(e) => setName(e.target.value)} />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Créer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function roleLabel(isPersonal: boolean) {
  return isPersonal ? 'Espace personnel' : 'Membre';
}

export function TeamsIndexPage() {
  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: TeamsApi.list,
  });

  return (
    <div className="flex flex-col space-y-6">
      <h1 className="sr-only">Équipes</h1>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-tight">Équipes</h2>
          <p className="text-sm text-muted-foreground">Gérez vos équipes et leurs membres</p>
        </div>

        <CreateTeamModal />
      </div>

      <div className="space-y-3">
        {isLoading && (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        )}

        {(teams ?? []).map((team) => (
          <div
            key={team.id}
            data-test="team-row"
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{team.name}</span>
                  {team.isPersonal && <Badge variant="secondary">Personnelle</Badge>}
                </div>
                <span className="text-sm text-muted-foreground">{roleLabel(team.isPersonal)}</span>
              </div>
            </div>

            <TooltipProvider>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button data-test="team-edit-button" variant="ghost" size="sm" asChild>
                      <Link to={`/teams/${team.slug}`}>
                        {team.isPersonal ? <Pencil className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{team.isPersonal ? "Modifier l'équipe" : "Voir l'équipe"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        ))}

        {!isLoading && (teams ?? []).length === 0 && (
          <p className="py-8 text-center text-muted-foreground">Vous n'appartenez à aucune équipe pour le moment.</p>
        )}
      </div>
    </div>
  );
}
