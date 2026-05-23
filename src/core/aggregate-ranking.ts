/** B-005 / B-007 comparators shared by full and incremental aggregation. */

import type { DailyWinner, DayKey, SiteRank } from './types';

/** B-007 — Sort topSites by totalVisits, activeDays, then apex ascending. */
export function compareSiteRank(a: SiteRank, b: SiteRank): number {
  if (b.totalVisits !== a.totalVisits) {
    return b.totalVisits - a.totalVisits;
  }
  if (b.activeDays !== a.activeDays) {
    return b.activeDays - a.activeDays;
  }
  return a.apexDomain.localeCompare(b.apexDomain);
}

/** B-005 — Pick daily winner with overall-total then lexicographic tie-break. */
export function pickDailyWinner(
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

/** Sums per-apex visit counts across all days in visitsPerSitePerDay. */
export function overallTotalsFromSiteDays(
  visitsPerSitePerDay: Readonly<Record<string, Readonly<Record<DayKey, number>>>>,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const [apex, days] of Object.entries(visitsPerSitePerDay)) {
    let sum = 0;
    for (const count of Object.values(days)) {
      sum += count;
    }
    totals.set(apex, sum);
  }
  return totals;
}

/** Rebuilds topSites from sparse visitsPerSitePerDay (B-007). */
export function topSitesFromSiteDays(
  visitsPerSitePerDay: Readonly<Record<string, Readonly<Record<DayKey, number>>>>,
): SiteRank[] {
  const ranks: SiteRank[] = [];
  for (const [apexDomain, days] of Object.entries(visitsPerSitePerDay)) {
    let totalVisits = 0;
    let activeDays = 0;
    for (const count of Object.values(days)) {
      totalVisits += count;
      if (count > 0) {
        activeDays += 1;
      }
    }
    ranks.push({ apexDomain, totalVisits, activeDays });
  }
  return ranks.sort(compareSiteRank);
}
