import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  Globe,
  History,
  Info,
  MapPin,
  Pencil,
  Phone,
  Target,
  Trash2,
  Trophy,
  User as UserIcon,
  Users,
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
import { CompaniesApi, CustomFieldsApi } from '@/api/crm.api';

export function CompanyShowPage() {
  const { teamSlug = '', id = '' } = useParams<{ teamSlug: string; id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', teamSlug, id],
    queryFn: () => CompaniesApi.show(teamSlug, id),
    enabled: !!teamSlug && !!id,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Company],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Company),
    enabled: !!teamSlug,
  });

  const remove = useMutation({
    mutationFn: () => CompaniesApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['companies', teamSlug] });
      toast.success('Entreprise supprimée');
      navigate(`/${teamSlug}/companies`);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Échec de la suppression.'),
  });

  if (isLoading || !company) {
    return (
      <div className="flex w-full flex-col gap-6 p-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const websiteHref = company.website
    ? /^https?:\/\//i.test(company.website)
      ? company.website
      : `https://${company.website}`
    : null;

  let websiteLabel: string | null = null;
  if (websiteHref) {
    try {
      websiteLabel = new URL(websiteHref).hostname.replace(/^www\./, '');
    } catch {
      websiteLabel = company.website;
    }
  }

  const location = [company.city, company.country].filter(Boolean).join(', ');
  const fullAddress = [
    company.address,
    [company.postalCode, company.city].filter(Boolean).join(' '),
    company.country,
  ]
    .filter(Boolean)
    .join(', ');

  const createdLabel = company.createdAt
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
        new Date(company.createdAt),
      )
    : null;

  type Field = {
    icon: typeof Globe;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
    avatarName?: string;
  };

  const fields: Field[] = (
    [
      { icon: Globe, label: 'Site web', value: websiteLabel, href: websiteHref ?? undefined, external: true },
      { icon: Phone, label: 'Téléphone', value: company.phone, href: company.phone ? `tel:${company.phone}` : undefined },
      { icon: MapPin, label: 'Adresse', value: fullAddress },
      { icon: UserIcon, label: 'Responsable', value: company.owner?.name, avatarName: company.owner?.name },
      { icon: CalendarDays, label: 'Dans le CRM depuis', value: createdLabel },
    ] as Array<Omit<Field, 'value'> & { value: string | null | undefined }>
  ).filter((f): f is Field => Boolean(f.value));

  return (
    <div className="flex w-full flex-col gap-6 p-4">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="bg-mesh absolute inset-0" aria-hidden="true" />
        <div className="relative flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="flex min-w-0 items-start gap-4">
            <span className="bg-brand-gradient shadow-glow-violet flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white">
              <Building2 className="h-7 w-7" />
            </span>
            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
                {company.industry && <Badge variant="secondary">{company.industry}</Badge>}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> {location}
                  </span>
                )}
                {websiteHref && (
                  <a
                    href={websiteHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-primary"
                  >
                    <Globe className="h-3.5 w-3.5" /> {websiteLabel}
                    <ArrowUpRight className="h-3 w-3" />
                  </a>
                )}
                {company.owner && (
                  <span className="inline-flex items-center gap-1.5">
                    <InitialsAvatar name={company.owner.name} size="sm" />
                    {company.owner.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link to={`/${teamSlug}/companies/${id}/edit`}>
                <Pencil className="h-4 w-4" /> Modifier
              </Link>
            </Button>
            <ConfirmDialog
              description={`Supprimer définitivement « ${company.name} » ?`}
              onConfirm={() => remove.mutate()}
            >
              <Button variant="ghost" aria-label="Supprimer l'entreprise">
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </ConfirmDialog>
          </div>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Contacts" value={0} icon={Users} accent="indigo" format="number" />
        <StatTile label="Opportunités ouvertes" value={0} icon={Target} accent="sky" format="number" />
        <StatTile label="Pipeline" value={0} icon={Wallet} accent="violet" format="currency" />
        <StatTile label="Montant gagné" value={0} icon={Trophy} accent="emerald" format="currency" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          {/* Information card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Informations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                        target={field.external ? '_blank' : undefined}
                        rel={field.external ? 'noopener noreferrer' : undefined}
                        className="inline-flex max-w-full items-center gap-1 font-medium transition-colors hover:text-primary hover:underline"
                      >
                        <span className="truncate">{field.value}</span>
                        {field.external && <ArrowUpRight className="h-3 w-3 shrink-0" />}
                      </a>
                    ) : (
                      <p className="font-medium break-words">{field.value}</p>
                    )}
                  </div>
                </div>
              ))}
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground">Aucune information fournie.</p>
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
                    value={company.customFields?.[def.key]}
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
                target={{ type: CrmEntity.Company, id }}
                canManage
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
