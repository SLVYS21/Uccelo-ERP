import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Building2, Mail, Phone, UserPlus } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ContactUpsertDto, CustomFieldValues } from '@Moonscale/shared';
import { CrmEntity } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormShell } from '@/components/crm/FormShell';
import { CustomFieldsForm } from '@/components/crm/CustomFieldsForm';
import { ContactsApi, CustomFieldsApi } from '@/api/crm.api';

const TIPS = [
  { icon: Building2, label: 'Rattacher une entreprise', text: "Un contact rattaché à une entreprise alimente automatiquement sa fiche." },
  { icon: Mail, label: 'Email professionnel', text: "L'email est la clé pour les relances et les rappels commerciaux." },
  { icon: Phone, label: 'Numéro direct', text: "Un numéro joignable accélère la prise de contact." },
  { icon: UserPlus, label: 'Fonction du contact', text: 'Connaître la fonction aide à adapter votre pitch au bon décideur.' },
];

function FormTips({ items }: { items: typeof TIPS }) {
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

export function ContactFormPage() {
  const { teamSlug = '', id } = useParams<{ teamSlug: string; id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['contact', teamSlug, id],
    queryFn: () => ContactsApi.show(teamSlug, id!),
    enabled: isEdit && !!teamSlug,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Contact],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Contact),
    enabled: !!teamSlug,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [customValues, setCustomValues] = useState<CustomFieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (existing) {
      setFirstName(existing.firstName ?? '');
      setLastName(existing.lastName ?? '');
      setEmail(existing.email ?? '');
      setPhone(existing.phone ?? '');
      setJobTitle(existing.jobTitle ?? '');
      setCustomValues(existing.customFields ?? {});
    }
  }, [existing]);

  const mutation = useMutation({
    mutationFn: (dto: ContactUpsertDto) =>
      isEdit ? ContactsApi.update(teamSlug, id!, dto) : ContactsApi.create(teamSlug, dto),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['contacts', teamSlug] });
      qc.invalidateQueries({ queryKey: ['contact', teamSlug, saved.id] });
      toast.success(isEdit ? 'Contact mis à jour' : 'Contact créé');
      navigate(`/${teamSlug}/contacts/${saved.id}`);
    },
    onError: (e: any) => {
      const data = e?.response?.data;
      if (data?.errors) setErrors(data.errors);
      toast.error(data?.message ?? "Échec de l'enregistrement.");
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    mutation.mutate({
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      jobTitle: jobTitle || null,
      customFields: customValues,
    });
  };

  const cancelHref = isEdit ? `/${teamSlug}/contacts/${id}` : `/${teamSlug}/contacts`;

  return (
    <FormShell
      icon={UserPlus}
      title={isEdit ? `Modifier ${existing?.fullName ?? ''}` : 'Nouveau contact'}
      description="Ajoutez un contact"
      aside={<FormTips items={TIPS} />}
    >
      <form className="space-y-6" onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="first_name">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first_name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
            {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="last_name">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last_name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
            {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              placeholder="jean.dupont@acme.com"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="job_title">Fonction</Label>
            <Input
              id="job_title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Directeur commercial"
            />
            {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle}</p>}
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
            {isEdit ? 'Enregistrer' : 'Créer le contact'}
          </Button>
          <Button variant="ghost" asChild>
            <Link to={cancelHref}>Annuler</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  );
}
