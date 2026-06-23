import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckSquare, Plus, Trash2 } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { TaskItem, TaskUpsertDto } from '@Moonscale/shared';
import { TaskPriority } from '@Moonscale/shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/crm/EmptyState';
import { InitialsAvatar } from '@/components/crm/InitialsAvatar';
import { Pagination } from '@/components/crm/Pagination';
import { ConfirmDialog } from '@/components/crm/ConfirmDialog';
import { TasksApi } from '@/api/crm.api';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 25;

type StatusFilter = 'open' | 'completed' | 'all';

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: 'open', label: 'À faire' },
  { value: 'completed', label: 'Terminées' },
  { value: 'all', label: 'Toutes' },
];

const PRIORITY_VARIANT: Record<string, 'destructive' | 'secondary' | 'outline'> = {
  high: 'destructive',
  normal: 'secondary',
  low: 'outline',
};

const PRIORITY_LABELS: Record<string, string> = {
  high: 'Haute',
  normal: 'Normale',
  low: 'Basse',
};

function fmtDate(iso: string | null): string {
  return iso ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(iso)) : '—';
}

function isOverdue(task: TaskItem): boolean {
  if (task.isCompleted || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

export function TasksIndexPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const qc = useQueryClient();
  const [status, setStatus] = useState<StatusFilter>('open');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [status]);

  const completed = status === 'completed' ? true : status === 'open' ? false : undefined;

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', teamSlug, status, page],
    queryFn: () => TasksApi.list(teamSlug, { page, completed }),
    enabled: !!teamSlug,
  });

  const toggle = useMutation({
    mutationFn: (task: TaskItem) => TasksApi.toggle(teamSlug, task.id, !task.isCompleted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', teamSlug] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => TasksApi.remove(teamSlug, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', teamSlug] });
      toast.success('Tâche supprimée');
    },
  });

  const rows = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex h-full flex-1 flex-col gap-5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <CheckSquare className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Tâches</h2>
            <p className="text-sm text-muted-foreground">Suivez les actions à mener</p>
          </div>
          {total > 0 && (
            <Badge variant="secondary" className="tabular-nums">
              {total}
            </Badge>
          )}
        </div>

        <CreateTaskDialog teamSlug={teamSlug} />
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Button
            key={s.value}
            size="sm"
            variant={status === s.value ? 'default' : 'outline'}
            onClick={() => setStatus(s.value)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">
        {isLoading && <Skeleton className="h-16 w-full" />}
        {rows.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3 shadow-card"
          >
            <Checkbox
              checked={task.isCompleted}
              aria-label="Basculer l'état de la tâche"
              onCheckedChange={() => toggle.mutate(task)}
            />
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'truncate text-sm font-medium',
                  task.isCompleted && 'text-muted-foreground line-through',
                )}
              >
                {task.title}
              </p>
              <p
                className={cn(
                  'truncate text-xs',
                  isOverdue(task) ? 'font-medium text-destructive' : 'text-muted-foreground',
                )}
              >
                {[task.dueAt ? fmtDate(task.dueAt) : null, task.assignee?.name].filter(Boolean).join(' · ') || '—'}
              </p>
            </div>
            <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}>
              {task.priorityLabel ?? PRIORITY_LABELS[task.priority]}
            </Badge>
          </div>
        ))}
        {!isLoading && rows.length === 0 && (
          <EmptyState
            icon={CheckSquare}
            title="Aucune tâche"
            description="Tout est à jour ! Créez une tâche pour planifier votre prochaine action."
          >
            <CreateTaskDialog teamSlug={teamSlug} size="sm" variant="outline" />
          </EmptyState>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Tâche</TableHead>
              <TableHead>Échéance</TableHead>
              <TableHead>Priorité</TableHead>
              <TableHead>Assignée à</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <Checkbox
                    checked={task.isCompleted}
                    aria-label="Basculer l'état de la tâche"
                    onCheckedChange={() => toggle.mutate(task)}
                  />
                </TableCell>
                <TableCell>
                  <p className={cn('font-medium', task.isCompleted && 'text-muted-foreground line-through')}>
                    {task.title}
                  </p>
                  {task.related && <p className="text-xs text-muted-foreground">{task.related.label}</p>}
                </TableCell>
                <TableCell className={cn(isOverdue(task) && 'font-medium text-destructive')}>
                  {fmtDate(task.dueAt)}
                </TableCell>
                <TableCell>
                  <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'secondary'}>
                    {task.priorityLabel ?? PRIORITY_LABELS[task.priority]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.assignee ? (
                    <span className="inline-flex items-center gap-2">
                      <InitialsAvatar name={task.assignee.name} size="sm" />
                      {task.assignee.name}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <ConfirmDialog description="Supprimer cette tâche ?" onConfirm={() => remove.mutate(task.id)}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Supprimer la tâche">
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </ConfirmDialog>
                </TableCell>
              </TableRow>
            ))}

            {!isLoading && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={CheckSquare}
                    title="Aucune tâche"
                    description="Tout est à jour ! Créez une tâche pour planifier votre prochaine action."
                  >
                    <CreateTaskDialog teamSlug={teamSlug} size="sm" variant="outline" />
                  </EmptyState>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  );
}

function CreateTaskDialog({
  teamSlug,
  size,
  variant,
}: {
  teamSlug: string;
  size?: 'sm' | 'default';
  variant?: 'default' | 'outline';
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [priority, setPriority] = useState<string>(TaskPriority.Normal);

  const create = useMutation({
    mutationFn: (dto: TaskUpsertDto) => TasksApi.create(teamSlug, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', teamSlug] });
      toast.success('Tâche créée');
      setOpen(false);
      setTitle('');
      setDescription('');
      setDueAt('');
      setPriority(TaskPriority.Normal);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Échec de la création."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant}>
          <Plus className="h-4 w-4" /> Nouvelle tâche
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
          <DialogDescription>Planifiez une action à mener.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate({
              title,
              description: description || null,
              dueAt: dueAt || null,
              priority: priority as any,
            });
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="task-title">
              Titre <span className="text-destructive">*</span>
            </Label>
            <Input
              id="task-title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. Rappeler le client"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-description">Description</Label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contexte, points à aborder…"
              rows={3}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="task-due">Échéance</Label>
              <Input id="task-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="task-priority">Priorité</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="task-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TaskPriority.Low}>Basse</SelectItem>
                  <SelectItem value={TaskPriority.Normal}>Normale</SelectItem>
                  <SelectItem value={TaskPriority.High}>Haute</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={create.isPending}>
              Créer la tâche
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
