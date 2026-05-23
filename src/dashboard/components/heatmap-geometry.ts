/** Pure SVG layout for the activity heatmap grid (HM-005). */

import { addDays, differenceInCalendarDays, format } from 'date-fns';

import { eachDayInRange, fromDayKey } from '@/core/dates';
import type { DayKey } from '@/core/types';

export interface HeatmapCell {
  day: DayKey;
  weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  weekIndex: number;
  x: number;
  y: number;
}

export interface WeekColumn {
  weekIndex: number;
  startDate: DayKey;
  monthOfFirstDay: number;
}

export interface MonthLabel {
  weekIndex: number;
  x: number;
  label: string;
}

export interface WeekdayLabel {
  weekday: 1 | 3 | 5;
  y: number;
  label: string;
}

export interface HeatmapGeometry {
  cells: HeatmapCell[];
  weeks: WeekColumn[];
  monthLabels: MonthLabel[];
  weekdayLabels: WeekdayLabel[];
  width: number;
  height: number;
  cellSize: number;
  cellGap: number;
  gridLeft: number;
  gridTop: number;
}

const GRID_LEFT = 28;
const GRID_TOP = 18;

function sundayOnOrBefore(day: DayKey): DayKey {
  const date = fromDayKey(day);
  return format(addDays(date, -date.getDay()), 'yyyy-MM-dd');
}

function weekIndexForDay(padStart: DayKey, day: DayKey): number {
  return Math.floor(differenceInCalendarDays(fromDayKey(day), fromDayKey(padStart)) / 7);
}

/** Lays out in-range day cells on a Sun–Sat week grid with month and weekday labels (HM-005). */
export function computeGeometry(
  range: { start: DayKey; end: DayKey },
  options?: { cellSize?: number; cellGap?: number },
): HeatmapGeometry {
  const cellSize = options?.cellSize ?? 11;
  const cellGap = options?.cellGap ?? 2;
  const stride = cellSize + cellGap;
  const padStart = sundayOnOrBefore(range.start);
  const daysInRange = eachDayInRange(range.start, range.end);
  const spanDays = differenceInCalendarDays(fromDayKey(range.end), fromDayKey(padStart)) + 1;
  const weekCount = Math.ceil(spanDays / 7);

  const weeks: WeekColumn[] = [];
  for (let i = 0; i < weekCount; i += 1) {
    const startDate = format(addDays(fromDayKey(padStart), i * 7), 'yyyy-MM-dd');
    weeks.push({
      weekIndex: i,
      startDate,
      monthOfFirstDay: fromDayKey(startDate).getMonth(),
    });
  }

  const monthLabels: MonthLabel[] = [];
  for (let i = 0; i < weeks.length; i += 1) {
    const prevMonth = i > 0 ? weeks[i - 1]!.monthOfFirstDay : null;
    const week = weeks[i]!;
    if (i === 0 || week.monthOfFirstDay !== prevMonth) {
      monthLabels.push({
        weekIndex: i,
        x: GRID_LEFT + i * stride,
        label: format(fromDayKey(week.startDate), 'MMM'),
      });
    }
  }

  const weekdayLabels: WeekdayLabel[] = [
    { weekday: 1, label: 'Mon', y: GRID_TOP + 1 * stride + cellSize / 2 },
    { weekday: 3, label: 'Wed', y: GRID_TOP + 3 * stride + cellSize / 2 },
    { weekday: 5, label: 'Fri', y: GRID_TOP + 5 * stride + cellSize / 2 },
  ];

  const cells: HeatmapCell[] = daysInRange.map((day) => {
    const weekday = fromDayKey(day).getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const col = weekIndexForDay(padStart, day);
    return {
      day,
      weekday,
      weekIndex: col,
      x: GRID_LEFT + col * stride,
      y: GRID_TOP + weekday * stride,
    };
  });

  return {
    cells,
    weeks,
    monthLabels,
    weekdayLabels,
    width: GRID_LEFT + weekCount * stride,
    height: GRID_TOP + 7 * stride,
    cellSize,
    cellGap,
    gridLeft: GRID_LEFT,
    gridTop: GRID_TOP,
  };
}
