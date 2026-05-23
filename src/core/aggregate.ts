/** Pure visit aggregation (B-005..B-008). */

/* v8 ignore next */
import { toDayKey } from './dates';
import type { Aggregate, DailyWinner, DayKey, SiteRank, Visit } from './types';
import { AGGREGATE_VERSION } from './types';

/* v8 ignore start */
function compareSiteRank(a: SiteRank, b: SiteRank): number {
  if (b.totalVisits !== a.totalVisits) {
    return b.totalVisits - a.totalVisits;
  }
  if (b.activeDays !== a.activeDays) {
    return b.activeDays - a.activeDays;
  }
  return a.apexDomain.localeCompare(b.apexDomain);
}

function pickDailyWinner(
  apexCounts: Map<string, number>,
  overallTotals: ReadonlyMap<string, number>,
): DailyWinner {
  let winnerApex = '';
  let winnerVisits = -1;
  let winnerOverall = -1;

  for (const [apex, count] of apexCounts) {
    const overall = overallTotals.get(apex) ?? 0;
    const beats =
      count > winnerVisits ||
      (count === winnerVisits &&
        (overall > winnerOverall ||
          (overall === winnerOverall && apex.localeCompare(winnerApex) < 0)));
    if (beats) {
      winnerApex = apex;
      winnerVisits = count;
      winnerOverall = overall;
    }
  }

  return { apexDomain: winnerApex, visits: winnerVisits };
}

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
  const siteTotals = new Map<string, { totalVisits: number; activeDays: Set<DayKey> }>();
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

    let site = siteTotals.get(apex);
    if (!site) {
      site = { totalVisits: 0, activeDays: new Set() };
      siteTotals.set(apex, site);
    }
    site.totalVisits += 1;
    site.activeDays.add(day);

    let dayCounts = countsPerDayPerApex.get(day);
    if (!dayCounts) {
      dayCounts = new Map();
      countsPerDayPerApex.set(day, dayCounts);
    }
    dayCounts.set(apex, (dayCounts.get(apex) ?? 0) + 1);
  }

  const overallTotals = new Map<string, number>();
  for (const [apex, { totalVisits }] of siteTotals) {
    overallTotals.set(apex, totalVisits);
  }

  const topSites: SiteRank[] = [...siteTotals.entries()]
    .map(([apexDomain, { totalVisits, activeDays }]) => ({
      apexDomain,
      totalVisits,
      activeDays: activeDays.size,
    }))
    .sort(compareSiteRank);

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
    topSites,
  };
}
