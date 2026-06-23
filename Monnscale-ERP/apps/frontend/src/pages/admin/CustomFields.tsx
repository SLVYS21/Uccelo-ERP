import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { CustomFieldDefinition, CustomFieldUpsertDto } from '@Moonscale/shared';
import { CrmEntity, CustomFieldType } from '@Moonscale/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/crm/ConfirmDialog';
import { CustomFieldsApi } from '@/api/crm.api';

const ENTITY_LABELS: { value: CrmEntity; label: string }[] = [
  { value: CrmEntity.Company, label: 'Entreprises' },
  { value: CrmEntity.Contact, label: 'Contacts' },
  { value: CrmEntity.Deal, label: 'Opportunités' },
];

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texte',
  textarea: 'Texte long',
  number: 'Nombre',
  date: 'Date',
  select: 'Liste',
  multiselect: 'Liste multiple',
  checkbox: 'Case à cocher',
  email: 'Email',
  url: 'URL',
  phone: 'Téléphone',
  relation: 'Relation',
};

export function CustomFieldsPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const qc = useQueryClient();
  const [activeEntity, setActiveEntity] = useState<CrmEntity>(CrmEntity.Company);

  const { data: fields = [] } = useQuery({
    queryKey: ['custom-fields', teamSlug, activeEntity],
    queryFn: () => CustomFieldsApi.byEntity(teamSlug, activeEntity),
    enabled: !!teamSlug,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (field: CustomFieldDefinition) => {
    setEditing(field);
    setEditorOpen(true);
  };

  const remove = useMutation({
    mutationFn: (id: string) => CustomFieldsApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-fields', teamSlug] });
      toast.success('Champ supprimé');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? 'Échec de la suppression.'),
  });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <SlidersHorizontal className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Champs personnalisés</h2>
            <p className="text-sm text-muted-foreground">Ajoutez des champs sur mesure à chaque module</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouveau champ
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {ENTITY_LABELS.map((entity) => (
          <Button
            key={entity.value}
            size="sm"
            variant={activeEntity === entity.value ? 'default' : 'outline'}
            onClick={() => setActiveEntity(entity.value)}
          >
            {entity.label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="divide-y p-0">
          {fields.map((field) => {
            const choices = field.options?.choices ?? [];
            return (
              <div key={field.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{field.label}</span>
                    <Badge variant="secondary">{FIELD_TYPE_LABELS[field.type] ?? field.type}</Badge>
                    {field.isRequired && <Badge variant="outline">Obligatoire</Badge>}
                    {field.isFilterable && <Badge variant="outline">Filtrable</Badge>}
                  </div>
                  {choices.length > 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {choices.map((c) => c.label).join(' · ')}
                    </p>
                  ) : field.helpText ? (
                    <p className="mt-1 text-xs text-muted-foreground">{field.helpText}</p>
                  ) : null}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Modifier le champ"
                  onClick={() => openEdit(field)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <ConfirmDialog
                  description={`Supprimer le champ « ${field.label} » ?`}
                  onConfirm={() => remove.mutate(field.id)}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Supprimer le champ">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ConfirmDialog>
              </div>
            );
          })}

          {fields.length === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">
              Aucun champ personnalisé pour ce module.
            </p>
          )}
        </CardContent>
      </Card>

      <CustomFieldEditor
        teamSlug={teamSlug}
        entity={activeEntity}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        field={editing}
      />
    </div>
  );
}

function CustomFieldEditor({
  teamSlug,
  entity,
  open,
  onOpenChange,
  field,
}: {
  teamSlug: string;
  entity: CrmEntity;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  field: CustomFieldDefinition | null;
}) {
  const qc = useQueryClient();
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<string>(CustomFieldType.Text);
  const [isRequired, setIsRequired] = useState(false);
  const [isFilterable, setIsFilterable] = useState(false);
  const [helpText, setHelpText] = useState('');
  const [choicesText, setChoicesText] = useState('');

  useEffect(() => {
    if (field) {
      setKey(field.key);
      setLabel(field.label);
      setType(field.type);
      setIsRequired(field.isRequired);
      setIsFilterable(field.isFilterable);
      setHelpText(field.helpText ?? '');
      setChoicesText((field.options?.choices ?? []).map((c) => c.label).join('\n'));
    } else {
      setKey('');
      setLabel('');
      setType(CustomFieldType.Text);
      setIsRequired(false);
      setIsFilterable(false);
      setHelpText('');
      setChoicesText('');
    }
  }, [field, open]);

  const save = useMutation({
    mutationFn: (dto: CustomFieldUpsertDto) =>
      field ? CustomFieldsApi.update(teamSlug, field.id, dto) : CustomFieldsApi.create(teamSlug, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['custom-fields', teamSlug] });
      toast.success('Champ enregistré');
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Échec de l'enregistrement."),
  });

  const hasChoices = type === CustomFieldType.Select || type === CustomFieldType.MultiSelect;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const choices = hasChoices
      ? choicesText
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => ({ value: l, label: l }))
      : undefined;

    save.mutate({
      entityType: entity,
      key,
      label,
      type: type as any,
      isRequired,
      isFilterable,
      helpText: helpText || null,
      options: choices ? { choices } : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{field ? 'Modifier le champ' : 'Nouveau champ'}</DialogTitle>
          <DialogDescription>Configurez les paramètres du champ personnalisé.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-2">
            <Label htmlFor="cf-label">Libellé</Label>
            <Input id="cf-label" required value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cf-key">Clé</Label>
            <Input
              id="cf-key"
              required
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="exemple_champ"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cf-type">Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="cf-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasChoices && (
            <div className="grid gap-2">
              <Label htmlFor="cf-choices">Choix (un par ligne)</Label>
              <Textarea
                id="cf-choices"
                value={choicesText}
                onChange={(e) => setChoicesText(e.target.value)}
                rows={4}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="cf-help">Texte d'aide</Label>
            <Textarea id="cf-help" rows={2} value={helpText} onChange={(e) => setHelpText(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isRequired} onCheckedChange={(c) => setIsRequired(Boolean(c))} />
              Obligatoire
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={isFilterable} onCheckedChange={(c) => setIsFilterable(Boolean(c))} />
              Filtrable
            </label>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {field ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
