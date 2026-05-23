/**
 * SW-003 backfill orchestrator: enumerate, fetch visits (P-001), aggregate, persist (P-003).
 */

import { aggregate } from '@/core/aggregate';
import { apexOf } from '@/core/domain';
import { shouldDropURL } from '@/core/filters';
import type { BackfillProgress, Visit } from '@/core/types';

import { writeAggregate } from './cache';
import { callChrome } from './chrome-promise';
import { pLimit } from './concurrency';

const GET_VISITS_CONCURRENCY = 32;
const HISTORY_PAGE_SIZE = 1000;
const WRITE_URL_THRESHOLD = 200;
const WRITE_MS_THRESHOLD = 1000;
const MAX_PARTIAL_WRITES = 99;
const BROADCAST_PERCENT = 0.05;
const BROADCAST_MS = 500;

let currentRun: AbortController | null = null;
let runPromise: Promise<void> | null = null;

let lastProgress: BackfillProgress = {
  phase: 'idle',
  processed: 0,
  total: 0,
  startedAt: 0,
};

/** D-006 — last broadcast progress for get-backfill-progress (Phase 10 router). */
export function getLastProgress(): BackfillProgress {
  return lastProgress;
}

/** SW-002 / SW-003 / SW-005 — full-history backfill entry point. */
export async function requestBackfill(opts?: { force?: boolean }): Promise<void> {
  if (currentRun !== null && opts?.force !== true) {
    return;
  }

  if (opts?.force === true && runPromise !== null) {
    currentRun?.abort();
    await runPromise.catch(() => {
      /* prior run may abort or error; wait until settled before restarting */
    });
  }

  const controller = new AbortController();
  currentRun = controller;
  const pipeline = runBackfillPipeline(controller.signal);
  runPromise = pipeline;

  try {
    await pipeline;
  } finally {
    if (currentRun === controller) {
      currentRun = null;
    }
    if (runPromise === pipeline) {
      runPromise = null;
    }
  }
}

async function runBackfillPipeline(signal: AbortSignal): Promise<void> {
  broadcastChain = Promise.resolve();
  const startedAt = Date.now();
  let writes = 0;
  let urlsSinceLastWrite = 0;
  let lastWriteAt = startedAt;
  const buffer: Visit[] = [];
  const broadcastState = { lastAt: 0, lastProcessed: 0 };

  const persistPartial = async (): Promise<void> => {
    if (writes >= MAX_PARTIAL_WRITES) {
      return;
    }
    const agg = aggregate(buffer);
    await writeAggregate(agg);
    writes += 1;
    urlsSinceLastWrite = 0;
    lastWriteAt = Date.now();
  };

  const maybePersist = async (): Promise<void> => {
    if (writes >= MAX_PARTIAL_WRITES) {
      return;
    }
    const elapsed = Date.now() - lastWriteAt;
    if (urlsSinceLastWrite >= WRITE_URL_THRESHOLD || elapsed >= WRITE_MS_THRESHOLD) {
      await persistPartial();
    }
  };

  const onUrlProcessed = async (): Promise<void> => {
    lastProgress = { ...lastProgress, processed: lastProgress.processed + 1 };
    urlsSinceLastWrite += 1;
    await maybePersist();
    await broadcastProgressThrottled(broadcastState);
  };

  try {
    checkAborted(signal);
    lastProgress = { phase: 'enumerating', processed: 0, total: 0, startedAt };
    await broadcastProgressThrottled(broadcastState);

    const urlEntries = await enumerateHistoryUrls(signal);
    lastProgress = {
      phase: 'fetching-visits',
      processed: 0,
      total: urlEntries.length,
      startedAt,
    };
    await broadcastProgressThrottled(broadcastState);

    const limit = pLimit<void>(GET_VISITS_CONCURRENCY);
    const fetchTasks = urlEntries.map(({ url, title }) =>
      limit(async () => {
        checkAborted(signal);
        const visitItems = await callChrome(`history.getVisits(${url})`, () =>
          chrome.history.getVisits({ url }),
        );
        for (const item of visitItems) {
          const apexDomain = apexOf(url);
          if (apexDomain === null) {
            continue;
          }
          buffer.push({
            url,
            apexDomain,
            title: title ?? '',
            visitedAt: item.visitTime ?? 0,
          });
        }
        await onUrlProcessed();
      }),
    );

    await Promise.all(fetchTasks);

    checkAborted(signal);
    lastProgress = { ...lastProgress, phase: 'aggregating' };
    await broadcastProgressThrottled(broadcastState);

    const finalAgg = aggregate(buffer);
    await writeAggregate(finalAgg);
    writes += 1;

    lastProgress = {
      phase: 'done',
      processed: lastProgress.total,
      total: lastProgress.total,
      startedAt,
    };
    broadcastState.lastAt = 0;
    broadcastState.lastProcessed = -1;
    await broadcastProgressThrottled(broadcastState);
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    lastProgress = {
      ...lastProgress,
      phase: 'error',
      startedAt,
    };
    broadcastState.lastAt = 0;
    broadcastState.lastProcessed = -1;
    await broadcastProgressThrottled(broadcastState);
    throw error;
  }
}

