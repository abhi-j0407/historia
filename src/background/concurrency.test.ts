import { describe, expect, it } from 'vitest';

import { pLimit } from './concurrency';

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('pLimit', () => {
  it('caps peak in-flight tasks at max while draining the FIFO queue', async () => {
    const limit = pLimit<void>(32);
    let inFlight = 0;
    let peak = 0;

    const tasks = Array.from({ length: 100 }, () =>
      limit(async () => {
        inFlight += 1;
        peak = Math.max(peak, inFlight);
        await delay(5);
        inFlight -= 1;
      }),
    );

    await Promise.all(tasks);
    expect(peak).toBeLessThanOrEqual(32);
    expect(peak).toBeGreaterThan(1);
  });

  it('releases the queue when a task rejects so later tasks still run', async () => {
    const limit = pLimit<number>(2);
    const results: number[] = [];

    await expect(limit(() => Promise.reject(new Error('boom')))).rejects.toThrow('boom');

    await limit(() => {
      results.push(1);
      return Promise.resolve(1);
    });
    await limit(() => {
      results.push(2);
      return Promise.resolve(2);
    });

    expect(results).toEqual([1, 2]);
  });
});
