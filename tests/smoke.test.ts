import { describe, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';

describe('test infrastructure', () => {
  it('jsdom environment is active', () => {
    expect(typeof document).toBe('object');
    expect(document.body).toBeTruthy();
  });

  it('fakeBrowser is available and resets between tests', async () => {
    await fakeBrowser.storage.local.set({ smoke: 42 });
    const got = await fakeBrowser.storage.local.get('smoke');
    expect(got).toEqual({ smoke: 42 });
  });
});
