import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, Globe, MapPin, User as UserIcon } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CompanyUpsertDto, CustomFieldValues } from '@Moonscale/shared';
import { CrmEntity } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormShell } from '@/components/crm/FormShell';
import { CustomFieldsForm } from '@/components/crm/CustomFieldsForm';
import { CompaniesApi, CustomFieldsApi } from '@/api/crm.api';

const TIPS_CREATE = [
  { icon: Building2, label: 'Un nom suffit pour commencer', text: 'Vous pourrez remplir les autres détails à tout moment.' },
  { icon: Globe, label: 'Renseignez le domaine', text: "Le domaine aide à relier automatiquement les contacts de l'entreprise." },
  { icon: MapPin, label: 'Adresse complète', text: 'Une adresse précise facilite le ciblage géographique et les visites.' },
  { icon: UserIcon, label: 'Attribuez un responsable', text: 'Un propriétaire clair évite que les comptes passent à la trappe.' },
];

const TIPS_EDIT = [
  { icon: Building2, label: 'Tenez la fiche à jour', text: "Des données fraîches aident toute l'équipe à parler d'une seule voix." },
  { icon: Globe, label: 'Vérifiez le domaine', text: 'Un domaine correct relie automatiquement les nouveaux contacts.' },
  { icon: MapPin, label: 'Adresse complète', text: 'Une localisation précise affine votre analyse par territoire.' },
  { icon: UserIcon, label: 'Responsable à jour', text: "Réattribuez le compte si le propriétaire a changé." },
];

function FormTips({ items }: { items: typeof TIPS_CREATE }) {
  return (
    <ul className="space-y-4">
      {items.map((tip) => (
        <li key={tip.label} className="flex items-start gap-3 rounded-xl border bg-card p-3 shadow-card">
          <span className="bg-brand-gradient flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white">
            <tip.icon className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium">{tip.label}</p>
            <p className="text-xs text-muted-foreground">{tip.text}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CompanyFormPage() {
  const { teamSlug = '', id } = useParams<{ teamSlug: string; id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['company', teamSlug, id],
    queryFn: () => CompaniesApi.show(teamSlug, id!),
    enabled: isEdit && !!teamSlug,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Company],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Company),
    enabled: !!teamSlug,
  });

  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [customValues, setCustomValues] = useState<CustomFieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setDomain(existing.domain ?? '');
      setIndustry(existing.industry ?? '');
      setPhone(existing.phone ?? '');
      setWebsite(existing.website ?? '');
      setAddress(existing.address ?? '');
      setCity(existing.city ?? '');
      setPostalCode(existing.postalCode ?? '');
      setCountry(existing.country ?? '');
      setCustomValues(existing.customFields ?? {});
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (dto: CompanyUpsertDto) =>
      isEdit ? CompaniesApi.update(teamSlug, id!, dto) : CompaniesApi.create(teamSlug, dto),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['companies', teamSlug] });
      qc.invalidateQueries({ queryKey: ['company', teamSlug, saved.id] });
      toast.success(isEdit ? 'Entreprise mise à jour' : 'Entreprise créée');
      navigate(`/${teamSlug}/companies/${saved.id}`);
    },
    onError: (e: any) => {
      const data = e?.response?.data;
      if (data?.errors) setErrors(data.errors);
      toast.error(data?.message ?? 'Échec de l\'enregistrement.');
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate({
      name,
      domain: domain || null,
      industry: industry || null,
      phone: phone || null,
      website: website || null,
      address: address || null,
      city: city || null,
      postalCode: postalCode || null,
      country: country || null,
      customFields: customValues,
    });
  };

  const cancelHref = isEdit ? `/${teamSlug}/companies/${id}` : `/${teamSlug}/companies`;

  return (
    <FormShell
      icon={Building2}
      title={isEdit ? `Modifier ${existing?.name ?? ''}` : 'Nouvelle entreprise'}
      description={isEdit ? "Mettez à jour les informations de l'entreprise" : 'Ajoutez une entreprise à votre portefeuille'}
      aside={<FormTips items={isEdit ? TIPS_EDIT : TIPS_CREATE} />}
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-2">
          <Label htmlFor="name">
            Nom <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="organization"
            placeholder="Acme SAS"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="industry">Secteur</Label>
            <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="SaaS" />
            {errors.industry && <p className="text-xs text-destructive">{errors.industry}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="domain">Domaine</Label>
            <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="acme.com" />
            {errors.domain && <p className="text-xs text-destructive">{errors.domain}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              type="url"
              placeholder="https://acme.com"
            />
            {errors.website && <p className="text-xs text-destructive">{errors.website}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+33 1 23 45 67 89"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="address">Adresse</Label>
          <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 rue de la Paix" />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="postal_code">Code postal</Label>
            <Input id="postal_code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="75002" />
            {errors.postalCode && <p className="text-xs text-destructive">{errors.postalCode}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="city">Ville</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Paris" />
            {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="country">Pays</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="France" />
            {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
          </div>
        </div>

        {customFields.length > 0 && (
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-sm font-medium text-muted-foreground">Champs personnalisés</h3>
            <CustomFieldsForm
              definitions={customFields}
              values={customValues}
              errors={errors}
              onChange={setCustomValues}
            />
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={mutation.isPending}>
            {isEdit ? 'Enregistrer' : "Créer l'entreprise"}
          </Button>
          <Button variant="ghost" asChild>
            <Link to={cancelHref}>Annuler</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  );
}
