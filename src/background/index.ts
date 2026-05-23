import { callChrome } from './chrome-promise';
import { handleRecomputeAlarm, scheduleRecompute } from './debounce';
import { getLastProgress, requestBackfill } from './ingest';

/** SW-001 — Register every service-worker listener synchronously at call time. */
export function registerBackgroundListeners(): void {
  chrome.action.onClicked.addListener(() => {
    void openDashboard();
  });

  chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
      void requestBackfill();
    }
  });

  chrome.runtime.onStartup.addListener(() => {
    // SW-006: existing cache is read on dashboard open; no work here.
  });

  chrome.history.onVisited.addListener(() => {
    scheduleRecompute();
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'recompute') {
      void handleRecomputeAlarm();
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message == null || typeof message !== 'object' || !('type' in message)) {
      return false;
    }
    const { type } = message as { type: string };
    if (type === 'force-refresh') {
      void requestBackfill({ force: true });
      return false;
    }
    if (type === 'get-backfill-progress') {
      sendResponse(getLastProgress());
      return false;
    }
    return false;
  });
}

async function openDashboard(): Promise<void> {
  const url = chrome.runtime.getURL('dashboard.html');
  await callChrome('tabs.create(dashboard)', () => chrome.tabs.create({ url }));
}
