import { useCallback, useEffect, useState } from 'react';

import type { UIPrefs } from '@/background/cache';
import { DEFAULT_UI_PREFS } from '@/background/cache';
import { log } from '@/core/log';
import { readUIPrefs, writeUIPrefs } from '@/dashboard/lib/storage-bridge';

/** ST-002 — Persisted dashboard view and date-range preferences. */
export function useUIPrefs(): {
  prefs: UIPrefs;
  updatePrefs: (patch: Partial<UIPrefs>) => void;
} {
  const [prefs, setPrefs] = useState<UIPrefs>(DEFAULT_UI_PREFS);

  useEffect(() => {
    void readUIPrefs().then(setPrefs);
  }, []);

  const updatePrefs = useCallback((patch: Partial<UIPrefs>) => {
    setPrefs((current) => {
      const merged = { ...current, ...patch };
      void writeUIPrefs(merged).catch((error: unknown) => {
        log('ui prefs write failed', error);
      });
      return merged;
    });
  }, []);

  return { prefs, updatePrefs };
}
