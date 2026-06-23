import { Building2, GripVertical } from 'lucide-react';
import { useMemo } from 'react';
import type { DealCard as DealCardType } from '@Moonscale/shared';
import { InitialsAvatar } from './InitialsAvatar';
import { formatCurrency } from '@/lib/format';

interface Props {
  deal: DealCardType;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function DealCard({ deal, onDragStart, onDragEnd }: Props) {
  const amountLabel = useMemo(() => {
    if (deal.amount == null) return null;
    return formatCurrency(deal.amount, deal.currency || 'XOF');
  }, [deal.amount, deal.currency]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="group card-hover relative cursor-grab rounded-xl border border-border/70 bg-card p-3 shadow-card active:cursor-grabbing"
    >
      <GripVertical className="absolute top-2.5 right-1.5 h-4 w-4 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
      <p className="line-clamp-2 pr-4 text-sm font-semibold">{deal.name}</p>
      {amountLabel && (
        <p className="text-gradient mt-1.5 text-base font-bold tracking-tight tabular-nums">
          {amountLabel}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        {deal.company ? (
          <span className="inline-flex min-w-0 items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{deal.company.name}</span>
          </span>
        ) : (
          <span />
        )}
        {deal.owner && <InitialsAvatar name={deal.owner.name} size="sm" />}
      </div>
    </div>
  );
}
