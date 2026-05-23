import { describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { aggregate } from '@/core/aggregate';

import { syntheticVisits } from '../../tests/fixtures/synthetic-history';
import {
  AGGREGATE_KEY,
  clearStaleAggregate,
  DEFAULT_UI_PREFS,
  readAggregate,
  readUIPrefs,
  subscribeAggregate,
  writeAggregate,
} from './cache';

const PINNED_AT = 1_700_000_000_000;

function sampleAggregate() {
  return aggregate(syntheticVisits(), PINNED_AT);
}

describe('cache', () => {
  it('readAggregate() returns null when storage is empty', async () => {
    await expect(readAggregate()).resolves.toBeNull();
  });

  it('writeAggregate() → readAggregate() roundtrip preserves the aggregate', async () => {
    const agg = sampleAggregate();
    await writeAggregate(agg);
    await expect(readAggregate()).resolves.toEqual(agg);
  });

  it('writeAggregate(invalid) throws when version !== 1', async () => {
    const agg = sampleAggregate();
    const bad = { ...agg, version: 2 as 1 };
    await expect(writeAggregate(bad)).rejects.toThrow(/version must be 1/);
  });

  it('readAggregate() returns null and clears the key when version 2 is stored under aggregate.v1', async () => {
    const agg = sampleAggregate();
    await fakeBrowser.storage.local.set({
      [AGGREGATE_KEY]: { ...agg, version: 2 },
    });
    await expect(readAggregate()).resolves.toBeNull();
    const stored = await fakeBrowser.storage.local.get(AGGREGATE_KEY);
    expect(stored[AGGREGATE_KEY]).toBeUndefined();
  });

  it('clearStaleAggregate() also removes a legacy aggregate.v0 key (the sweep)', async () => {
    const agg = sampleAggregate();
    await fakeBrowser.storage.local.set({
      'aggregate.v0': { ...agg, version: 0 },
      [AGGREGATE_KEY]: agg,
    });
    await clearStaleAggregate();
    const stored = await fakeBrowser.storage.local.get(['aggregate.v0', AGGREGATE_KEY]);
    expect(stored['aggregate.v0']).toBeUndefined();
    expect(stored[AGGREGATE_KEY]).toBeUndefined();
  });

  it('readUIPrefs() returns DEFAULT_UI_PREFS on empty storage', async () => {
    await expect(readUIPrefs()).resolves.toEqual(DEFAULT_UI_PREFS);
  });

  it('subscribeAggregate(listener) fires on writeAggregate; unsubscribe stops dispatch', async () => {
    const listener = vi.fn();
    const agg = sampleAggregate();
    const unsubscribe = subscribeAggregate(listener);

    await writeAggregate(agg);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(agg);

    unsubscribe();
    await writeAggregate({ ...agg, computedAt: agg.computedAt + 1 });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
