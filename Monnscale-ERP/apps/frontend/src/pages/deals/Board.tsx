import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { BoardStage } from '@Moonscale/shared';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DealCard } from '@/components/crm/DealCard';
import { DealsApi } from '@/api/crm.api';
import { cn } from '@/lib/utils';

function clone(stages: BoardStage[]): BoardStage[] {
  return JSON.parse(JSON.stringify(stages)) as BoardStage[];
}

export function DealsBoardPage() {
  const { teamSlug = '' } = useParams<{ teamSlug: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [pipelineId, setPipelineId] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['deals-board', teamSlug, pipelineId],
    queryFn: () => DealsApi.board(teamSlug, pipelineId),
    enabled: !!teamSlug,
    retry: 0,
  });

  const [columns, setColumns] = useState<BoardStage[]>([]);
  useEffect(() => {
    if (data?.stages) setColumns(clone(data.stages));
  }, [data?.stages]);

  const [drag, setDrag] = useState<{ dealId: string; from: string } | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const currency = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  });

  const moveMutation = useMutation({
    mutationFn: ({ dealId, stageId, position }: { dealId: string; stageId: string; position: number }) =>
      DealsApi.move(teamSlug, dealId, { pipelineStageId: stageId, position }),
    onError: (e: any) => {
      toast.error(e?.response?.data?.message ?? 'Échec du déplacement.');
      qc.invalidateQueries({ queryKey: ['deals-board', teamSlug] });
    },
  });

  const onDragStart = (dealId: string, stageId: string) => setDrag({ dealId, from: stageId });

  const openDeal = (dealId: string) => navigate(`/${teamSlug}/deals/${dealId}`);

  const onDrop = (toStageId: string, index: number | null) => {
    setDragOverStage(null);
    const current = drag;
    setDrag(null);
    if (!current) return;

    const next = clone(columns);
    const fromColumn = next.find((c) => c.id === current.from);
    const toColumn = next.find((c) => c.id === toStageId);
    if (!fromColumn || !toColumn) return;

    const fromIndex = fromColumn.deals.findIndex((d) => d.id === current.dealId);
    if (fromIndex === -1) return;

    let insertAt = index ?? toColumn.deals.length;
    if (current.from === toStageId && fromIndex < insertAt) insertAt -= 1;

    if (current.from === toStageId && insertAt === fromIndex) return;

    const [moved] = fromColumn.deals.splice(fromIndex, 1);
    toColumn.deals.splice(insertAt, 0, moved);

    setColumns(next);

    moveMutation.mutate({ dealId: current.dealId, stageId: toStageId, position: insertAt });
  };

  return (
    <div className="relative flex h-full flex-1 flex-col gap-6 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="bg-brand-gradient shadow-glow-violet flex h-10 w-10 items-center justify-center rounded-xl text-white">
            <Target className="h-5 w-5" />
          </span>
          <div className="space-y-0.5">
            <h2 className="text-lg font-medium tracking-tight">Pipeline</h2>
            <p className="text-sm text-muted-foreground">Suivez vos opportunités commerciales</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data && data.pipelines.length > 1 && (
            <Select value={pipelineId ?? data.pipeline.id} onValueChange={setPipelineId}>
              <SelectTrigger className="w-52" aria-label="Pipeline">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button asChild>
            <Link to={`/${teamSlug}/deals/new`}>
              <Plus className="h-4 w-4" /> Nouvelle opportunité
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-x-auto pb-4">
        {isLoading &&
          [0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-96 w-[290px] shrink-0 rounded-2xl" />)}

        {isError && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
            Impossible de charger le pipeline : {(error as any)?.response?.data?.message ?? (error as Error)?.message ?? 'erreur inconnue'}
          </div>
        )}

        {!isLoading && !isError && columns.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Aucune étape configurée. Allez dans <strong className="mx-1">Administration → Pipeline & étapes</strong> pour en créer.
          </div>
        )}

        {columns.map((column) => (
          <section
            key={column.id}
            className={cn(
              'flex w-[290px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 bg-muted/30 transition-colors',
              dragOverStage === column.id && 'ring-2 ring-primary/50',
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(column.id);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={() => onDrop(column.id, null)}
          >
            <div
              className="h-1 w-full"
              style={{ backgroundColor: column.color ?? 'var(--primary)' }}
            />
            <header
              className={cn(
                'flex items-center justify-between gap-2 px-3 py-2.5',
                column.isWon && 'bg-emerald-500/10',
                column.isLost && 'bg-rose-500/10',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-semibold">{column.name}</span>
                <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {column.deals.length}
                </span>
              </div>
              <span className="shrink-0 text-xs font-semibold tabular-nums">
                {currency.format(column.totalAmount)}
              </span>
            </header>

            <div
              className={cn(
                'flex min-h-28 flex-1 flex-col gap-2.5 p-2.5 transition-colors',
                dragOverStage === column.id && 'bg-primary/5',
              )}
            >
              {column.deals.map((deal, index) => (
                <div
                  key={deal.id}
                  role="button"
                  tabIndex={0}
                  className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverStage(column.id);
                  }}
                  onDrop={(e) => {
                    e.stopPropagation();
                    onDrop(column.id, index);
                  }}
                  onClick={() => openDeal(deal.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') openDeal(deal.id);
                  }}
                >
                  <DealCard
                    deal={deal}
                    onDragStart={() => onDragStart(deal.id, column.id)}
                    onDragEnd={() => setDrag(null)}
                  />
                </div>
              ))}

              {column.deals.length === 0 && (
                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/80 px-2 py-8 text-center text-xs text-muted-foreground">
                  Déposez une opportunité ici
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
