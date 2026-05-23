/**
 * chrome.storage.local facade for aggregate and UI prefs (ST-001..ST-005, SW-003a).
 */

import { type Aggregate, AGGREGATE_VERSION } from '@/core/types';

/** ST-001 — Cache key for the D-005 aggregate payload. */
export const AGGREGATE_KEY = 'aggregate.v1' as const;

/** ST-002 — Cache key for dashboard UI preferences. */
export const UI_PREFS_KEY = 'ui.v1' as const;

/** ST-002 — Persisted dashboard view and range preferences. */
export interface UIPrefs {
  version: 1;
  lastView: 'per-site' | 'overall' | 'winners';
  lastSelectedSite: string | null;
  lastDateRange: '7d' | '30d' | '90d' | 'all';
}

/** ST-002 — Defaults when ui.v1 is absent or schema version mismatches. */
export const DEFAULT_UI_PREFS: UIPrefs = {
  version: 1,
  lastView: 'per-site',
  lastSelectedSite: null,
  lastDateRange: 'all',
};

const AGGREGATE_KEY_PATTERN = /^aggregate\.v\d+$/;

function isStaleAggregateValue(value: unknown): boolean {
  if (value == null || typeof value !== 'object' || !('version' in value)) {
    return true;
  }
  return (value as { version: number }).version !== AGGREGATE_VERSION;
}

/** ST-001, ST-003 — Read aggregate; migrate away stale schema versions. */
export async function readAggregate(): Promise<Aggregate | null> {
  const stored = await chrome.storage.local.get(AGGREGATE_KEY);
  const value = stored[AGGREGATE_KEY];
  if (value === undefined) {
    return null;
  }
  if (isStaleAggregateValue(value)) {
    await clearStaleAggregate();
    return null;
  }
  return value as Aggregate;
}

/** ST-004 — Atomic single-key write of a version-validated aggregate. */
export async function writeAggregate(agg: Aggregate): Promise<void> {
  const version = (agg as { version: number }).version;
  if (version !== AGGREGATE_VERSION) {
    throw new Error(`aggregate version must be ${AGGREGATE_VERSION}, got ${version}`);
  }
  await chrome.storage.local.set({ [AGGREGATE_KEY]: agg });
}

/** ST-003 — Remove current and legacy aggregate keys with wrong schema version. */
export async function clearStaleAggregate(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const keysToRemove = new Set<string>([AGGREGATE_KEY]);

  for (const key of Object.keys(all)) {
    if (!AGGREGATE_KEY_PATTERN.test(key)) {
      continue;
    }
    if (isStaleAggregateValue(all[key])) {
      keysToRemove.add(key);
    }
  }

  if (keysToRemove.size > 0) {
    await chrome.storage.local.remove([...keysToRemove]);
  }
}

/** ST-002 — Read UI prefs or defaults when missing or version mismatches. */
export async function readUIPrefs(): Promise<UIPrefs> {
  const stored = await chrome.storage.local.get(UI_PREFS_KEY);
  const value = stored[UI_PREFS_KEY] as UIPrefs | undefined;
  if (value?.version !== 1) {
    return DEFAULT_UI_PREFS;
  }
  return value;
}

/** ST-002 — Persist UI prefs under ui.v1. */
export async function writeUIPrefs(prefs: UIPrefs): Promise<void> {
  await chrome.storage.local.set({ [UI_PREFS_KEY]: prefs });
}

/** SW-003a — Subscribe to aggregate.v1 changes in the local storage area. */
export function subscribeAggregate(listener: (agg: Aggregate | null) => void): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ): void => {
    if (areaName !== 'local' || !(AGGREGATE_KEY in changes)) {
      return;
    }
    const change = changes[AGGREGATE_KEY];
    listener((change?.newValue as Aggregate | undefined) ?? null);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => {
    chrome.storage.onChanged.removeListener(handler);
  };
}

/** ST-005 — Bytes in use for diagnostics; 0 when API unavailable (tests). */
export async function getStorageBytesInUse(): Promise<number> {
  if (typeof chrome.storage.local.getBytesInUse !== 'function') {
    return 0;
  }
  return chrome.storage.local.getBytesInUse();
}
