import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { aggregate } from '@/core/aggregate';
import type { Aggregate, BackfillProgress } from '@/core/types';
import { App } from '@/dashboard/App';
import { ErrorBoundary } from '@/dashboard/components/ErrorBoundary';
import * as useAggregateModule from '@/dashboard/hooks/useAggregate';
import * as useBackfillProgressModule from '@/dashboard/hooks/useBackfillProgress';
import * as useUIPrefsModule from '@/dashboard/hooks/useUIPrefs';
import * as storageBridge from '@/dashboard/lib/storage-bridge';

import { syntheticVisits } from '../../tests/fixtures/synthetic-history';

const PINNED_AT = 1_700_000_000_000;

function sampleAggregate(): Aggregate {
  return aggregate(syntheticVisits(), PINNED_AT);
}

const idleProgress: BackfillProgress = {
  phase: 'idle',
  processed: 0,
  total: 0,
  startedAt: 0,
};

const defaultPrefs = {
  version: 1 as const,
  lastView: 'per-site' as const,
  lastSelectedSite: null,
  lastDateRange: 'all' as const,
};

function mockHooks(options: {
  aggregate: Aggregate | null;
  isInitialLoad: boolean;
  progress?: BackfillProgress;
  lastView?: 'per-site' | 'overall' | 'winners';
}): void {
  vi.spyOn(useAggregateModule, 'useAggregate').mockReturnValue({
    aggregate: options.aggregate,
    isInitialLoad: options.isInitialLoad,
  });
  vi.spyOn(useBackfillProgressModule, 'useBackfillProgress').mockReturnValue(
    options.progress ?? idleProgress,
  );
  vi.spyOn(useUIPrefsModule, 'useUIPrefs').mockReturnValue({
    prefs: { ...defaultPrefs, lastView: options.lastView ?? 'per-site' },
    updatePrefs: vi.fn(),
  });
}

describe('App', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders ShellLoading when isInitialLoad is true', () => {
    mockHooks({ aggregate: null, isInitialLoad: true });
    render(<App />);
    expect(screen.getByText('Reading your history…')).toBeInTheDocument();
  });

  it('renders ShellEmpty when aggregate has no top sites', () => {
    const empty = { ...sampleAggregate(), topSites: [] };
    mockHooks({ aggregate: empty, isInitialLoad: false });
    render(<App />);
    expect(screen.getByText(/nothing to show yet/i)).toBeInTheDocument();
  });

  it('renders ViewPlaceholder with active view when aggregate has data', () => {
    const agg = sampleAggregate();
    mockHooks({ aggregate: agg, isInitialLoad: false, lastView: 'winners' });
    render(<App />);
    expect(screen.getByText(/active view:/i)).toHaveTextContent('winners');
    expect(
      screen.getByText(new RegExp(`${agg.topSites.length} sites tracked`)),
    ).toBeInTheDocument();
  });

  it('invokes sendForceRefresh when Refresh is clicked', async () => {
    const user = userEvent.setup();
    const sendSpy = vi.spyOn(storageBridge, 'sendForceRefresh').mockResolvedValue();
    mockHooks({ aggregate: sampleAggregate(), isInitialLoad: false });
    render(<App />);

    await user.click(screen.getByRole('button', { name: /refresh browsing history/i }));

    expect(sendSpy).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorBoundary', () => {
  it('renders ErrorBanner when a child throws during render', () => {
    function Bomb(): JSX.Element {
      throw new Error('render boom');
    }

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(vi.fn());

    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/couldn't read your history/i);
    consoleSpy.mockRestore();
  });
});
