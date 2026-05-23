import { render, screen, waitFor } from '@testing-library/react';
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
  lastSelectedSite?: string | null;
  updatePrefs?: ReturnType<typeof vi.fn>;
}): ReturnType<typeof vi.fn> {
  const updatePrefs = options.updatePrefs ?? vi.fn();
  vi.spyOn(useAggregateModule, 'useAggregate').mockReturnValue({
    aggregate: options.aggregate,
    isInitialLoad: options.isInitialLoad,
  });
  vi.spyOn(useBackfillProgressModule, 'useBackfillProgress').mockReturnValue(
    options.progress ?? idleProgress,
  );
  vi.spyOn(useUIPrefsModule, 'useUIPrefs').mockReturnValue({
    prefs: {
      ...defaultPrefs,
      lastView: options.lastView ?? 'per-site',
      lastSelectedSite: options.lastSelectedSite !== undefined ? options.lastSelectedSite : null,
    },
    updatePrefs,
  });
  return updatePrefs;
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

  it('renders per-site view with heatmap when lastView is per-site', () => {
    mockHooks({ aggregate: sampleAggregate(), isInitialLoad: false, lastView: 'per-site' });
    render(<App />);
    expect(screen.getByRole('tablist', { name: /sites/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /activity heatmap/i })).toBeInTheDocument();
    expect(screen.getByText('Total visits')).toBeInTheDocument();
  });

  it('renders overall view when lastView is overall', () => {
    mockHooks({ aggregate: sampleAggregate(), isInitialLoad: false, lastView: 'overall' });
    render(<App />);
    expect(screen.queryByRole('tablist', { name: /sites/i })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /activity heatmap/i })).toBeInTheDocument();
    expect(screen.getByText('Avg per calendar day')).toBeInTheDocument();
  });

  it('renders winners view when lastView is winners', () => {
    mockHooks({ aggregate: sampleAggregate(), isInitialLoad: false, lastView: 'winners' });
    render(<App />);
    expect(screen.getByRole('list', { name: /daily winners legend/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /activity heatmap/i })).toBeInTheDocument();
  });

  it('corrects lastSelectedSite via updatePrefs when it is not in topSites (UX-PS-02)', async () => {
    const agg = sampleAggregate();
    const updatePrefs = mockHooks({
      aggregate: agg,
      isInitialLoad: false,
      lastSelectedSite: 'not-in-top-list.example',
    });

    render(<App />);

    await waitFor(() => {
      expect(updatePrefs).toHaveBeenCalledWith({
        lastSelectedSite: agg.topSites[0]!.apexDomain,
      });
    });
    expect(
      screen.getByRole('tab', { name: new RegExp(agg.topSites[0]!.apexDomain) }),
    ).toHaveAttribute('aria-selected', 'true');
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
