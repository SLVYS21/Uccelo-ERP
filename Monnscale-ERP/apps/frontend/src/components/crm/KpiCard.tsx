import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useCountUp } from '@/hooks/use-count-up';
import { cn } from '@/lib/utils';

type Accent = 'indigo' | 'sky' | 'emerald' | 'amber' | 'rose' | 'violet';

const accents: Record<Accent, { from: string; to: string }> = {
  indigo: { from: 'var(--brand-violet)', to: 'var(--brand-indigo)' },
  sky: { from: 'var(--brand-cyan)', to: 'var(--brand-violet)' },
  emerald: { from: 'var(--brand-emerald)', to: 'var(--brand-cyan)' },
  amber: { from: 'var(--brand-amber)', to: 'var(--brand-rose)' },
  rose: { from: 'var(--brand-rose)', to: 'var(--brand-violet)' },
  violet: { from: 'var(--brand-indigo)', to: 'var(--brand-violet)' },
};

interface Props {
  label: string;
  value: number;
  format?: 'number' | 'currency' | 'percent';
  hint?: string;
  delta?: number | null;
  icon?: LucideIcon;
  accent?: Accent;
}

export function KpiCard({
  label,
  value,
  format = 'number',
  hint,
  delta,
  icon: Icon,
  accent = 'indigo',
}: Props) {
  const tileStyle = {
    backgroundImage: `linear-gradient(135deg, ${accents[accent].from}, ${accents[accent].to})`,
  };
  const { display } = useCountUp(value);
  const formatted =
    format === 'currency' ? `${display} FCFA` : format === 'percent' ? `${display} %` : display;
  const hasDelta = delta != null && Number.isFinite(delta);
  const isUp = (delta ?? 0) >= 0;
  const abs = Math.abs(delta ?? 0);
  const deltaLabel = abs >= 1000 ? `×${Math.round(1 + abs / 100)}` : `${abs} %`;

  return (
    <Card className="card-hover h-full gap-0 py-4">
      <CardContent className="flex h-full flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {Icon && (
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
              style={tileStyle}
            >
              <Icon className="h-4 w-4" />
            </span>
          )}
        </div>

        <p className="text-2xl leading-none font-bold tracking-tight tabular-nums">{formatted}</p>

        <div className="mt-auto flex min-h-[20px] items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                isUp
                  ? 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/12 text-rose-600 dark:text-rose-400',
              )}
            >
              {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {deltaLabel}
            </span>
          )}
          {hint && <span className="truncate text-muted-foreground">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}
