import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  aside?: ReactNode;
}

export function FormShell({ title, description, icon: Icon, children, aside }: Props) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4">
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-card">
        <div className="bg-mesh absolute inset-0" aria-hidden="true" />
        <div className="relative flex items-start gap-4 p-5 sm:p-6">
          <span className="bg-brand-gradient shadow-glow-violet flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white">
            <Icon className="h-7 w-7" />
          </span>
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent>{children}</CardContent>
        </Card>
        {aside && (
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-4">{aside}</div>
          </aside>
        )}
      </div>
    </div>
  );
}
