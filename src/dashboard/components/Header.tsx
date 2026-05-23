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
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">historia</h1>
        {aggregate ? (
          <p className="text-muted-foreground mt-1 text-sm">
            updated {formatDistanceToNow(new Date(aggregate.computedAt), { addSuffix: true })}
          </p>
        ) : null}
      </div>
      <Button
        type="button"
        variant="ghost"
        onClick={onRefresh}
        disabled={isRefreshing}
        aria-label="Refresh browsing history"
      >
        <RefreshCw className={isRefreshing ? 'motion-safe:animate-spin' : undefined} aria-hidden />
        Refresh
      </Button>
    </header>
  );
}
