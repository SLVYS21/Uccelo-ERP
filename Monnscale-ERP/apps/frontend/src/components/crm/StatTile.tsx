import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '@/hooks/use-count-up';

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
  icon?: LucideIcon;
  accent?: Accent;
}

export function StatTile({ label, value, format = 'number', icon: Icon, accent = 'indigo' }: Props) {
  const tileStyle = {
    backgroundImage: `linear-gradient(135deg, ${accents[accent].from}, ${accents[accent].to})`,
  };
  const { display } = useCountUp(value);
  const formatted =
    format === 'currency' ? `${display} FCFA` : format === 'percent' ? `${display} %` : display;

  return (
    <div className="card-hover flex items-center gap-3 rounded-xl border bg-card p-3 shadow-card">
      {Icon && (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={tileStyle}
        >
          <Icon className="h-5 w-5" />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-xl leading-tight font-bold tracking-tight tabular-nums">{formatted}</p>
      </div>
    </div>
  );
}
