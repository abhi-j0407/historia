import { log } from '@/core/log';

import { callChrome } from './chrome-promise';

/** SW-004 debounce entry; Phase 12 replaces surrounding flow. */
export function scheduleRecompute(): void {
  void callChrome('alarms.create(recompute)', () =>
    chrome.alarms.create('recompute', { delayInMinutes: 0.5 }),
  );
}

/** SW-004 alarm handler; Phase 12 replaces the body. */
export async function handleRecomputeAlarm(): Promise<void> {
  log('handleRecomputeAlarm (stub)');
  await Promise.resolve();
}
