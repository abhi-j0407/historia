import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

import { registerBackgroundListeners } from './index';

/** @webext-core/fake-browser does not implement history.onVisited yet. */
function installHistoryOnVisitedMock(): void {
  const listeners = new Set<Parameters<chrome.history.OnVisitedEvent['addListener']>[0]>();
  fakeBrowser.history.onVisited.addListener = vi.fn((listener) => {
    listeners.add(listener);
  });
  fakeBrowser.history.onVisited.removeListener = vi.fn((listener) => {
    listeners.delete(listener);
  });
  fakeBrowser.history.onVisited.hasListeners = vi.fn(() => listeners.size > 0);
  fakeBrowser.history.onVisited.hasListener = vi.fn((listener) => listeners.has(listener));
}

describe('background entry', () => {
  beforeEach(() => {
    installHistoryOnVisitedMock();
  });

  it('registers all required top-level listeners', () => {
    registerBackgroundListeners();
    expect(fakeBrowser.action.onClicked.hasListeners()).toBe(true);
    expect(fakeBrowser.runtime.onInstalled.hasListeners()).toBe(true);
    expect(fakeBrowser.runtime.onStartup.hasListeners()).toBe(true);
    expect(fakeBrowser.history.onVisited.hasListeners()).toBe(true);
    expect(fakeBrowser.alarms.onAlarm.hasListeners()).toBe(true);
    expect(fakeBrowser.runtime.onMessage.hasListeners()).toBe(true);
  });
});
