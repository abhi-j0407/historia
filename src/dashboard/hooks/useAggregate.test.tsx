import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { AGGREGATE_KEY } from '@/background/cache';
import { aggregate } from '@/core/aggregate';

import { syntheticVisits } from '../../../tests/fixtures/synthetic-history';
import { useAggregate } from './useAggregate';

const PINNED_AT = 1_700_000_000_000;

function sampleAggregate() {
  return aggregate(syntheticVisits(), PINNED_AT);
}

describe('useAggregate', () => {
  it('resolves isInitialLoad after the first readAggregate()', async () => {
    const { result } = renderHook(() => useAggregate());

    expect(result.current.isInitialLoad).toBe(true);

    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });
    expect(result.current.aggregate).toBeNull();
  });

  it('re-renders when fakeBrowser.storage.local receives a new aggregate', async () => {
    const agg = sampleAggregate();
    const { result, unmount } = renderHook(() => useAggregate());

    await waitFor(() => {
      expect(result.current.isInitialLoad).toBe(false);
    });

    await fakeBrowser.storage.local.set({ [AGGREGATE_KEY]: agg });

    await waitFor(() => {
      expect(result.current.aggregate).toEqual(agg);
    });

    unmount();

    const next = { ...agg, computedAt: agg.computedAt + 1 };
    await fakeBrowser.storage.local.set({ [AGGREGATE_KEY]: next });

    const { result: afterUnmount } = renderHook(() => useAggregate());
    await waitFor(() => {
      expect(afterUnmount.current.aggregate?.computedAt).toBe(next.computedAt);
    });
  });
});
