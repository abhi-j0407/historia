import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import type { BackfillProgress } from '@/core/types';

import { useBackfillProgress } from './useBackfillProgress';

const FETCHING: BackfillProgress = {
  phase: 'fetching-visits',
  processed: 12,
  total: 40,
  startedAt: 1_700_000_000_000,
};

describe('useBackfillProgress', () => {
  it('seeds state from get-backfill-progress response', async () => {
    vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(FETCHING);

    const { result } = renderHook(() => useBackfillProgress());

    await waitFor(() => {
      expect(result.current).toEqual(FETCHING);
    });
  });

  it('updates state when a backfill-progress runtime message arrives', async () => {
    vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockRejectedValue(new Error('worker asleep'));

    const listeners = new Set<(message: unknown) => void>();
    vi.spyOn(fakeBrowser.runtime.onMessage, 'addListener').mockImplementation((listener) => {
      listeners.add(listener as (message: unknown) => void);
    });
    vi.spyOn(fakeBrowser.runtime.onMessage, 'removeListener').mockImplementation((listener) => {
      listeners.delete(listener as (message: unknown) => void);
    });

    const { result } = renderHook(() => useBackfillProgress());

    act(() => {
      for (const listener of listeners) {
        listener({ type: 'backfill-progress', payload: FETCHING });
      }
    });

    await waitFor(() => {
      expect(result.current).toEqual(FETCHING);
    });
  });
});
