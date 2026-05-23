import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { aggregate } from '@/core/aggregate';
import { apexOf } from '@/core/domain';
import { shouldDropURL } from '@/core/filters';
import type { Aggregate } from '@/core/types';

import { AGGREGATE_KEY, writeAggregate } from './cache';
import { handleRecomputeAlarm, scheduleRecompute } from './debounce';
import { INCREMENTAL_FALLBACK } from './incremental';
import * as ingestModule from './ingest';

const PINNED_AT = 1_700_000_000_000;

type HistoryItem = chrome.history.HistoryItem;
type VisitItem = chrome.history.VisitItem;

interface SeededUrl {
  url: string;
  title: string;
  visits: VisitItem[];
}

function seedUrl(url: string, title: string, visitedAt: number): SeededUrl {
  return {
    url,
    title,
    visits: [
      {
        id: '0',
        visitId: '0',
        visitTime: visitedAt,
        referringVisitId: '0',
        transition: 'link',
        isLocal: false,
      },
    ],
  };
}

function toHistoryItems(urls: SeededUrl[]): HistoryItem[] {
  return urls.map((entry, index) => ({
    id: String(index),
    url: entry.url,
    title: entry.title,
    lastVisitTime: entry.visits.reduce((max, v) => Math.max(max, v.visitTime ?? 0), 0),
    visitCount: entry.visits.length,
    typedCount: 0,
  }));
}

function installIncrementalHistoryMocks(urls: SeededUrl[]): void {
  const items = toHistoryItems(urls);
  const visitsByUrl = new Map(urls.map((u) => [u.url, u.visits]));

  vi.spyOn(fakeBrowser.history, 'search').mockImplementation((query) => {
    const startTime = typeof query.startTime === 'number' ? query.startTime : 0;
    const endTime = typeof query.endTime === 'number' ? query.endTime : Date.now();
    const filtered = items.filter((item) => {
      const last = item.lastVisitTime ?? 0;
      return last > startTime && last <= endTime;
    });
    if (query.maxResults === 0) {
      return Promise.resolve(filtered);
    }
    return Promise.resolve(filtered.slice(0, query.maxResults ?? filtered.length));
  });

  vi.spyOn(fakeBrowser.history, 'getVisits').mockImplementation(({ url }) =>
    Promise.resolve(visitsByUrl.get(url) ?? []),
  );
}

function baseAggregate(lastAggregatedAt: number): Aggregate {
  return aggregate(
    [
      {
        url: 'https://existing.com/',
        apexDomain: 'existing.com',
        title: 'Existing',
        visitedAt: lastAggregatedAt - 60_000,
      },
    ],
    lastAggregatedAt - 60_000,
  );
}

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(PINNED_AT);
    fakeBrowser.alarms.resetState();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('scheduleRecompute creates the recompute alarm at 0.5 minutes', async () => {
    const createSpy = vi.spyOn(fakeBrowser.alarms, 'create');

    scheduleRecompute();

    expect(createSpy).toHaveBeenCalledWith('recompute', { delayInMinutes: 0.5 });
    const alarms = await fakeBrowser.alarms.getAll();
    expect(alarms.some((alarm) => alarm.name === 'recompute')).toBe(true);
  });

  it('debounces two quick scheduleRecompute calls into one effective alarm', async () => {
    scheduleRecompute();
    scheduleRecompute();

    const alarms = await fakeBrowser.alarms.getAll();
    expect(alarms.filter((alarm) => alarm.name === 'recompute')).toHaveLength(1);
  });

  it('handleRecomputeAlarm with no aggregate calls requestBackfill', async () => {
    const backfillSpy = vi.spyOn(ingestModule, 'requestBackfill').mockResolvedValue(undefined);

    await handleRecomputeAlarm();

    expect(backfillSpy).toHaveBeenCalledTimes(1);
    expect(backfillSpy).toHaveBeenCalledWith();
  });

  it('handleRecomputeAlarm with existing aggregate and three new items writes once', async () => {
    const since = PINNED_AT - 3_600_000;
    const existing = baseAggregate(since);
    await writeAggregate(existing);

    const newUrls = [
      seedUrl('https://one.example/', 'One', since + 1000),
      seedUrl('https://two.example/', 'Two', since + 2000),
      seedUrl('https://three.example/', 'Three', since + 3000),
    ].filter((entry) => !shouldDropURL(entry.url) && apexOf(entry.url) !== null);

    installIncrementalHistoryMocks(newUrls);
    const setSpy = vi.spyOn(fakeBrowser.storage.local, 'set');
    const backfillSpy = vi.spyOn(ingestModule, 'requestBackfill').mockResolvedValue(undefined);

    await handleRecomputeAlarm();

    expect(backfillSpy).not.toHaveBeenCalled();
    expect(setSpy).toHaveBeenCalledTimes(1);
    const payload = setSpy.mock.calls[0]![0] as Record<string, Aggregate>;
    expect(payload[AGGREGATE_KEY]?.computedAt).toBe(PINNED_AT);
    expect(payload[AGGREGATE_KEY]?.lastAggregatedAt).toBe(since + 3000);
  });

  it('handleRecomputeAlarm falls back to requestBackfill when new visits exceed threshold', async () => {
    const since = PINNED_AT - 3_600_000;
    const existing = baseAggregate(since);
    await writeAggregate(existing);

    const newUrls: SeededUrl[] = [];
    for (let i = 0; i < INCREMENTAL_FALLBACK + 1; i += 1) {
      const url = `https://bulk-${i}.example/page`;
      newUrls.push(seedUrl(url, `Bulk ${i}`, existing.lastAggregatedAt + 1000 + i));
    }

    installIncrementalHistoryMocks(newUrls);
    const setSpy = vi.spyOn(fakeBrowser.storage.local, 'set');
    const backfillSpy = vi.spyOn(ingestModule, 'requestBackfill').mockResolvedValue(undefined);

    await handleRecomputeAlarm();

    expect(backfillSpy).toHaveBeenCalledTimes(1);
    expect(setSpy).not.toHaveBeenCalled();
  });
});
