import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ListChecks, Lock, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PicklistOptionItem } from '@Moonscale/shared';
import { Picklist as PicklistEnum } from '@Moonscale/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { ConfirmDialog } from '@/components/crm/ConfirmDialog';
import { EmptyState } from '@/components/crm/EmptyState';
import { PicklistsApi } from '@/api/crm.api';
import { cn } from '@/lib/utils';

const PICKLIST_META: { value: typeof PicklistEnum[keyof typeof PicklistEnum]; label: string; description: string }[] = [
  { value: PicklistEnum.Industry, label: 'Secteurs', description: 'Liste des secteurs d\'activité disponibles pour les entreprises.' },
  { value: PicklistEnum.ActivityType, label: 'Types d\'activité', description: 'Types d\'activités enregistrables (appel, e-mail…).' },
  { value: PicklistEnum.TaskPriority, label: 'Priorités de tâche', description: 'Niveaux de priorité utilisables sur les tâches.' },
];

const SWATCHES = ['#2740e0', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#94a3b8'];

export function PicklistsPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const qc = useQueryClient();
  const [activeList, setActiveList] = useState<string>(PicklistEnum.Industry);

  const { data } = useQuery({
    queryKey: ['picklists', teamSlug],
    queryFn: () => PicklistsApi.list(teamSlug),
    enabled: !!teamSlug,
  });

  const items = (data?.[activeList as keyof typeof data] as PicklistOptionItem[] | undefined) ?? [];
  const activeMeta = PICKLIST_META.find((m) => m.value === activeList);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PicklistOptionItem | null>(null);
  const [label, setLabel] = useState('');
  const [color, setColor] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      setLabel(editing.label);
      setColor(editing.color);
    } else {
      setLabel('');
      setColor(null);
    }
  }, [editing, editorOpen]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };
  const openEdit = (option: PicklistOptionItem) => {
    setEditing(option);
    setEditorOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const dto = { picklist: activeList as any, value: label.toLowerCase().replace(/\s+/g, '_'), label, color };
      return editing ? PicklistsApi.update(teamSlug, editing.id, dto) : PicklistsApi.create(teamSlug, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['picklists', teamSlug] });
      toast.success('Option enregistrée');
      setEditorOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Échec de l'enregistrement."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => PicklistsApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['picklists', teamSlug] });
      toast.success('Option supprimée');
    },
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) =>
      PicklistsApi.reorder(teamSlug, { picklist: activeList as any, orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['picklists', teamSlug] }),
  });

  const move = (option: PicklistOptionItem, direction: -1 | 1) => {
    const ids = items.map((i) => i.id);
    const from = ids.indexOf(option.id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    reorder.mutate(ids);
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <ListChecks className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Listes de choix</h2>
            <p className="text-sm text-muted-foreground">Configurez les valeurs proposées dans les listes déroulantes</p>
          </div>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nouvelle option
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {PICKLIST_META.map((list) => (
          <Button
            key={list.value}
            size="sm"
            variant={activeList === list.value ? 'default' : 'outline'}
            onClick={() => setActiveList(list.value)}
          >
            {list.label}
          </Button>
        ))}
      </div>

      {activeMeta && <p className="text-sm text-muted-foreground">{activeMeta.description}</p>}

      <Card>
        <CardContent className="divide-y p-0">
          {items.map((option, optionIndex) => (
            <div key={option.id} className="flex items-center gap-3 p-3.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full border"
                style={{ backgroundColor: option.color ?? 'transparent' }}
                title={option.color ?? 'Sans couleur'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{option.label}</span>
                  {option.isSystem && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="h-3 w-3" /> Système
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{option.value}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={optionIndex === 0}
                aria-label="Monter l'option"
                onClick={() => move(option, -1)}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={optionIndex === items.length - 1}
                aria-label="Descendre l'option"
                onClick={() => move(option, 1)}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                aria-label="Modifier l'option"
                onClick={() => openEdit(option)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              {!option.isSystem ? (
                <ConfirmDialog
                  description={`Supprimer l'option « ${option.label} » ? Les fiches qui l'utilisent conserveront la valeur enregistrée.`}
                  onConfirm={() => remove.mutate(option.id)}
                >
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Supprimer l'option">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </ConfirmDialog>
              ) : (
                <span className="h-8 w-8" aria-hidden="true" />
              )}
            </div>
          ))}

          {items.length === 0 && (
            <EmptyState icon={ListChecks} title="Aucune option" description="Ajoutez la première option de cette liste.">
              <Button variant="outline" size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4" /> Nouvelle option
              </Button>
            </EmptyState>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'option" : 'Nouvelle option'}</DialogTitle>
            <DialogDescription>
              {activeMeta?.label} — {editing ? 'le libellé et la couleur sont modifiables.' : "l'option sera proposée immédiatement dans les formulaires."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="grid gap-2">
              <Label htmlFor="option-label">Libellé</Label>
              <Input id="option-label" required value={label} onChange={(e) => setLabel(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={cn(
                    'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border text-[10px] text-muted-foreground transition-shadow',
                    color === null && 'ring-2 ring-ring ring-offset-2',
                  )}
                  aria-label="Sans couleur"
                  onClick={() => setColor(null)}
                >
                  —
                </button>
                {SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    className={cn(
                      'h-7 w-7 cursor-pointer rounded-full border transition-shadow',
                      color === swatch && 'ring-2 ring-ring ring-offset-2',
                    )}
                    style={{ backgroundColor: swatch }}
                    aria-label={`Couleur ${swatch}`}
                    onClick={() => setColor(swatch)}
                  />
                ))}
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" onClick={() => setEditorOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {editing ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
