import { useMemo } from 'react';
import { cn } from '@/lib/utils';

const palettes: Array<[string, string]> = [
  ['var(--brand-violet)', 'var(--brand-indigo)'],
  ['var(--brand-cyan)', 'var(--brand-emerald)'],
  ['var(--brand-amber)', 'var(--brand-rose)'],
  ['var(--brand-rose)', 'var(--brand-amber)'],
  ['var(--brand-emerald)', 'var(--brand-cyan)'],
  ['var(--brand-indigo)', 'var(--brand-cyan)'],
  ['var(--brand-amber)', 'var(--brand-emerald)'],
  ['var(--brand-rose)', 'var(--brand-indigo)'],
];

interface Props {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function InitialsAvatar({ name, size = 'md', className }: Props) {
  const initials = useMemo(() => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [name]);

  const gradient = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    const [from, to] = palettes[hash % palettes.length];
    return { backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
  }, [name]);

  const sizeClass = { sm: 'h-6 w-6 text-[10px]', md: 'h-8 w-8 text-xs', lg: 'h-10 w-10 text-sm' }[size];

  return (
    <span
      style={gradient}
      title={name}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ring-2 ring-background',
        sizeClass,
        className,
      )}
    >
      {initials}
    </span>
  );
}
