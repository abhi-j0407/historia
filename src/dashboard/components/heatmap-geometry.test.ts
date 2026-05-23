import { describe, expect, it } from 'vitest';

import { eachDayInRange, fromDayKey } from '@/core/dates';
import { buildIntensityScale } from '@/core/intensity';
import type { DayKey } from '@/core/types';

import { computeGeometry } from './heatmap-geometry';

const P002_YEAR_START: DayKey = '2025-05-23';
const P002_YEAR_END: DayKey = '2026-05-22';

function p002PrepPathElapsedMs(): number {
  const days = eachDayInRange(P002_YEAR_START, P002_YEAR_END);
  const values = days.map((_day, index) => (index % 17) + 1);
  const t0 = performance.now();
  computeGeometry({ start: P002_YEAR_START, end: P002_YEAR_END });
  buildIntensityScale(values);
  return performance.now() - t0;
}

describe('computeGeometry', () => {
  it('places a Sun–Sat week in column 0 with weekdays 0..6', () => {
    const geometry = computeGeometry({ start: '2026-05-17', end: '2026-05-23' });

    expect(geometry.cells).toHaveLength(7);
    expect(geometry.cells.map((c) => c.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(geometry.cells.every((c) => c.weekIndex === 0)).toBe(true);
    expect(geometry.weeks).toHaveLength(1);
  });

  it('emits a month label when the calendar month changes between week columns', () => {
    const geometry = computeGeometry({ start: '2026-04-25', end: '2026-05-07' });

    const labels = geometry.monthLabels.map((m) => m.label);
    expect(labels).toContain('Apr');
    expect(labels).toContain('May');
    expect(labels.indexOf('May')).toBeGreaterThan(labels.indexOf('Apr'));
  });

  it('aligns the first in-range day to its calendar weekday row for arbitrary starts', () => {
    const cases: { start: DayKey; end: DayKey }[] = [
      { start: '2026-03-04', end: '2026-03-10' },
      { start: '2026-01-15', end: '2026-01-21' },
      { start: '2026-07-01', end: '2026-07-07' },
    ];

    for (const { start, end } of cases) {
      const geometry = computeGeometry({ start, end });
      const first = geometry.cells[0]!;
      const expectedWeekday = fromDayKey(start).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
      expect(first.weekday).toBe(expectedWeekday);
      expect(geometry.cells).toHaveLength(eachDayInRange(start, end).length);
    }
  });

  it('uses default cell size 11 and gap 2 with grid offsets 28 and 18', () => {
    const geometry = computeGeometry({ start: '2026-05-17', end: '2026-05-23' });

    expect(geometry.cellSize).toBe(11);
    expect(geometry.cellGap).toBe(2);
    expect(geometry.gridLeft).toBe(28);
    expect(geometry.gridTop).toBe(18);
    const stride = 11 + 2;
    expect(geometry.width).toBe(28 + stride);
    expect(geometry.height).toBe(18 + 7 * stride);
  });

  it('prepares 365-day geometry and intensity scale within the P-002 budget', () => {
    p002PrepPathElapsedMs();
    const samples = Array.from({ length: 5 }, () => p002PrepPathElapsedMs());
    const elapsed = Math.min(...samples);
    const budgetMs = process.env.CI ? 48 : 16;

    const geometry = computeGeometry({ start: P002_YEAR_START, end: P002_YEAR_END });
    expect(geometry.cells).toHaveLength(365);
    expect(elapsed).toBeLessThanOrEqual(budgetMs);
  });
});
