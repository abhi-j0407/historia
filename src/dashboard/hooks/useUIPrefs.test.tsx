import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { UI_PREFS_KEY } from '@/background/cache';

import { useUIPrefs } from './useUIPrefs';

describe('useUIPrefs', () => {
  it('updatePrefs merges and persists lastView to storage', async () => {
    const { result } = renderHook(() => useUIPrefs());

    await waitFor(() => {
      expect(result.current.prefs.lastView).toBe('per-site');
    });

    act(() => {
      result.current.updatePrefs({ lastView: 'winners' });
    });

    expect(result.current.prefs.lastView).toBe('winners');

    const stored = await fakeBrowser.storage.local.get(UI_PREFS_KEY);
    expect(stored[UI_PREFS_KEY]).toMatchObject({ lastView: 'winners', version: 1 });
  });
});
