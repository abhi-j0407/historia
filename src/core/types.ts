/**
 * Canonical data shapes shared across core, background, and dashboard layers.
 * Mirrors PRD §6 (D-001 .. D-006). Do not edit shapes without amending the PRD.
 */

/** D-001 — Normalized internal visit record. */
export interface Visit {
  url: string;
  apexDomain: string;
  title: string;
  visitedAt: number;
}

/** D-002 — Local-timezone day key in YYYY-MM-DD form. */
export type DayKey = string;

/** D-003 — Per-site aggregate row. */
export interface SiteRank {
  apexDomain: string;
  totalVisits: number;
  activeDays: number;
}

/** D-004 — Winner of a single day. */
export interface DailyWinner {
  apexDomain: string;
  visits: number;
}

/** D-005 — Full cached aggregate payload. */
export interface Aggregate {
  version: 1;
  computedAt: number;
  lastAggregatedAt: number;
  dateRange: { earliest: DayKey; latest: DayKey };
  totalVisitsPerDay: Record<DayKey, number>;
  visitsPerSitePerDay: Record<string, Record<DayKey, number>>;
  dailyWinner: Record<DayKey, DailyWinner>;
  topSites: SiteRank[];
}

/** D-006 — Transient backfill progress signal (not persisted). */
export interface BackfillProgress {
  phase: 'idle' | 'enumerating' | 'fetching-visits' | 'aggregating' | 'done' | 'error';
  processed: number;
  total: number;
  startedAt: number;
}

/** Schema version currently expected by the running code (used by ST-003). */
export const AGGREGATE_VERSION = 1 as const;
