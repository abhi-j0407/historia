/**
 * Service-worker stub for Phase 2 smoke test. Registers the action-click handler
 * synchronously per SW-001 so the icon opens the dashboard tab.
 *
 * Real backfill, ingestion, and incremental update logic land in Phases 10–12.
 */
export function handleActionClick(): void {
  chrome.action.onClicked.addListener(async () => {
    const url = chrome.runtime.getURL('dashboard.html');
    await chrome.tabs.create({ url });
  });
}
