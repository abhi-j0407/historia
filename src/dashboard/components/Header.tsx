import { formatDistanceToNow } from 'date-fns';
import { RefreshCw } from 'lucide-react';

import type { Aggregate } from '@/core/types';
import { Button } from '@/dashboard/components/ui/button';

/** UX-S-01 — Product title, last-updated stamp, and manual refresh control. */
export function Header({
  aggregate,
  onRefresh,
  isRefreshing,
}: {
  aggregate: Aggregate | null;
  onRefresh: () => void;
  isRefreshing: boolean;
}): JSX.Element {
  return (
    <header className="border-border flex flex-wrap items-end justify-between gap-4 border-b pb-6">
      <div>
        <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase">Local history</p>
        <h1 className="font-display text-foreground mt-1 text-4xl font-normal tracking-tight">
          historia
        </h1>
        {aggregate ? (
          <p className="text-muted-foreground mt-2 text-sm">
            Updated {formatDistanceToNow(new Date(aggregate.computedAt), { addSuffix: true })}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-primary/30 text-primary hover:bg-accent motion-safe:transition-colors"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh browsing history"
      >
        <RefreshCw className={isRefreshing ? 'motion-safe:animate-spin' : undefined} aria-hidden />
        Sync history
      </Button>
    </header>
  );
}
