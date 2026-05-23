import { describe, expect, it } from 'vitest';

import { aggregate } from '@/core/aggregate';
import { toDayKey } from '@/core/dates';
import type { Aggregate, Visit } from '@/core/types';
import { AGGREGATE_VERSION } from '@/core/types';

import { mergeIncremental } from './incremental';

const PINNED_NOW = 1_700_000_000_000;

function visit(apexDomain: string, day: string, hour: number, urlSuffix = ''): Visit {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return {
    url: `https://${apexDomain}${urlSuffix}/page`,
    apexDomain,
    title: '',
    visitedAt: new Date(y, m - 1, d, hour, 0, 0, 0).getTime(),
  };
}

function emptyAggregate(): Aggregate {
  return {
    version: AGGREGATE_VERSION,
    computedAt: 0,
    lastAggregatedAt: 0,
    dateRange: { earliest: '', latest: '' },
    totalVisitsPerDay: {},
    visitsPerSitePerDay: {},
    dailyWinner: {},
    topSites: [],
  };
}

describe('mergeIncremental', () => {
  it('increments per-site and totalVisitsPerDay for five new google.com visits today', () => {
    const day = toDayKey(PINNED_NOW);
    const existing = aggregate(
      [visit('google.com', day, 9), visit('google.com', day, 10)],
      PINNED_NOW - 1000,
    );
    const newVisits = Array.from({ length: 5 }, (_, i) => visit('google.com', day, 11 + i));

    const merged = mergeIncremental(existing, newVisits, PINNED_NOW);

    expect(merged.totalVisitsPerDay[day]).toBe(7);
    expect(merged.visitsPerSitePerDay['google.com']?.[day]).toBe(7);
  });

  it('inserts a brand-new apex into topSites in B-007 order', () => {
    const day = '2026-06-01';
    const existing = aggregate(
      [
        visit('z.com', day, 10),
        visit('z.com', day, 11),
        visit('z.com', day, 12),
        visit('z.com', day, 13),
      ],
      PINNED_NOW - 1000,
    );
    const merged = mergeIncremental(
      existing,
      [visit('a.com', day, 14), visit('a.com', day, 15)],
      PINNED_NOW,
    );

    expect(merged.topSites.map((s) => s.apexDomain)).toEqual(['z.com', 'a.com']);
  });

  it('advances lastAggregatedAt to the max of existing and new visits', () => {
    const day = '2026-06-02';
    const older = visit('site.com', day, 8).visitedAt;
    const newer = visit('site.com', day, 16).visitedAt;
    const existing = aggregate([visit('site.com', day, 8)], older - 1000);

    const merged = mergeIncremental(existing, [visit('site.com', day, 16)], PINNED_NOW);

    expect(merged.lastAggregatedAt).toBe(newer);
    expect(merged.lastAggregatedAt).toBeGreaterThan(older);
  });

  it('updates dailyWinner when new visits flip the winner of a day', () => {
    const day = '2026-06-03';
    const existing = aggregate(
      [
        visit('heavy.com', '2026-06-02', 10),
        visit('heavy.com', '2026-06-02', 11),
        visit('light.com', day, 12),
        visit('light.com', day, 13),
      ],
      PINNED_NOW - 1000,
    );
    expect(existing.dailyWinner[day]?.apexDomain).toBe('light.com');

    const merged = mergeIncremental(
      existing,
      [visit('heavy.com', day, 14), visit('heavy.com', day, 15), visit('heavy.com', day, 16)],
      PINNED_NOW,
    );

    expect(merged.dailyWinner[day]?.apexDomain).toBe('heavy.com');
    expect(merged.dailyWinner[day]?.visits).toBe(3);
  });

  it('matches aggregate(newVisits, now) when existing is empty', () => {
    const newVisits = [
      visit('google.com', '2026-06-04', 10),
      visit('google.com', '2026-06-04', 11),
      visit('news.ycombinator.com', '2026-06-05', 9),
    ];
    const expected = aggregate(newVisits, PINNED_NOW);
    const merged = mergeIncremental(emptyAggregate(), newVisits, PINNED_NOW);

    expect(merged).toEqual(expected);
  });

  it('rolls mail.google.com visits into the google.com apex slot', () => {
    const day = '2026-06-06';
    const existing = aggregate([visit('google.com', day, 9)], PINNED_NOW - 1000);
    const mailVisit: Visit = {
      url: 'https://mail.google.com/mail/u/0/',
      apexDomain: 'google.com',
      title: 'Gmail',
      visitedAt: visit('google.com', day, 12).visitedAt,
    };

    const merged = mergeIncremental(existing, [mailVisit], PINNED_NOW);

    expect(merged.visitsPerSitePerDay['google.com']?.[day]).toBe(2);
    expect(merged.visitsPerSitePerDay['mail.google.com']).toBeUndefined();
  });
});
