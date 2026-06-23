import * as React from 'react';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface SpinnerProps extends React.ComponentProps<'svg'> {
  size?: number;
}

function Spinner({ className, size, ...props }: SpinnerProps) {
  return (
    <Loader2
      data-slot="spinner"
      role="status"
      aria-label="Loading"
      className={cn('text-muted-foreground size-4 animate-spin', className)}
      {...(size ? { width: size, height: size } : {})}
      {...props}
    />
  );
}

export { Spinner };
