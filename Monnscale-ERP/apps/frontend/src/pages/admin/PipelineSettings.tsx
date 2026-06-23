import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, KanbanSquare, Pencil, Plus, Trash2, Trophy, X } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PipelineStageRef, PipelineWithStages } from '@Moonscale/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PipelinesApi } from '@/api/crm.api';
import { cn } from '@/lib/utils';

const SWATCHES = ['#2740e0', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#f43f5e', '#94a3b8'];

export function PipelineSettingsPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const qc = useQueryClient();

  const { data: pipelines = [] } = useQuery({
    queryKey: ['pipelines', teamSlug],
    queryFn: () => PipelinesApi.list(teamSlug),
    enabled: !!teamSlug,
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineStageRef | null>(null);
  const [targetPipelineId, setTargetPipelineId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string | null>('#2740e0');

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setColor(editing.color ?? '#2740e0');
    } else {
      setName('');
      setColor('#2740e0');
    }
  }, [editing, editorOpen]);

  const openCreate = (pipeline: PipelineWithStages) => {
    setEditing(null);
    setTargetPipelineId(pipeline.id);
    setEditorOpen(true);
  };
  const openEdit = (stage: PipelineStageRef) => {
    setEditing(stage);
    setEditorOpen(true);
  };

  const save = useMutation({
    mutationFn: () => {
      const dto = { name, color };
      if (editing) return PipelinesApi.updateStage(teamSlug, editing.id, dto);
      return PipelinesApi.addStage(teamSlug, targetPipelineId!, dto);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', teamSlug] });
      toast.success('Étape enregistrée');
      setEditorOpen(false);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Échec de l'enregistrement."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => PipelinesApi.removeStage(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pipelines', teamSlug] });
      toast.success('Étape supprimée');
    },
  });

  const reorder = useMutation({
    mutationFn: ({ pipelineId, orderedIds }: { pipelineId: string; orderedIds: string[] }) =>
      PipelinesApi.reorder(teamSlug, { pipelineId, orderedIds }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['pipelines', teamSlug] }),
  });

  const move = (pipeline: PipelineWithStages, stage: PipelineStageRef, direction: -1 | 1) => {
    const ids = pipeline.stages.map((s) => s.id);
    const from = ids.indexOf(stage.id);
    const to = from + direction;
    if (to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    reorder.mutate({ pipelineId: pipeline.id, orderedIds: ids });
  };

  const canDelete = (stage: PipelineStageRef) => !stage.isWon && !stage.isLost;

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4">
      <div className="flex items-center gap-3">
        <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
          <KanbanSquare className="h-5 w-5" />
        </span>
        <div className="space-y-0.5">
          <h2 className="text-lg font-medium tracking-tight">Étapes du pipeline</h2>
          <p className="text-sm text-muted-foreground">Renommez, colorez et réordonnez vos étapes de vente</p>
        </div>
      </div>

      {pipelines.map((pipeline) => (
        <Card key={pipeline.id}>
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
            <CardTitle>{pipeline.name}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => openCreate(pipeline)}>
              <Plus className="h-4 w-4" /> Nouvelle étape
            </Button>
          </CardHeader>
          <CardContent className="divide-y p-0">
            {pipeline.stages.map((stage, stageIndex) => (
              <div key={stage.id} className="flex items-center gap-3 p-3.5">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color ?? 'var(--primary)' }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{stage.name}</span>
                    {stage.isWon && (
                      <Badge className="gap-1 bg-emerald-600 text-white">
                        <Trophy className="h-3 w-3" /> Étape gagnée
                      </Badge>
                    )}
                    {stage.isLost && (
                      <Badge variant="destructive" className="gap-1">
                        <X className="h-3 w-3" /> Étape perdue
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={stageIndex === 0}
                  aria-label="Monter l'étape"
                  onClick={() => move(pipeline, stage, -1)}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={stageIndex === pipeline.stages.length - 1}
                  aria-label="Descendre l'étape"
                  onClick={() => move(pipeline, stage, 1)}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Modifier l'étape"
                  onClick={() => openEdit(stage)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                {canDelete(stage) ? (
                  <ConfirmDialog
                    description={`Supprimer l'étape « ${stage.name} » ?`}
                    onConfirm={() => remove.mutate(stage.id)}
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Supprimer l'étape">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </ConfirmDialog>
                ) : (
                  <span
                    className="h-8 w-8"
                    aria-hidden="true"
                    title="Étape terminale : ne peut pas être supprimée"
                  />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'étape" : 'Nouvelle étape'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Le nom et la couleur sont modifiables.'
                : "L'étape sera insérée avant les étapes terminales (Gagné / Perdu)."}
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
              <Label htmlFor="stage-name">Nom</Label>
              <Input id="stage-name" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap items-center gap-2">
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
