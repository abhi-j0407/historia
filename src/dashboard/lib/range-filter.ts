/** Read-time date-range slicing and stats for dashboard views (PRD §19.1). */

import { overallTotalsFromSiteDays, pickDailyWinner } from '@/core/aggregate-ranking';
import { eachDayInRange } from '@/core/dates';
import type { Aggregate, DailyWinner, DayKey } from '@/core/types';

export interface BusiestDay {
  day: DayKey;
  visits: number;
}

export interface SiteRangeStats {
  totalVisits: number;
  activeDays: number;
  longestStreak: number;
  busiestDay: BusiestDay | null;
}

export interface OverallRangeStats {
  totalVisits: number;
  activeDays: number;
  busiestDay: BusiestDay | null;
  avgPerActiveDay: number;
  avgPerCalendarDay: number;
}

/** Returns a new map containing only keys within [start, end], inclusive. */
export function sliceDailyMap(
  map: Record<DayKey, number>,
  start: DayKey,
  end: DayKey,
): Record<DayKey, number> {
  const sliced: Record<DayKey, number> = {};
  for (const [day, count] of Object.entries(map)) {
    if (day >= start && day <= end) {
      sliced[day] = count;
    }
  }
  return sliced;
}

function sumMap(map: Record<DayKey, number>): number {
  let total = 0;
  for (const count of Object.values(map)) {
    total += count;
  }
  return total;
}

function activeDaysInMap(map: Record<DayKey, number>): number {
  let days = 0;
  for (const count of Object.values(map)) {
    if (count > 0) {
      days += 1;
    }
  }
  return days;
}

function busiestDayInMap(map: Record<DayKey, number>): BusiestDay | null {
  let best: BusiestDay | null = null;
  for (const [day, visits] of Object.entries(map)) {
    if (visits <= 0) {
      continue;
    }
    if (best === null || visits > best.visits || (visits === best.visits && day < best.day)) {
      best = { day, visits };
    }
  }
  return best;
}

function longestStreakInRange(days: readonly DayKey[], hasVisit: (day: DayKey) => boolean): number {
  let max = 0;
  let current = 0;
  for (const day of days) {
    if (hasVisit(day)) {
      current += 1;
      if (current > max) {
        max = current;
      }
    } else {
      current = 0;
    }
  }
  return max;
}

/** Per-site stats for the active range (UX-PS-01). */
export function siteStatsForRange(
  aggregate: Aggregate,
  apex: string,
  start: DayKey,
  end: DayKey,
): SiteRangeStats {
  const siteDays = sliceDailyMap(aggregate.visitsPerSitePerDay[apex] ?? {}, start, end);
  const calendarDays = eachDayInRange(start, end);
  return {
    totalVisits: sumMap(siteDays),
    activeDays: activeDaysInMap(siteDays),
    longestStreak: longestStreakInRange(calendarDays, (day) => (siteDays[day] ?? 0) > 0),
    busiestDay: busiestDayInMap(siteDays),
  };
}

/** Overall daily stats for the active range (UX-OV-01). */
export function overallStatsForRange(
  aggregate: Aggregate,
  start: DayKey,
  end: DayKey,
): OverallRangeStats {
  const daily = sliceDailyMap(aggregate.totalVisitsPerDay, start, end);
  const totalVisits = sumMap(daily);
  const activeDays = activeDaysInMap(daily);
  const calendarLength = eachDayInRange(start, end).length;
  return {
    totalVisits,
    activeDays,
    busiestDay: busiestDayInMap(daily),
    avgPerActiveDay: activeDays > 0 ? Math.round(totalVisits / activeDays) : 0,
    avgPerCalendarDay: calendarLength > 0 ? Math.round(totalVisits / calendarLength) : 0,
  };
}

/** Counts days each apex won within the range (UX-W-01 legend). */
export function winnerCountsForRange(
  aggregate: Aggregate,
  start: DayKey,
  end: DayKey,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const [day, winner] of Object.entries(aggregate.dailyWinner)) {
    if (day < start || day > end) {
      continue;
    }
    const apex = winner.apexDomain;
    counts[apex] = (counts[apex] ?? 0) + 1;
  }
  return counts;
}

/** Runner-up for a day excluding the winner (B-005 tie-break via pickDailyWinner). */
export function runnerUpForDay(
  aggregate: Aggregate,
  day: DayKey,
  winnerApex: string,
): DailyWinner | null {
  const apexCounts = new Map<string, number>();
  for (const [apex, days] of Object.entries(aggregate.visitsPerSitePerDay)) {
    if (apex === winnerApex) {
      continue;
    }
    const count = days[day] ?? 0;
    if (count > 0) {
      apexCounts.set(apex, count);
    }
  }
  if (apexCounts.size === 0) {
    return null;
  }
  const overallTotals = overallTotalsFromSiteDays(aggregate.visitsPerSitePerDay);
  const picked = pickDailyWinner(apexCounts, overallTotals);
  return picked.visits > 0 ? picked : null;
}

/** Filters dailyWinner to in-range days for categorical heatmap data (UX-W-01). */
export function dailyWinnersInRange(
  aggregate: Aggregate,
  start: DayKey,
  end: DayKey,
): Record<DayKey, DailyWinner> {
  const result: Record<DayKey, DailyWinner> = {};
  for (const [day, winner] of Object.entries(aggregate.dailyWinner)) {
    if (day >= start && day <= end) {
      result[day] = winner;
    }
  }
  return result;
}
