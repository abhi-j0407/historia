import { describe, expect, it } from 'vitest';

import { buildIntensityScale } from './intensity';

describe('buildIntensityScale', () => {
  it('returns level 0 for every value when input has no positives', () => {
    const scale = buildIntensityScale([]);
    expect(scale.quantiles).toEqual([0, 0, 0, 0]);
    expect(scale.assign(0)).toBe(0);
    expect(scale.assign(5)).toBe(0);
  });

  it('computes Type-7 quantiles for the smooth ramp 1..10', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const scale = buildIntensityScale(values);
    expect(scale.quantiles[0]).toBeCloseTo(2.8, 5);
    expect(scale.quantiles[1]).toBeCloseTo(4.6, 5);
    expect(scale.quantiles[2]).toBeCloseTo(6.4, 5);
    expect(scale.quantiles[3]).toBeCloseTo(8.2, 5);
    expect(scale.assign(0)).toBe(0);
    expect(scale.assign(1)).toBe(1);
    expect(scale.assign(3)).toBe(2);
    expect(scale.assign(5)).toBe(3);
    expect(scale.assign(7)).toBe(4);
    expect(scale.assign(10)).toBe(5);
  });

  it('falls back to distinct-value mapping when fewer than 5 uniques exist', () => {
    const scale = buildIntensityScale([2, 5]);
    expect(scale.assign(2)).toBe(1);
    expect(scale.assign(5)).toBe(2);
  });

  it('merges extra quantile slots from the top for three and four distinct values', () => {
    const three = buildIntensityScale([1, 2, 3]);
    expect(three.quantiles).toEqual([1, 2, 3, 3]);
    expect(three.assign(3)).toBe(3);

    const four = buildIntensityScale([10, 20, 30, 40]);
    expect(four.quantiles).toEqual([10, 20, 30, 40]);
    expect(four.assign(40)).toBe(4);
  });

  it('maps a single distinct positive to one visible bucket', () => {
    const scale = buildIntensityScale([42]);
    expect(scale.quantiles).toEqual([42, 42, 42, 42]);
    expect(scale.assign(42)).toBe(1);
    expect(scale.assign(100)).toBe(5);
  });

  it('treats values strictly above p80 as level 5', () => {
    const scale = buildIntensityScale([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(scale.assign(8.2)).toBe(4);
    expect(scale.assign(8.21)).toBe(5);
  });

  it('produces at least five distinct intensity levels across 1..50', () => {
    const scale = buildIntensityScale(Array.from({ length: 50 }, (_, i) => i + 1));
    const levels = new Set(Array.from({ length: 50 }, (_, i) => scale.assign(i + 1)));
    expect(levels.size).toBeGreaterThanOrEqual(5);
  });
});
