import type { BackfillProgress } from '@/core/types';

/** UX-S-06 — Thin progress strip during active backfill phases. */
export function BackfillProgressBar({
  progress,
}: {
  progress: BackfillProgress;
}): JSX.Element | null {
  if (progress.phase === 'idle' || progress.phase === 'done') {
    return null;
  }

  const indeterminate = progress.total === 0;
  const percent =
    !indeterminate && progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;

  return (
    <div
      className="flex flex-col gap-2 motion-safe:transition-opacity"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
        {indeterminate ? (
          <div className="bg-primary/50 h-full w-full motion-safe:animate-pulse" />
        ) : (
          <div
            className="bg-primary h-full motion-safe:transition-[width] motion-safe:duration-300 motion-safe:ease-out"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Syncing your history locally… {progress.processed} of {progress.total}
      </p>
    </div>
  );
}
