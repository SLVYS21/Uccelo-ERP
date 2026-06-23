import { Card, CardContent } from '@/components/ui/card';
import { Construction } from 'lucide-react';

export function PagePlaceholder({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-14 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <Construction className="size-6" />
        </div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">Page en cours de portage pixel-perfect.</p>
      </CardContent>
    </Card>
  );
}
