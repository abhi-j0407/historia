import { useCallback, useEffect, useMemo } from 'react';

import type { UIPrefs } from '@/background/cache';
import { resolveRange } from '@/core/dates';
import type { Aggregate, BackfillProgress } from '@/core/types';
import { BackfillProgressBar } from '@/dashboard/components/BackfillProgressBar';
import { ErrorBanner } from '@/dashboard/components/ErrorBanner';
import { ErrorBoundary } from '@/dashboard/components/ErrorBoundary';
import { Header } from '@/dashboard/components/Header';
import { Toolbar } from '@/dashboard/components/Toolbar';
import { useAggregate } from '@/dashboard/hooks/useAggregate';
import { useBackfillProgress } from '@/dashboard/hooks/useBackfillProgress';
import { useUIPrefs } from '@/dashboard/hooks/useUIPrefs';
import { sendForceRefresh } from '@/dashboard/lib/storage-bridge';
import { OverallView } from '@/dashboard/views/OverallView';
import { PerSiteView } from '@/dashboard/views/PerSiteView';
import { WinnersView } from '@/dashboard/views/WinnersView';

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
          lastSelectedSite={prefs.lastSelectedSite}
          onSelectApex={(apex) => updatePrefs({ lastSelectedSite: apex })}
          onCorrectSelectedSite={(apex) => updatePrefs({ lastSelectedSite: apex })}
        />
      </section>
    </main>
  );
}

function resolveEffectiveApex(aggregate: Aggregate, lastSelectedSite: string | null): string {
  if (
    lastSelectedSite !== null &&
    aggregate.topSites.some((s) => s.apexDomain === lastSelectedSite)
  ) {
    return lastSelectedSite;
  }
  return aggregate.topSites[0]!.apexDomain;
}

function ShellBody(props: {
  aggregate: Aggregate | null;
  isInitialLoad: boolean;
  progress: BackfillProgress;
  view: UIPrefs['lastView'];
  dateRangeSelector: UIPrefs['lastDateRange'];
  lastSelectedSite: string | null;
  onSelectApex: (apex: string) => void;
  onCorrectSelectedSite: (apex: string) => void;
}): JSX.Element {
  const {
    aggregate,
    isInitialLoad,
    progress,
    view,
    dateRangeSelector,
    lastSelectedSite,
    onSelectApex,
    onCorrectSelectedSite,
  } = props;

  const now = useMemo(() => new Date(), []);

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
    <DashboardViews
      aggregate={aggregate}
      view={view}
      dateRangeSelector={dateRangeSelector}
      lastSelectedSite={lastSelectedSite}
      now={now}
      onSelectApex={onSelectApex}
      onCorrectSelectedSite={onCorrectSelectedSite}
    />
  );
}

function DashboardViews(props: {
  aggregate: Aggregate;
  view: UIPrefs['lastView'];
  dateRangeSelector: UIPrefs['lastDateRange'];
  lastSelectedSite: string | null;
  now: Date;
  onSelectApex: (apex: string) => void;
  onCorrectSelectedSite: (apex: string) => void;
}): JSX.Element {
  const {
    aggregate,
    view,
    dateRangeSelector,
    lastSelectedSite,
    now,
    onSelectApex,
    onCorrectSelectedSite,
  } = props;

  const range = useMemo(
    () => resolveRange(dateRangeSelector, aggregate.dateRange.earliest, now),
    [aggregate.dateRange.earliest, dateRangeSelector, now],
  );

  const effectiveApex = useMemo(
    () => resolveEffectiveApex(aggregate, lastSelectedSite),
    [aggregate, lastSelectedSite],
  );

  useEffect(() => {
    if (effectiveApex !== lastSelectedSite) {
      onCorrectSelectedSite(effectiveApex);
    }
  }, [effectiveApex, lastSelectedSite, onCorrectSelectedSite]);

  const viewContent = useMemo(() => {
    switch (view) {
      case 'per-site':
        return (
          <PerSiteView
            aggregate={aggregate}
            range={range}
            selectedApex={effectiveApex}
            onSelectApex={onSelectApex}
          />
        );
      case 'overall':
        return <OverallView aggregate={aggregate} range={range} />;
      case 'winners':
        return <WinnersView aggregate={aggregate} range={range} />;
      default: {
        const _exhaustive: never = view;
        return _exhaustive;
      }
    }
  }, [aggregate, effectiveApex, onSelectApex, range, view]);

  return <div className="overflow-x-auto">{viewContent}</div>;
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
