import { describe, expect, it } from 'vitest';

import { aggregate } from '@/core/aggregate';
import { eachDayInRange } from '@/core/dates';
import type { Aggregate, DayKey, Visit } from '@/core/types';
import {
  overallStatsForRange,
  siteStatsForRange,
  sliceDailyMap,
  winnerCountsForRange,
} from '@/dashboard/lib/range-filter';

import { syntheticVisits } from '../../../tests/fixtures/synthetic-history';

const PINNED_AT = 1_700_000_000_000;

function fixtureAggregate(): Aggregate {
  return aggregate(syntheticVisits(), PINNED_AT);
}

function visit(apexDomain: string, day: string, hour: number): Visit {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return {
    url: `https://${apexDomain}/p`,
    apexDomain,
    title: '',
    visitedAt: new Date(y, m - 1, d, hour, 0, 0, 0).getTime(),
  };
}

describe('sliceDailyMap', () => {
  it('keeps only keys within inclusive start and end bounds', () => {
    const map: Record<DayKey, number> = {
      '2026-05-01': 1,
      '2026-05-05': 2,
      '2026-05-10': 3,
      '2026-05-20': 4,
    };
    expect(sliceDailyMap(map, '2026-05-05', '2026-05-10')).toEqual({
      '2026-05-05': 2,
      '2026-05-10': 3,
    });
  });
});

describe('siteStatsForRange', () => {
  it('matches hand-computed google.com stats over the full fixture range', () => {
    const agg = fixtureAggregate();
    const { earliest, latest } = agg.dateRange;
    const stats = siteStatsForRange(agg, 'google.com', earliest, latest);

    expect(stats.totalVisits).toBe(30);
    expect(stats.activeDays).toBe(6);
    expect(stats.busiestDay).toEqual({ day: '2026-04-30', visits: 5 });
    expect(stats.longestStreak).toBe(2);
  });

  it('reports longestStreak of 3 for three consecutive active days', () => {
    const visits = [
      visit('streak.com', '2026-06-01', 10),
      visit('streak.com', '2026-06-02', 11),
      visit('streak.com', '2026-06-03', 12),
      visit('streak.com', '2026-06-10', 13),
    ];
    const agg = aggregate(visits, PINNED_AT);
    const stats = siteStatsForRange(agg, 'streak.com', '2026-06-01', '2026-06-10');
    expect(stats.longestStreak).toBe(3);
  });
});

describe('overallStatsForRange', () => {
  it('rounds avgPerCalendarDay as totalVisits divided by calendar days in range', () => {
    const agg = fixtureAggregate();
    const start = '2026-05-01';
    const end = '2026-05-07';
    const sliced = sliceDailyMap(agg.totalVisitsPerDay, start, end);
    const total = Object.values(sliced).reduce((a, b) => a + b, 0);
    const calendarDays = eachDayInRange(start, end).length;

    const stats = overallStatsForRange(agg, start, end);
    expect(stats.avgPerCalendarDay).toBe(Math.round(total / calendarDays));
  });
});

describe('winnerCountsForRange', () => {
  it('matches per-day dailyWinner apexDomain counts in range', () => {
    const agg = fixtureAggregate();
    const start = agg.dateRange.earliest;
    const end = agg.dateRange.latest;

    const expected: Record<string, number> = {};
    for (const [day, winner] of Object.entries(agg.dailyWinner)) {
      if (day < start || day > end) {
        continue;
      }
      const apex = winner.apexDomain;
      expected[apex] = (expected[apex] ?? 0) + 1;
    }

    expect(winnerCountsForRange(agg, start, end)).toEqual(expected);
  });
});