interface UrlEntry {
  url: string;
  title: string;
}

async function enumerateHistoryUrls(signal: AbortSignal): Promise<UrlEntry[]> {
  let items = await callChrome('history.search(enumerate)', () =>
    chrome.history.search({ text: '', maxResults: 0, startTime: 0 }),
  );

  if (items.length === 0) {
    items = await paginateHistorySearch(signal);
  }

  const byUrl = new Map<string, string>();
  for (const item of items) {
    const url = item.url;
    if (url === undefined || shouldDropURL(url)) {
      continue;
    }
    const title = item.title ?? '';
    const existing = byUrl.get(url);
    if (existing === undefined || (title.length > 0 && existing.length === 0)) {
      byUrl.set(url, title);
    }
  }

  return [...byUrl.entries()].map(([url, title]) => ({ url, title }));
}

async function paginateHistorySearch(signal: AbortSignal): Promise<chrome.history.HistoryItem[]> {
  const collected: chrome.history.HistoryItem[] = [];
  let endTime = Date.now();

  while (true) {
    checkAborted(signal);
    const page = await callChrome('history.search(page)', () =>
      chrome.history.search({
        text: '',
        maxResults: HISTORY_PAGE_SIZE,
        startTime: 0,
        endTime,
      }),
    );

    if (page.length === 0) {
      break;
    }

    collected.push(...page);

    if (page.length < HISTORY_PAGE_SIZE) {
      break;
    }

    const oldest = page.reduce(
      (min, item) => Math.min(min, item.lastVisitTime ?? Number.MAX_SAFE_INTEGER),
      Number.MAX_SAFE_INTEGER,
    );
    if (oldest === Number.MAX_SAFE_INTEGER || oldest <= 0) {
      break;
    }
    endTime = oldest - 1;
  }

  return collected;
}

let broadcastChain: Promise<void> = Promise.resolve();

function isNoProgressReceiverError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Receiving end does not exist') ||
    message.includes('Could not establish connection') ||
    message.includes('No listeners available')
  );
}

async function broadcastProgressThrottled(state: {
  lastAt: number;
  lastProcessed: number;
}): Promise<void> {
  await (broadcastChain = broadcastChain.then(async () => {
    const { processed, total } = lastProgress;
    const now = Date.now();
    const processedAdvance = total > 0 ? (processed - state.lastProcessed) / total : 0;
    const shouldSend =
      state.lastAt === 0 ||
      processedAdvance >= BROADCAST_PERCENT ||
      now - state.lastAt >= BROADCAST_MS;

    if (!shouldSend) {
      return;
    }

    try {
      await chrome.runtime.sendMessage({
        type: 'backfill-progress',
        payload: lastProgress,
      });
    } catch (error) {
      // Dashboard tab may be closed — no runtime message receiver (SW-003 / UX-S-06).
      if (isNoProgressReceiverError(error)) {
        state.lastAt = now;
        state.lastProcessed = processed;
        return;
      }
      throw error;
    }

    state.lastAt = now;
    state.lastProcessed = processed;
  }));
}

function checkAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
