/**
 * Dashboard-side chrome.storage.local + runtime messaging (SW-003a).
 * Mirrors read/subscribe behavior from the worker cache without pulling orchestration code.
 */

import { AGGREGATE_KEY, DEFAULT_UI_PREFS, UI_PREFS_KEY, type UIPrefs } from '@/background/cache';
import { type Aggregate, AGGREGATE_VERSION } from '@/core/types';

const AGGREGATE_KEY_PATTERN = /^aggregate\.v\d+$/;

function isStaleAggregateValue(value: unknown): boolean {
  if (value == null || typeof value !== 'object' || !('version' in value)) {
    return true;
  }
  return (value as { version: number }).version !== AGGREGATE_VERSION;
}

async function clearStaleAggregate(): Promise<void> {
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

/** ST-001, ST-003 — Read aggregate; clear stale schema versions. */
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

/** SW-005 — Request a forced backfill from the service worker. */
export async function sendForceRefresh(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'force-refresh' });
}
