// components/ui/scroll-area.tsx

import React from 'react';
import { cn } from '@/lib/utils';

export function ScrollArea({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'overflow-y-auto scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted scrollbar-track-transparent',
        className
      )}
    >
      {children}
    </div>
  );
}
