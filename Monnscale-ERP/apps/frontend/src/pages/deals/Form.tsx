import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarClock, Layers, Target, Wallet } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomFieldValues, DealUpsertDto } from '@Moonscale/shared';
import { CrmEntity } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormShell } from '@/components/crm/FormShell';
import { CustomFieldsForm } from '@/components/crm/CustomFieldsForm';
import { CustomFieldsApi, DealsApi, PipelinesApi } from '@/api/crm.api';

const TIPS = [
  { icon: Wallet, label: 'Estimer le deal', text: "Un montant renseigné alimente la valeur de votre pipeline." },
  { icon: Layers, label: "Choisir l'étape", text: "Placez l'opportunité à l'étape qui reflète sa réelle maturité." },
  { icon: CalendarClock, label: 'Date de clôture', text: 'Une échéance crédible améliore la fiabilité de vos prévisions.' },
  { icon: Target, label: 'Lier entreprise & contact', text: "Un deal bien lié conserve tout l'historique au même endroit." },
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

export function DealFormPage() {
  const { teamSlug = '', id } = useParams<{ teamSlug: string; id?: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['deal', teamSlug, id],
    queryFn: () => DealsApi.show(teamSlug, id!),
    enabled: isEdit && !!teamSlug,
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', teamSlug],
    queryFn: () => PipelinesApi.list(teamSlug),
    enabled: !!teamSlug,
  });

  const { data: customFields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, CrmEntity.Deal],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, CrmEntity.Deal),
    enabled: !!teamSlug,
  });

  const firstPipeline = pipelines[0];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [pipelineId, setPipelineId] = useState<string>('');
  const [stageId, setStageId] = useState<string>('');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [customValues, setCustomValues] = useState<CustomFieldValues>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialise from server data once available.
  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setAmount(existing.amount != null ? String(existing.amount) : '');
      setPipelineId(existing.pipelineId);
      setStageId(existing.pipelineStageId);
      setExpectedCloseDate(existing.expectedCloseDate ?? '');
      setCustomValues(existing.customFields ?? {});
    } else if (firstPipeline && !pipelineId) {
      setPipelineId(firstPipeline.id);
      setStageId(firstPipeline.stages[0]?.id ?? '');
    }
  }, [existing, firstPipeline, pipelineId]);

  const stageOptions = useMemo(
    () => pipelines.find((p) => p.id === pipelineId)?.stages ?? [],
    [pipelines, pipelineId],
  );

  // If switching pipelines, snap to first stage.
  useEffect(() => {
    if (stageOptions.length && !stageOptions.some((s) => s.id === stageId)) {
      setStageId(stageOptions[0].id);
    }
  }, [stageOptions, stageId]);

  const mutation = useMutation({
    mutationFn: (dto: DealUpsertDto) =>
      isEdit ? DealsApi.update(teamSlug, id!, dto) : DealsApi.create(teamSlug, dto),
    onSuccess: (saved) => {
      qc.invalidateQueries({ queryKey: ['deals-board', teamSlug] });
      qc.invalidateQueries({ queryKey: ['deal', teamSlug, saved.id] });
      toast.success(isEdit ? 'Opportunité mise à jour' : 'Opportunité créée');
      navigate(`/${teamSlug}/deals/${saved.id}`);
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
    if (!pipelineId || !stageId) {
      toast.error('Sélectionnez un pipeline et une étape.');
      return;
    }
    mutation.mutate({
      name,
      amount: amount === '' ? null : Number(amount),
      currency: 'EUR',
      pipelineId,
      pipelineStageId: stageId,
      expectedCloseDate: expectedCloseDate || null,
      customFields: customValues,
    });
  };

  const cancelHref = isEdit ? `/${teamSlug}/deals/${id}` : `/${teamSlug}/pipeline`;

  return (
    <FormShell
      icon={Target}
      title={isEdit ? `Modifier ${existing?.name ?? ''}` : 'Nouvelle opportunité'}
      description={isEdit ? "Mettre à jour l'opportunité" : 'Ajoutez un deal à votre pipeline'}
      aside={<FormTips items={TIPS} />}
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
            placeholder="Licence annuelle"
          />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="amount">Montant (€)</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              min="0"
              step="100"
              placeholder="15000"
            />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="expected_close_date">Date de clôture estimée</Label>
            <Input
              id="expected_close_date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
            {errors.expectedCloseDate && <p className="text-xs text-destructive">{errors.expectedCloseDate}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="pipeline">Pipeline</Label>
            <Select value={pipelineId} onValueChange={setPipelineId}>
              <SelectTrigger id="pipeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((pipeline) => (
                  <SelectItem key={pipeline.id} value={pipeline.id}>
                    {pipeline.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pipelineId && <p className="text-xs text-destructive">{errors.pipelineId}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="stage">Étape</Label>
            <Select value={stageId} onValueChange={setStageId}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Étape" />
              </SelectTrigger>
              <SelectContent>
                {stageOptions.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.pipelineStageId && <p className="text-xs text-destructive">{errors.pipelineStageId}</p>}
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
            {isEdit ? 'Enregistrer' : "Créer l'opportunité"}
          </Button>
          <Button variant="ghost" asChild>
            <Link to={cancelHref}>Annuler</Link>
          </Button>
        </div>
      </form>
    </FormShell>
  );
}
