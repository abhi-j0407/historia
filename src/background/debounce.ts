/**
 * SW-004 debounced incremental recompute via chrome.alarms (P-003 single write).
 */

import { apexOf } from '@/core/domain';
import { shouldDropURL } from '@/core/filters';
import type { Visit } from '@/core/types';

import { readAggregate, writeAggregate } from './cache';
import { callChrome } from './chrome-promise';
import { pLimit } from './concurrency';
import { INCREMENTAL_FALLBACK, mergeIncremental } from './incremental';
import { requestBackfill } from './ingest';

const GET_VISITS_CONCURRENCY = 32;

/** SW-004 — Debounce onVisited bursts; same alarm name resets the 30s timer. */
export function scheduleRecompute(): void {
  void callChrome('alarms.create(recompute)', () =>
    chrome.alarms.create('recompute', { delayInMinutes: 0.5 }),
  );
}

/** SW-004 — Fetch history delta since lastAggregatedAt and merge once (P-003). */
export async function handleRecomputeAlarm(): Promise<void> {
  const existing = await readAggregate();
  if (existing === null) {
    await requestBackfill();
    return;
  }

  const since = existing.lastAggregatedAt;
  const now = Date.now();

  const items = await callChrome('history.search(incremental)', () =>
    chrome.history.search({
      text: '',
      startTime: since,
      endTime: now,
      maxResults: 0,
    }),
  );

  const urlEntries: { url: string; title: string }[] = [];
  for (const item of items) {
    const url = item.url;
    if (url === undefined || shouldDropURL(url)) {
      continue;
    }
    urlEntries.push({ url, title: item.title ?? '' });
  }

  const limit = pLimit<Visit[]>(GET_VISITS_CONCURRENCY);
  const visitBatches = await Promise.all(
    urlEntries.map(({ url, title }) =>
      limit(async () => {
        const visitItems = await callChrome(`history.getVisits(${url})`, () =>
          chrome.history.getVisits({ url }),
        );
        const apexDomain = apexOf(url);
        if (apexDomain === null) {
          return [];
        }
        const visits: Visit[] = [];
        for (const item of visitItems) {
          const visitTime = item.visitTime ?? 0;
          if (visitTime > since) {
            visits.push({
              url,
              apexDomain,
              title,
              visitedAt: visitTime,
            });
          }
        }
        return visits;
      }),
    ),
  );

  const newVisits = visitBatches.flat();

  if (newVisits.length > INCREMENTAL_FALLBACK) {
    await requestBackfill();
    return;
  }

  const updated = mergeIncremental(existing, newVisits, now);
  await writeAggregate(updated);
}
