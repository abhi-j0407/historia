import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { aggregate } from '@/core/aggregate';
import { apexOf } from '@/core/domain';
import { shouldDropURL } from '@/core/filters';
import type { BackfillProgress } from '@/core/types';

import { SYNTHETIC_RAW } from '../../tests/fixtures/synthetic-history';
import { AGGREGATE_KEY, readAggregate } from './cache';
import { getLastProgress, requestBackfill } from './ingest';

const PINNED_AT = 1_700_000_000_000;

type HistoryItem = chrome.history.HistoryItem;
type VisitItem = chrome.history.VisitItem;

interface SeededUrl {
  url: string;
  title: string;
  visits: VisitItem[];
}

function seedFromRaw(
  rows: readonly { url: string; title: string; visitedAt: number }[],
): SeededUrl[] {
  const byUrl = new Map<string, SeededUrl>();
  for (const row of rows) {
    if (shouldDropURL(row.url) || apexOf(row.url) === null) {
      continue;
    }
    let entry = byUrl.get(row.url);
    if (!entry) {
      entry = { url: row.url, title: row.title, visits: [] };
      byUrl.set(row.url, entry);
    }
    if (row.title.length > 0) {
      entry.title = row.title;
    }
    entry.visits.push({
      id: String(entry.visits.length),
      visitId: String(entry.visits.length),
      visitTime: row.visitedAt,
      referringVisitId: '0',
      transition: 'link',
      isLocal: false,
    });
  }
  return [...byUrl.values()];
}

function toHistoryItems(urls: SeededUrl[]): HistoryItem[] {
  return urls.map((entry, index) => {
    const lastVisitTime = entry.visits.reduce((max, v) => Math.max(max, v.visitTime ?? 0), 0);
    return {
      id: String(index),
      url: entry.url,
      title: entry.title,
      lastVisitTime,
      visitCount: entry.visits.length,
      typedCount: 0,
    };
  });
}

function installHistoryMocks(urls: SeededUrl[]): void {
  const items = toHistoryItems(urls);
  const visitsByUrl = new Map(urls.map((u) => [u.url, u.visits]));

  vi.spyOn(fakeBrowser.history, 'search').mockImplementation((query) => {
    if (query.maxResults === 0) {
      return Promise.resolve(items);
    }
    const endTime = typeof query.endTime === 'number' ? query.endTime : Date.now();
    const page = items.filter((item) => (item.lastVisitTime ?? 0) <= endTime);
    return Promise.resolve(page.slice(0, query.maxResults ?? items.length));
  });

  vi.spyOn(fakeBrowser.history, 'getVisits').mockImplementation(({ url }) =>
    Promise.resolve(visitsByUrl.get(url) ?? []),
  );
}

function generateManyUrls(count: number): SeededUrl[] {
  const urls: SeededUrl[] = [];
  for (let i = 0; i < count; i += 1) {
    const url = `https://example-${i}.com/page`;
    urls.push({
      url,
      title: `Site ${i}`,
      visits: [
        {
          id: '0',
          visitId: '0',
          visitTime: PINNED_AT - i,
          referringVisitId: '0',
          transition: 'link',
          isLocal: false,
        },
      ],
    });
  }
  return urls;
}

