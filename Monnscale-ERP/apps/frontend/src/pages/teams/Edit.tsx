import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronDown, Mail, UserPlus, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TeamDetail, TeamMember, TeamInvitation, TeamRole } from '@Moonscale/shared';
import { TeamRole as TeamRoleEnum, ASSIGNABLE_ROLES } from '@Moonscale/shared';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/crm/ConfirmDialog';
import { TeamsApi } from '@/api/teams.api';
import { getInitials } from '@/lib/initials';

const ROLE_LABELS: Record<TeamRole, string> = {
  [TeamRoleEnum.Owner]: 'Propriétaire',
  [TeamRoleEnum.Admin]: 'Administrateur',
  [TeamRoleEnum.Member]: 'Membre',
};

export function TeamEditPage() {
  const { slug = '' } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', slug],
    queryFn: () => TeamsApi.detail(slug),
    enabled: !!slug,
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const updateTeam = useMutation({
    mutationFn: () => TeamsApi.update(slug, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', slug] });
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Équipe mise à jour');
    },
    onError: (e: any) => setNameError(e?.response?.data?.message ?? 'Échec de la mise à jour.'),
  });

  const updateMember = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: TeamRole }) =>
      TeamsApi.updateMemberRole(slug, memberId, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', slug] });
      toast.success('Rôle mis à jour');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Échec de la mise à jour.'),
  });

  const removeMember = useMutation({
    mutationFn: (memberId: string) => TeamsApi.removeMember(slug, memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', slug] });
      toast.success('Membre retiré');
    },
  });

  const cancelInvitation = useMutation({
    mutationFn: (invitationId: string) => TeamsApi.cancelInvitation(slug, invitationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team', slug] });
      toast.success('Invitation annulée');
    },
  });

  const deleteTeam = useMutation({
    mutationFn: () => TeamsApi.remove(slug),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] });
      toast.success('Équipe supprimée');
      navigate('/teams');
    },
  });

  if (isLoading || !team) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const canUpdate = team.myRole === TeamRoleEnum.Owner || team.myRole === TeamRoleEnum.Admin;
  const canDelete = team.myRole === TeamRoleEnum.Owner && !team.isPersonal;
  const canInvite = canUpdate;
  const canManageMembers = canUpdate;

  const pageTitle = canUpdate ? `Modifier ${team.name}` : `Voir ${team.name}`;

  return (
    <div className="flex flex-col space-y-10">
      <h1 className="sr-only">{pageTitle}</h1>

      {/* Team name section */}
      {canUpdate ? (
        <div className="space-y-6">
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Paramètres de l'équipe</h2>
            <p className="text-sm text-muted-foreground">Mettez à jour le nom et les paramètres de l'équipe</p>
          </div>

          <form
            className="space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              setNameError(null);
              updateTeam.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="name">Nom de l'équipe</Label>
              <Input
                id="name"
                name="name"
                data-test="team-name-input"
                defaultValue={team.name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            <div className="flex items-center gap-4">
              <Button type="submit" data-test="team-save-button" disabled={updateTeam.isPending}>
                Enregistrer
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <h2 className="text-lg font-medium tracking-tight">{team.name}</h2>
        </div>
      )}

      {/* Members section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Membres de l'équipe</h2>
            {canInvite && (
              <p className="text-sm text-muted-foreground">Gérez les personnes membres de cette équipe</p>
            )}
          </div>

          {canInvite && (
            <Button data-test="invite-member-button" onClick={() => setInviteOpen(true)}>
              <UserPlus /> Inviter un membre
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {team.members.map((member: TeamMember) => (
            <div
              key={member.id}
              data-test="member-row"
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-muted-foreground">{member.email}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {member.role !== TeamRoleEnum.Owner && canManageMembers ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button data-test="member-role-trigger" variant="outline" size="sm">
                        {ROLE_LABELS[member.role]}
                        <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <DropdownMenuItem
                          key={role}
                          data-test="member-role-option"
                          onClick={() => updateMember.mutate({ memberId: member.id, role })}
                        >
                          {ROLE_LABELS[role]}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
                )}

                {member.role !== TeamRoleEnum.Owner && canManageMembers && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ConfirmDialog
                          description={`Retirer ${member.name} de l'équipe ?`}
                          onConfirm={() => removeMember.mutate(member.id)}
                        >
                          <Button data-test="member-remove-button" variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </ConfirmDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Retirer le membre</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pending invitations */}
      {team.invitations.length > 0 && (
        <div className="space-y-6">
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Invitations en attente</h2>
            <p className="text-sm text-muted-foreground">Invitations qui n'ont pas encore été acceptées</p>
          </div>

          <div className="space-y-3">
            {team.invitations.map((invitation: TeamInvitation) => (
              <div
                key={invitation.id}
                data-test="invitation-row"
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Mail className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-medium">{invitation.email}</div>
                    <div className="text-sm text-muted-foreground">{ROLE_LABELS[invitation.role]}</div>
                  </div>
                </div>

                {canInvite && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <ConfirmDialog
                          description={`Annuler l'invitation envoyée à ${invitation.email} ?`}
                          onConfirm={() => cancelInvitation.mutate(invitation.id)}
                        >
                          <Button data-test="invitation-cancel-button" variant="ghost" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </ConfirmDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Annuler l'invitation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Danger zone */}
      {canDelete && (
        <div className="space-y-6">
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Supprimer l'équipe</h2>
            <p className="text-sm text-muted-foreground">Supprimer définitivement votre équipe</p>
          </div>
          <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-200/10 dark:bg-red-700/10">
            <div className="relative space-y-0.5 text-red-600 dark:text-red-100">
              <p className="font-medium">Attention</p>
              <p className="text-sm">Veuillez procéder avec prudence, cette action est irréversible.</p>
            </div>
            <ConfirmDialog
              title="Supprimer l'équipe ?"
              description={`Cette action supprimera définitivement « ${team.name} » et toutes ses données.`}
              confirmLabel="Supprimer définitivement"
              onConfirm={() => deleteTeam.mutate()}
            >
              <Button data-test="delete-team-button" variant="destructive">
                Supprimer l'équipe
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      )}

      <InviteMemberDialog
        slug={slug}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onCreated={() => qc.invalidateQueries({ queryKey: ['team', slug] })}
      />
    </div>
  );
}

function InviteMemberDialog({
  slug,
  open,
  onOpenChange,
  onCreated,
}: {
  slug: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>(TeamRoleEnum.Member);
  const [error, setError] = useState<string | null>(null);

  const invite = useMutation({
    mutationFn: () => TeamsApi.invite(slug, { email, role }),
    onSuccess: () => {
      toast.success('Invitation envoyée');
      onCreated();
      onOpenChange(false);
      setEmail('');
      setRole(TeamRoleEnum.Member);
    },
    onError: (e: any) => setError(e?.response?.data?.message ?? "Échec de l'envoi."),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
          <DialogDescription>Envoyez une invitation à rejoindre votre équipe.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            invite.mutate();
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Adresse e-mail</Label>
            <Input
              id="invite-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="invite-role">Rôle</Label>
            <Select value={role} onValueChange={(v) => setRole(v as TeamRole)}>
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={invite.isPending}>
              Envoyer l'invitation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
