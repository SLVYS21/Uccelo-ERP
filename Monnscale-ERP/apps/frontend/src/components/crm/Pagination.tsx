import { cn } from '@/lib/utils';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onChange }: Props) {
  if (total === 0) return null;
  const last = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const items: Array<number | '…'> = [];
  for (let i = 1; i <= last; i++) {
    if (i === 1 || i === last || (i >= page - 1 && i <= page + 1)) items.push(i);
    else if (items[items.length - 1] !== '…') items.push('…');
  }

  return (
    <nav className="flex flex-col items-center justify-between gap-3 sm:flex-row" aria-label="Pagination">
      <p className="text-sm text-muted-foreground">
        {from}–{to} of {total}
      </p>
      <div className="flex flex-wrap items-center gap-1">
        <button
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          «
        </button>
        {items.map((it, i) =>
          it === '…' ? (
            <span key={`e${i}`} className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm text-muted-foreground/50">
              …
            </span>
          ) : (
            <button
              key={it}
              className={cn(
                'inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition-colors',
                it === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
              )}
              onClick={() => onChange(it)}
            >
              {it}
            </button>
          ),
        )}
        <button
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md px-3 text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          disabled={page >= last}
          onClick={() => onChange(page + 1)}
        >
          »
        </button>
      </div>
    </nav>
  );
}
