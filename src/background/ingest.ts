import { log } from '@/core/log';

/** Phase 11 defines the full backfill pipeline shape. */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type -- placeholder until Phase 11
export interface BackfillContext {}

/** SW-002 install / SW-005 force-refresh entry; Phase 11 replaces the body. */
export async function requestBackfill(_opts?: { force?: boolean }): Promise<void> {
  log('requestBackfill (stub)');
  await Promise.resolve();
}
