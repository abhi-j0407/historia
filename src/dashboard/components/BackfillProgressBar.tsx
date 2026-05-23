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
          <div className="bg-foreground/40 h-full w-full motion-safe:animate-pulse" />
        ) : (
          <div
            className="bg-foreground/70 h-full motion-safe:transition-[width]"
            style={{ width: `${percent}%` }}
          />
        )}
      </div>
      <p className="text-muted-foreground text-xs">
        Reading your history… {progress.processed} of {progress.total}
      </p>
    </div>
  );
}
