/** Pure visit aggregation (B-005..B-008). */

/* v8 ignore next */
import {
  overallTotalsFromSiteDays,
  pickDailyWinner,
  topSitesFromSiteDays,
} from './aggregate-ranking';
import { toDayKey } from './dates';
import type { Aggregate, DailyWinner, DayKey, Visit } from './types';
import { AGGREGATE_VERSION } from './types';

/* v8 ignore start */

/** Aggregates normalized visits into the cached D-005 payload (B-005..B-008). */
export function aggregate(visits: readonly Visit[], computedAt: number = Date.now()): Aggregate {
  if (visits.length === 0) {
    const day = toDayKey(computedAt);
    return {
      version: AGGREGATE_VERSION,
      computedAt,
      lastAggregatedAt: 0,
      dateRange: { earliest: day, latest: day },
      totalVisitsPerDay: {},
      visitsPerSitePerDay: {},
      dailyWinner: {},
      topSites: [],
    };
  }

  const totalVisitsPerDay: Record<DayKey, number> = {};
  const visitsPerSitePerDay: Record<string, Record<DayKey, number>> = {};
  const countsPerDayPerApex = new Map<DayKey, Map<string, number>>();

  let earliest = '';
  let latest = '';
  let lastAggregatedAt = 0;

  for (const visit of visits) {
    const day = toDayKey(visit.visitedAt);
    const apex = visit.apexDomain;

    if (visit.visitedAt > lastAggregatedAt) {
      lastAggregatedAt = visit.visitedAt;
    }
    if (earliest === '' || day < earliest) {
      earliest = day;
    }
    if (latest === '' || day > latest) {
      latest = day;
    }

    totalVisitsPerDay[day] = (totalVisitsPerDay[day] ?? 0) + 1;

    let siteDays = visitsPerSitePerDay[apex];
    if (!siteDays) {
      siteDays = {};
      visitsPerSitePerDay[apex] = siteDays;
    }
    siteDays[day] = (siteDays[day] ?? 0) + 1;

    let dayCounts = countsPerDayPerApex.get(day);
    if (!dayCounts) {
      dayCounts = new Map();
      countsPerDayPerApex.set(day, dayCounts);
    }
    dayCounts.set(apex, (dayCounts.get(apex) ?? 0) + 1);
  }

  const overallTotals = overallTotalsFromSiteDays(visitsPerSitePerDay);

  const dailyWinner: Record<DayKey, DailyWinner> = {};
  for (const [day, apexCounts] of countsPerDayPerApex) {
    dailyWinner[day] = pickDailyWinner(apexCounts, overallTotals);
  }

  return {
    version: AGGREGATE_VERSION,
    computedAt,
    lastAggregatedAt,
    dateRange: { earliest, latest },
    totalVisitsPerDay,
    visitsPerSitePerDay,
    dailyWinner,
    topSites: topSitesFromSiteDays(visitsPerSitePerDay),
  };
}