describe('requestBackfill', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(PINNED_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('produces the deterministic synthetic aggregate in storage', async () => {
    const seeded = seedFromRaw(SYNTHETIC_RAW);
    installHistoryMocks(seeded);
    const expected = aggregate(
      seeded.flatMap((entry) =>
        entry.visits.map((visit) => ({
          url: entry.url,
          apexDomain: apexOf(entry.url)!,
          title: entry.title,
          visitedAt: visit.visitTime ?? 0,
        })),
      ),
      PINNED_AT,
    );

    await requestBackfill();

    const stored = await readAggregate();
    expect(stored).toEqual(expected);
    expect(getLastProgress().phase).toBe('done');
  });

  it('keeps getVisits peak concurrency at or below 32', async () => {
    const seeded = generateManyUrls(80);
    installHistoryMocks(seeded);

    let inFlight = 0;
    let peak = 0;
    const visitsByUrl = new Map(seeded.map((u) => [u.url, u.visits]));
    vi.spyOn(fakeBrowser.history, 'getVisits').mockImplementation(({ url }) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      return new Promise<VisitItem[]>((resolve) => {
        setTimeout(() => {
          inFlight -= 1;
          resolve(visitsByUrl.get(url) ?? []);
        }, 2);
      });
    });

    const run = requestBackfill();
    await vi.runAllTimersAsync();
    await run;
    expect(peak).toBeLessThanOrEqual(32);
    expect(peak).toBeGreaterThan(1);
  });

  it('throttles storage writes between 5 and 100 with a complete final aggregate', async () => {
    const seeded = generateManyUrls(1000);
    installHistoryMocks(seeded);
    const setSpy = vi.spyOn(fakeBrowser.storage.local, 'set');

    await requestBackfill();

    expect(setSpy.mock.calls.length).toBeGreaterThanOrEqual(5);
    expect(setSpy.mock.calls.length).toBeLessThanOrEqual(100);

    const finalCall = setSpy.mock.calls[setSpy.mock.calls.length - 1]![0] as Record<
      string,
      unknown
    >;
    const finalAgg = finalCall[AGGREGATE_KEY];
    const expected = aggregate(
      seeded.map((entry) => ({
        url: entry.url,
        apexDomain: apexOf(entry.url)!,
        title: entry.title,
        visitedAt: entry.visits[0]!.visitTime ?? 0,
      })),
      PINNED_AT,
    );
    expect(finalAgg).toEqual(expected);
  });

  it('aborts a running backfill on force refresh and completes the second run', async () => {
    const seeded = seedFromRaw(SYNTHETIC_RAW);
    installHistoryMocks(seeded);

    let releaseFirst: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const visitsByUrl = new Map(seeded.map((u) => [u.url, u.visits]));
    let firstRun = true;
    vi.spyOn(fakeBrowser.history, 'getVisits').mockImplementation(({ url }) => {
      if (firstRun) {
        return gate.then(() => visitsByUrl.get(url) ?? []);
      }
      return Promise.resolve(visitsByUrl.get(url) ?? []);
    });

    const first = requestBackfill();
    await vi.advanceTimersByTimeAsync(0);

    const forced = requestBackfill({ force: true });
    releaseFirst!();
    firstRun = false;

    await expect(first).rejects.toSatisfy(
      (error: unknown) => error instanceof DOMException && error.name === 'AbortError',
    );
    await forced;

    const stored = await readAggregate();
    expect(stored).not.toBeNull();
    expect(getLastProgress().phase).toBe('done');
  });

  it('broadcasts backfill-progress with bounded cadence', async () => {
    const seeded = generateManyUrls(200);
    installHistoryMocks(seeded);
    const sendSpy = vi.spyOn(fakeBrowser.runtime, 'sendMessage').mockResolvedValue(undefined);

    await requestBackfill();

    const progressCalls = sendSpy.mock.calls.filter(
      (call) =>
        call[0] != null &&
        typeof call[0] === 'object' &&
        'type' in call[0] &&
        (call[0] as { type: string }).type === 'backfill-progress',
    );

    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls.length).toBeLessThanOrEqual(25);

    for (const call of progressCalls) {
      const payload = (call[0] as { payload: BackfillProgress }).payload;
      expect(typeof payload.phase).toBe('string');
      expect(typeof payload.processed).toBe('number');
      expect(typeof payload.total).toBe('number');
      expect(typeof payload.startedAt).toBe('number');
    }
  });

  it('completes cleanly with empty history', async () => {
    installHistoryMocks([]);

    await requestBackfill();

    const stored = await readAggregate();
    expect(stored).toMatchObject({
      version: 1,
      topSites: [],
      totalVisitsPerDay: {},
    });
    expect(getLastProgress().phase).toBe('done');
  });
});
