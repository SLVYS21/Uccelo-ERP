import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  Clock,
  History,
  Info,
  Pencil,
  Target,
  Trash2,
  User as UserIcon,
  Wallet,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CrmEntity } from '@Moonscale/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/crm/ConfirmDialog';
import { CustomFieldRenderer } from '@/components/crm/CustomFieldsForm';
import { InitialsAvatar } from '@/components/crm/InitialsAvatar';
import { StatTile } from '@/components/crm/StatTile';
import { ActivityTimeline } from '@/components/crm/ActivityTimeline';
import { CustomFieldsApi, DealsApi } from '@/api/crm.api';

export function DealShowPage() {
  const { teamSlug = '', id = '' } = useParams<{ teamSlug: string; id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: deal, isLoading } = useQuery({
    queryKey: ['deal', teamSlug, id],
    queryFn: () => DealsApi.show(teamSlug, id),
    enabled: !!teamSlug && !!id,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Deal],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Deal),
    enabled: !!teamSlug,
  });

  const remove = useMutation({
    mutationFn: () => DealsApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals-board', teamSlug] });
      toast.success('Opportunité supprimée');
      navigate(`/${teamSlug}/pipeline`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Échec de la suppression.'),
  });

  if (isLoading || !deal) {
    return (
      <div className="flex w-full flex-col gap-6 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const amountLabel =
    deal.amount == null
      ? null
      : new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: deal.currency || 'EUR',
          maximumFractionDigits: 0,
        }).format(deal.amount);

  const statusVariant: 'default' | 'secondary' | 'destructive' =
    deal.status === 'won' ? 'default' : deal.status === 'lost' ? 'destructive' : 'secondary';

  const closeDateLabel = deal.expectedCloseDate
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(deal.expectedCloseDate))
    : null;

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="bg-mesh absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="bg-brand-gradient shadow-glow-violet flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white">
              <Target className="h-7 w-7" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{deal.name}</h1>
                {deal.stage && (
                  <Badge
                    style={{
                      backgroundColor: deal.stage.color ?? undefined,
                      color: deal.stage.color ? '#fff' : undefined,
                    }}
                  >
                    {deal.stage.name}
                  </Badge>
                )}
                <Badge variant={statusVariant}>{deal.statusLabel}</Badge>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {amountLabel && <span className="font-semibold text-foreground tabular-nums">{amountLabel}</span>}
                {deal.company && (
                  <Link
                    to={`/${teamSlug}/companies/${deal.company.id}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {deal.company.name}
                  </Link>
                )}
                {deal.contact && (
                  <Link
                    to={`/${teamSlug}/contacts/${deal.contact.id}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    {deal.contact.name}
                  </Link>
                )}
                {closeDateLabel && (
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Clôture {closeDateLabel}
                  </span>
                )}
                {deal.owner && (
                  <span className="inline-flex items-center gap-1.5">
                    <InitialsAvatar name={deal.owner.name} size="sm" />
                    {deal.owner.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/${teamSlug}/deals/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Modifier
              </Link>
            </Button>
            <ConfirmDialog
              description={`Supprimer définitivement « ${deal.name} » ?`}
              onConfirm={() => remove.mutate()}
            >
              <Button variant="ghost" aria-label="Supprimer l'opportunité">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {deal.amount != null && (
          <StatTile label="Montant" value={deal.amount} icon={Wallet} accent="violet" format="currency" />
        )}
        <StatTile label="Jours ouverts" value={0} icon={Clock} accent="amber" format="number" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Détails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {deal.company && (
                <Link
                  to={`/${teamSlug}/companies/${deal.company.id}`}
                  className="card-hover flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">Entreprise</span>
                    <span className="block truncate font-medium">{deal.company.name}</span>
                  </span>
                </Link>
              )}
              {deal.contact && (
                <Link
                  to={`/${teamSlug}/contacts/${deal.contact.id}`}
                  className="card-hover flex items-center gap-3 rounded-lg border p-3"
                >
                  <InitialsAvatar name={deal.contact.name} size="md" />
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">Contact</span>
                    <span className="block truncate font-medium">{deal.contact.name}</span>
                  </span>
                </Link>
              )}
              {closeDateLabel && (
                <div className="flex items-start gap-3">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date de clôture estimée</p>
                    <p className="font-medium">{closeDateLabel}</p>
                  </div>
                </div>
              )}
              {deal.owner && (
                <div className="flex items-start gap-3">
                  <InitialsAvatar name={deal.owner.name} size="sm" className="mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Responsable</p>
                    <p className="font-medium">{deal.owner.name}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Champs personnalisés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {customFields.map((def) => (
                  <CustomFieldRenderer
                    key={def.id}
                    definition={def}
                    value={deal.customFields?.[def.key]}
                    onChange={() => undefined}
                    readonly
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-muted-foreground" />
                Activité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline
                activities={[]}
                teamSlug={teamSlug}
                target={{ type: CrmEntity.Deal, id }}
                canManage
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
