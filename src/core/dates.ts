/** Local-timezone day-key helpers (B-006, UX-S-02). */

/* v8 ignore next */
import { eachDayOfInterval, format, parseISO, startOfDay, subDays } from 'date-fns';

import type { DayKey } from './types';

/** Converts a visit timestamp to a local-timezone day key (B-006). */
export function toDayKey(visitedAt: number): DayKey {
  return format(new Date(visitedAt), 'yyyy-MM-dd');
}

/** Parses a day key to the start of that calendar day in local time. */
export function fromDayKey(key: DayKey): Date {
  return startOfDay(parseISO(key));
}

/** Returns today's day key in the user's local timezone. */
export function todayKey(now: Date = new Date()): DayKey {
  return format(now, 'yyyy-MM-dd');
}

/** Lists every day key from start through end, inclusive and ascending. */
export function eachDayInRange(start: DayKey, end: DayKey): DayKey[] {
  if (end < start) {
    throw new RangeError(`end day key ${end} is before start ${start}`);
  }
  return eachDayOfInterval({
    start: parseISO(start),
    end: parseISO(end),
  }).map((day) => format(day, 'yyyy-MM-dd'));
}

export type DateRangeSelector = '7d' | '30d' | '90d' | 'all';

/** Resolves UX-S-02 selector windows to inclusive start/end day keys. */
export function resolveRange(
  selector: DateRangeSelector,
  aggregateEarliest: DayKey,
  now: Date = new Date(),
): { start: DayKey; end: DayKey } {
  const end = todayKey(now);
  if (selector === 'all') {
    return { start: aggregateEarliest, end };
  }
  const windowDays = selector === '7d' ? 7 : selector === '30d' ? 30 : 90;
  const start = format(subDays(now, windowDays - 1), 'yyyy-MM-dd');
  return { start, end };
}
