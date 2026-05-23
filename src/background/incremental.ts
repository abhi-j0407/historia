/**
 * Pure incremental merge into an existing aggregate (SW-004 mutation path, B-005/B-007).
 */

import {
  overallTotalsFromSiteDays,
  pickDailyWinner,
  topSitesFromSiteDays,
} from '@/core/aggregate-ranking';
import { toDayKey } from '@/core/dates';
import type { Aggregate, DayKey, Visit } from '@/core/types';

/** Above this count, debounce falls back to full backfill (PHASE-PLAN Phase 12). */
export const INCREMENTAL_FALLBACK = 250;

function cloneSiteDays(
  source: Readonly<Record<string, Readonly<Record<DayKey, number>>>>,
): Record<string, Record<DayKey, number>> {
  const cloned: Record<string, Record<DayKey, number>> = {};
  for (const [apex, days] of Object.entries(source)) {
    cloned[apex] = { ...days };
  }
  return cloned;
}

function apexCountsForDay(
  visitsPerSitePerDay: Readonly<Record<string, Readonly<Record<DayKey, number>>>>,
  day: DayKey,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const [apex, days] of Object.entries(visitsPerSitePerDay)) {
    const count = days[day];
    if (count !== undefined) {
      counts.set(apex, count);
    }
  }
  return counts;
}

/** Merges new visits into a cached aggregate without re-scanning full history (B-005/B-007). */
export function mergeIncremental(existing: Aggregate, newVisits: Visit[], now: number): Aggregate {
  if (newVisits.length === 0) {
    return { ...existing, computedAt: now };
  }

  const totalVisitsPerDay = { ...existing.totalVisitsPerDay };
  const visitsPerSitePerDay = cloneSiteDays(existing.visitsPerSitePerDay);
  const affectedDays = new Set<DayKey>();

  let lastAggregatedAt = existing.lastAggregatedAt;
  let earliest = existing.dateRange.earliest;
  let latest = existing.dateRange.latest;

  for (const visit of newVisits) {
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
    affectedDays.add(day);

    let siteDays = visitsPerSitePerDay[apex];
    if (!siteDays) {
      siteDays = {};
      visitsPerSitePerDay[apex] = siteDays;
    }
    siteDays[day] = (siteDays[day] ?? 0) + 1;
  }

  const overallTotals = overallTotalsFromSiteDays(visitsPerSitePerDay);
  const dailyWinner = { ...existing.dailyWinner };
  for (const day of affectedDays) {
    dailyWinner[day] = pickDailyWinner(apexCountsForDay(visitsPerSitePerDay, day), overallTotals);
  }

  return {
    ...existing,
    computedAt: now,
    lastAggregatedAt,
    dateRange: { earliest, latest },
    totalVisitsPerDay,
    visitsPerSitePerDay,
    dailyWinner,
    topSites: topSitesFromSiteDays(visitsPerSitePerDay),
  };
}
