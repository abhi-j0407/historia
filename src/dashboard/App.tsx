import { useCallback, useMemo } from 'react';

import type { UIPrefs } from '@/background/cache';
import { resolveRange } from '@/core/dates';
import type { Aggregate, BackfillProgress } from '@/core/types';
import { BackfillProgressBar } from '@/dashboard/components/BackfillProgressBar';
import { ErrorBanner } from '@/dashboard/components/ErrorBanner';
import { ErrorBoundary } from '@/dashboard/components/ErrorBoundary';
import { Header } from '@/dashboard/components/Header';
import { Heatmap } from '@/dashboard/components/Heatmap';
import { Toolbar } from '@/dashboard/components/Toolbar';
import { useAggregate } from '@/dashboard/hooks/useAggregate';
import { useBackfillProgress } from '@/dashboard/hooks/useBackfillProgress';
import { useUIPrefs } from '@/dashboard/hooks/useUIPrefs';
import { sendForceRefresh } from '@/dashboard/lib/storage-bridge';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <AppInner />
    </ErrorBoundary>
  );
}

function AppInner(): JSX.Element {
  const { aggregate, isInitialLoad } = useAggregate();
  const progress = useBackfillProgress();
  const { prefs, updatePrefs } = useUIPrefs();

  const handleRefresh = useCallback(() => {
    void sendForceRefresh();
  }, []);

  const isBackfillActive =
    progress.phase !== 'idle' && progress.phase !== 'done' && progress.phase !== 'error';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <Header aggregate={aggregate} onRefresh={handleRefresh} isRefreshing={isBackfillActive} />

      <BackfillProgressBar progress={progress} />

      <Toolbar
        view={prefs.lastView}
        range={prefs.lastDateRange}
        onViewChange={(v) => updatePrefs({ lastView: v })}
        onRangeChange={(r) => updatePrefs({ lastDateRange: r })}
      />

      <section aria-live="polite">
        <ShellBody
          aggregate={aggregate}
          isInitialLoad={isInitialLoad}
          progress={progress}
          view={prefs.lastView}
          dateRangeSelector={prefs.lastDateRange}
        />
      </section>
    </main>
  );
}

function ShellBody(props: {
  aggregate: Aggregate | null;
  isInitialLoad: boolean;
  progress: BackfillProgress;
  view: UIPrefs['lastView'];
  dateRangeSelector: UIPrefs['lastDateRange'];
}): JSX.Element {
  const { aggregate, isInitialLoad, progress, view, dateRangeSelector } = props;

  if (progress.phase === 'error') {
    return <ErrorBanner onRetry={() => void sendForceRefresh()} />;
  }
  if (isInitialLoad) {
    return <ShellLoading message="Reading your history…" />;
  }
  if (aggregate === null) {
    return <ShellLoading message="Reading your history…" />;
  }
  if (aggregate.topSites.length === 0) {
    return <ShellEmpty />;
  }
  return (
    <ViewPlaceholder view={view} aggregate={aggregate} dateRangeSelector={dateRangeSelector} />
  );
}

function ShellLoading({ message }: { message: string }): JSX.Element {
  return (
    <p className="text-muted-foreground text-sm" role="status">
      {message}
    </p>
  );
}

function ShellEmpty(): JSX.Element {
  return (
    <p className="text-muted-foreground text-sm">
      Nothing to show yet — once you&apos;ve browsed for a few days, this view will fill in.
    </p>
  );
}

function ViewPlaceholder(props: {
  view: UIPrefs['lastView'];
  aggregate: Aggregate;
  dateRangeSelector: UIPrefs['lastDateRange'];
}): JSX.Element {
  const range = useMemo(
    () => resolveRange(props.dateRangeSelector, props.aggregate.dateRange.earliest),
    [props.aggregate.dateRange.earliest, props.dateRangeSelector],
  );

  return (
    <div className="space-y-3 rounded-md border border-dashed p-6 text-sm">
      <p>
        Active view: <strong>{props.view}</strong> · {props.aggregate.topSites.length} sites tracked
        · {range.start} → {range.end}
      </p>
      <div className="overflow-x-auto">
        <Heatmap
          mode={{ kind: 'intensity', data: props.aggregate.totalVisitsPerDay }}
          range={range}
        />
      </div>
    </div>
  );
}
