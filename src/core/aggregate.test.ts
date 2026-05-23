import { describe, expect, it } from 'vitest';

import { SYNTHETIC_RAW, syntheticVisits } from '../../tests/fixtures/synthetic-history';
import { aggregate } from './aggregate';
import { toDayKey } from './dates';
import type { Visit } from './types';

const PINNED_AT = 1_700_000_000_000;

function visit(apexDomain: string, day: string, hour: number, overallOffset = 0): Visit {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return {
    url: `https://${apexDomain}/p${overallOffset}`,
    apexDomain,
    title: '',
    visitedAt: new Date(y, m - 1, d, hour, 0, 0, 0).getTime(),
  };
}

describe('aggregate', () => {
  it('aggregates the synthetic fixture with filtering and B-007 ordering', () => {
    const visits = syntheticVisits();
    const result = aggregate(visits, PINNED_AT);

    const filteredStillPresent = SYNTHETIC_RAW.filter(
      (r) =>
        r.url === 'chrome://newtab/' ||
        r.url === 'https://www.google.com/search?q=help' ||
        r.url === 'http://localhost:3000/',
    );
    expect(filteredStillPresent.length).toBe(100);
    expect(visits.some((v) => v.url.startsWith('chrome://') || v.url.includes('/search?'))).toBe(
      false,
    );

    const googleTotal = result.topSites.find((s) => s.apexDomain === 'google.com')?.totalVisits;
    expect(googleTotal).toBe(30);
    expect(result.visitsPerSitePerDay['google.com']).toBeDefined();
    expect((result.visitsPerSitePerDay['google.com']?.['2026-05-10'] ?? 0) > 0).toBe(true);

    for (let i = 1; i < result.topSites.length; i += 1) {
      const prev = result.topSites[i - 1]!;
      const curr = result.topSites[i]!;
      const ordered =
        prev.totalVisits > curr.totalVisits ||
        (prev.totalVisits === curr.totalVisits &&
          (prev.activeDays > curr.activeDays ||
            (prev.activeDays === curr.activeDays &&
              prev.apexDomain.localeCompare(curr.apexDomain) <= 0)));
      expect(ordered).toBe(true);
    }

    expect(result.dateRange.latest).toBe('2026-05-22');
    expect(result.version).toBe(1);
  });

  it('breaks daily winner ties by higher overall totalVisits (B-005)', () => {
    const visits = [
      visit('heavy.com', '2026-06-01', 10),
      visit('heavy.com', '2026-06-01', 11),
      visit('heavy.com', '2026-06-02', 12),
      visit('light.com', '2026-06-01', 13),
      visit('light.com', '2026-06-01', 14),
    ];
    const result = aggregate(visits, PINNED_AT);
    expect(result.dailyWinner['2026-06-01']?.apexDomain).toBe('heavy.com');
    expect(result.dailyWinner['2026-06-01']?.visits).toBe(2);
  });

  it('sorts topSites by activeDays then lexicographic apex (B-007)', () => {
    const visits = [
      visit('z.com', '2026-06-01', 10),
      visit('a.com', '2026-06-01', 11),
      visit('a.com', '2026-06-02', 12),
    ];
    const result = aggregate(visits, PINNED_AT);
    expect(result.topSites.map((s) => s.apexDomain)).toEqual(['a.com', 'z.com']);

    const tied = [visit('b.com', '2026-06-01', 10), visit('a.com', '2026-06-01', 11)];
    expect(aggregate(tied, PINNED_AT).topSites.map((s) => s.apexDomain)).toEqual([
      'a.com',
      'b.com',
    ]);
  });

  it('breaks daily winner ties by lexicographic apex when day and overall totals tie (B-005)', () => {
    const visits = [
      visit('a.com', '2026-06-01', 10),
      visit('a.com', '2026-06-01', 11),
      visit('b.com', '2026-06-01', 12),
      visit('b.com', '2026-06-01', 13),
    ];
    const result = aggregate(visits, PINNED_AT);
    expect(result.dailyWinner['2026-06-01']?.apexDomain).toBe('a.com');
  });

  it('is pure for identical inputs and pinned computedAt (B-008)', () => {
    const visits = syntheticVisits().slice(0, 20);
    const first = aggregate(visits, 1000);
    const second = aggregate(visits, 1000);
    expect(second).toEqual(first);
  });

  it('returns a well-formed empty aggregate without throwing', () => {
    const result = aggregate([], PINNED_AT);
    expect(result.topSites).toEqual([]);
    expect(result.totalVisitsPerDay).toEqual({});
    expect(result.visitsPerSitePerDay).toEqual({});
    expect(result.dailyWinner).toEqual({});
    const day = toDayKey(PINNED_AT);
    expect(result.dateRange.earliest).toBe(day);
    expect(result.dateRange.latest).toBe(day);
  });
});
