import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'Moonscale-theme';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', isDark);
}

const TABS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Clair', icon: Sun },
  { value: 'dark', label: 'Sombre', icon: Moon },
  { value: 'system', label: 'Système', icon: Monitor },
];

export function AppearancePage() {
  const [theme, setTheme] = useState<Theme>(() => {
    const v = (typeof localStorage !== 'undefined' && (localStorage.getItem(STORAGE_KEY) as Theme | null)) || 'system';
    return v;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
    applyTheme(theme);
  }, [theme]);

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Paramètres d'apparence</h1>

      <div className="space-y-0.5">
        <h2 className="text-lg font-medium tracking-tight">Paramètres d'apparence</h2>
        <p className="text-sm text-muted-foreground">
          Mettez à jour les paramètres d'apparence de votre compte
        </p>
      </div>

      <div className="inline-flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors',
              theme === value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
