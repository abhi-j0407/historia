import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { eachDayInRange } from '@/core/dates';
import { buildIntensityScale } from '@/core/intensity';
import type { DayKey } from '@/core/types';

import { computeGeometry } from './heatmap-geometry';
import { Heatmap } from './Heatmap';

function intensityDataForRange(
  start: DayKey,
  end: DayKey,
  valueForDay: (day: DayKey, index: number) => number,
): Record<DayKey, number> {
  const data: Record<DayKey, number> = {};
  eachDayInRange(start, end).forEach((day, index) => {
    data[day] = valueForDay(day, index);
  });
  return data;
}

describe('Heatmap', () => {
  it('renders one rect per in-range day for a 30-day window', () => {
    const start = '2026-04-01';
    const end = '2026-04-30';
    const { container } = render(
      <Heatmap
        mode={{ kind: 'intensity', data: intensityDataForRange(start, end, () => 1) }}
        range={{ start, end }}
      />,
    );

    expect(container.querySelectorAll('rect')).toHaveLength(30);
  });

  it('maps five distinct non-zero values to at least five distinct fill colors', () => {
    const start = '2026-06-01';
    const end = '2026-06-05';
    const values = [1, 10, 50, 200, 1000];
    const { container } = render(
      <Heatmap
        mode={{
          kind: 'intensity',
          data: intensityDataForRange(start, end, (_day, i) => values[i]!),
        }}
        range={{ start, end }}
      />,
    );

    const fills = new Set(
      [...container.querySelectorAll('rect')].map((r) => r.getAttribute('fill')),
    );
    expect(fills.size).toBeGreaterThanOrEqual(5);
  });

  it('uses the same fill for cells sharing an apex in categorical mode', () => {
    const start = '2026-06-01';
    const end = '2026-06-03';
    const colorOf = (apex: string): string => (apex === 'a.com' ? '#111111' : '#222222');

    const { container } = render(
      <Heatmap
        mode={{
          kind: 'categorical',
          data: {
            '2026-06-01': { apex: 'a.com', visits: 3 },
            '2026-06-02': { apex: 'a.com', visits: 1 },
            '2026-06-03': { apex: 'b.com', visits: 2 },
          },
          colorOf,
        }}
        range={{ start, end }}
      />,
    );

    const rects = [...container.querySelectorAll('rect')];
    expect(rects[0]?.getAttribute('fill')).toBe('#111111');
    expect(rects[1]?.getAttribute('fill')).toBe('#111111');
    expect(rects[2]?.getAttribute('fill')).toBe('#222222');
  });

  it('gives each rect a title child and tabindex 0', () => {
    const start = '2026-05-01';
    const end = '2026-05-03';
    const { container } = render(
      <Heatmap mode={{ kind: 'intensity', data: { '2026-05-02': 4 } }} range={{ start, end }} />,
    );

    const rects = container.querySelectorAll('rect');
    for (const rect of rects) {
      expect(rect.querySelector('title')).not.toBeNull();
      expect(rect).toHaveAttribute('tabindex', '0');
    }
  });

  it('sets aria-label on the svg root from the range', () => {
    render(
      <Heatmap
        mode={{ kind: 'intensity', data: {} }}
        range={{ start: '2026-01-01', end: '2026-01-07' }}
      />,
    );

    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      'Activity heatmap for 2026-01-01 to 2026-01-07',
    );
  });

  it('calls onCellHover with the day on enter and null on leave', () => {
    const onCellHover = vi.fn();
    const start = '2026-05-10';
    const end = '2026-05-12';
    const { container } = render(
      <Heatmap
        mode={{ kind: 'intensity', data: { '2026-05-11': 2 } }}
        range={{ start, end }}
        onCellHover={onCellHover}
      />,
    );

    const target = container.querySelector('[data-day="2026-05-11"]')!;
    fireEvent.mouseEnter(target);
    expect(onCellHover).toHaveBeenLastCalledWith('2026-05-11');
    fireEvent.mouseLeave(target);
    expect(onCellHover).toHaveBeenLastCalledWith(null);
  });

  it('computes 365-day geometry and intensity scale within the P-002 budget', () => {
    const start = '2025-05-23';
    const end = '2026-05-22';
    const data = intensityDataForRange(start, end, (_day, i) => (i % 17) + 1);
    const days = eachDayInRange(start, end);
    const t0 = performance.now();
    computeGeometry({ start, end });
    const nonZero = days.map((day) => data[day] ?? 0).filter((v) => v > 0);
    buildIntensityScale(nonZero);
    expect(performance.now() - t0).toBeLessThanOrEqual(16);
  });
});
