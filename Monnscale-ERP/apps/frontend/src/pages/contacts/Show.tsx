import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Briefcase,
  Building2,
  CalendarDays,
  History,
  Info,
  Layers,
  Mail,
  Pencil,
  Phone,
  Target,
  Trash2,
  Trophy,
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
import { ContactsApi, CustomFieldsApi } from '@/api/crm.api';

export function ContactShowPage() {
  const { teamSlug = '', id = '' } = useParams<{ teamSlug: string; id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', teamSlug, id],
    queryFn: () => ContactsApi.show(teamSlug, id),
    enabled: !!teamSlug && !!id,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Contact],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Contact),
    enabled: !!teamSlug,
  });

  const remove = useMutation({
    mutationFn: () => ContactsApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', teamSlug] });
      toast.success('Contact supprimé');
      navigate(`/${teamSlug}/contacts`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Échec de la suppression.'),
  });

  if (isLoading || !contact) {
    return (
      <div className="flex w-full flex-col gap-6 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const createdLabel = contact.createdAt
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(contact.createdAt),
      )
    : null;

  type Field = {
    icon: typeof Mail;
    label: string;
    value: string;
    href?: string;
    avatarName?: string;
  };

  const fields: Field[] = (
    [
      { icon: Briefcase, label: 'Fonction', value: contact.jobTitle },
      { icon: Mail, label: 'Email', value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
      { icon: Phone, label: 'Téléphone', value: contact.phone, href: contact.phone ? `tel:${contact.phone}` : undefined },
      { icon: UserIcon, label: 'Responsable', value: contact.owner?.name, avatarName: contact.owner?.name },
      { icon: CalendarDays, label: 'Dans le CRM depuis', value: createdLabel },
    ] as Array<Omit<Field, 'value'> & { value: string | null | undefined }>
  ).filter((f): f is Field => Boolean(f.value));

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="bg-mesh absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <InitialsAvatar name={contact.fullName} className="h-14 w-14 text-lg" />
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{contact.fullName}</h1>
                {contact.jobTitle && <Badge variant="secondary">{contact.jobTitle}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {contact.company && (
                  <Link
                    to={`/${teamSlug}/companies/${contact.company.id}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {contact.company.name}
                  </Link>
                )}
                {contact.email && (
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a
                    href={`tel:${contact.phone}`}
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {contact.phone}
                  </a>
                )}
                {contact.owner && (
                  <span className="inline-flex items-center gap-1.5">
                    <InitialsAvatar name={contact.owner.name} size="sm" />
                    {contact.owner.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/${teamSlug}/contacts/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Modifier
              </Link>
            </Button>
            <ConfirmDialog
              description={`Supprimer définitivement « ${contact.fullName} » ?`}
              onConfirm={() => remove.mutate()}
            >
              <Button variant="ghost" aria-label="Supprimer le contact">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Opportunités" value={0} icon={Layers} accent="indigo" format="number" />
        <StatTile label="Ouvertes" value={0} icon={Target} accent="sky" format="number" />
        <StatTile label="Pipeline" value={0} icon={Wallet} accent="violet" format="currency" />
        <StatTile label="Gagné" value={0} icon={Trophy} accent="emerald" format="currency" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Coordonnées
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.company && (
                <Link
                  to={`/${teamSlug}/companies/${contact.company.id}`}
                  className="card-hover flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted-foreground">Entreprise</span>
                    <span className="block truncate font-medium">{contact.company.name}</span>
                  </span>
                </Link>
              )}

              {fields.map((field) => (
                <div key={field.label} className="flex items-start gap-3">
                  {field.avatarName ? (
                    <InitialsAvatar name={field.avatarName} size="sm" className="mt-0.5" />
                  ) : (
                    <field.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{field.label}</p>
                    {field.href ? (
                      <a
                        href={field.href}
                        className="inline-flex max-w-full items-center gap-1 font-medium transition-colors hover:text-primary hover:underline"
                      >
                        <span className="truncate">{field.value}</span>
                      </a>
                    ) : (
                      <p className="font-medium break-words">{field.value}</p>
                    )}
                  </div>
                </div>
              ))}
              {fields.length === 0 && !contact.company && (
                <p className="text-sm text-muted-foreground">Aucune coordonnée renseignée.</p>
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
                    value={contact.customFields?.[def.key]}
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
                target={{ type: CrmEntity.Contact, id }}
                canManage
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
