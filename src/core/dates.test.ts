import { describe, expect, it } from 'vitest';

import { eachDayInRange, fromDayKey, resolveRange, toDayKey, todayKey } from './dates';

const FIXED_NOW = new Date(2026, 4, 22, 12, 0, 0, 0);

describe('toDayKey', () => {
  it('maps late-evening visits to the same local calendar day (B-006)', () => {
    expect(toDayKey(new Date(2026, 4, 22, 23, 55).getTime())).toBe('2026-05-22');
  });

  it('rolls over at local midnight', () => {
    expect(toDayKey(new Date(2026, 4, 23, 0, 1).getTime())).toBe('2026-05-23');
  });
});

describe('todayKey', () => {
  it('formats the provided instant', () => {
    expect(todayKey(FIXED_NOW)).toBe('2026-05-22');
  });

  it('defaults to the current instant when now is omitted', () => {
    expect(todayKey()).toBe(todayKey(new Date()));
  });
});

describe('fromDayKey', () => {
  it('roundtrips with toDayKey for today', () => {
    const today = todayKey(FIXED_NOW);
    expect(todayKey(fromDayKey(today))).toBe(today);
  });
});

describe('eachDayInRange', () => {
  it('returns inclusive ascending day keys', () => {
    expect(eachDayInRange('2026-05-20', '2026-05-22')).toEqual([
      '2026-05-20',
      '2026-05-21',
      '2026-05-22',
    ]);
  });

  it('returns a single key when start equals end', () => {
    expect(eachDayInRange('2026-05-22', '2026-05-22')).toEqual(['2026-05-22']);
  });

  it('throws when end precedes start', () => {
    expect(() => eachDayInRange('2026-05-22', '2026-05-21')).toThrow(RangeError);
  });
});

describe('resolveRange', () => {
  const anyEarliest = '2020-01-01';

  it('returns a 7-day window ending today (UX-S-02)', () => {
    expect(resolveRange('7d', anyEarliest, FIXED_NOW)).toEqual({
      start: '2026-05-16',
      end: '2026-05-22',
    });
  });

  it('returns a 30-day window ending today', () => {
    expect(resolveRange('30d', anyEarliest, FIXED_NOW)).toEqual({
      start: '2026-04-23',
      end: '2026-05-22',
    });
  });

  it('returns a 90-day window ending today', () => {
    expect(resolveRange('90d', anyEarliest, FIXED_NOW)).toEqual({
      start: '2026-02-22',
      end: '2026-05-22',
    });
  });

  it('returns the full aggregate span for all', () => {
    expect(resolveRange('all', '2025-09-01', FIXED_NOW)).toEqual({
      start: '2025-09-01',
      end: '2026-05-22',
    });
  });
});
