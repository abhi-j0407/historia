import { useCallback, useMemo, useState } from 'react';

import { eachDayInRange } from '@/core/dates';
import { buildIntensityScale, type IntensityLevel } from '@/core/intensity';
import type { DayKey } from '@/core/types';
import {
  intensityColor,
  type IntensityRamp,
  PLACEHOLDER_INTENSITY_RAMP,
} from '@/dashboard/components/heatmap-color';
import { computeGeometry } from '@/dashboard/components/heatmap-geometry';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard/components/ui/tooltip';

const EMPTY_CATEGORICAL_COLOR = '#f4f4f5';

export type HeatmapMode =
  | { kind: 'intensity'; data: Record<DayKey, number>; ramp?: IntensityRamp }
  | {
      kind: 'categorical';
      data: Record<DayKey, { apex: string; visits: number }>;
      colorOf: (apex: string) => string;
    };

export interface HeatmapProps {
  mode: HeatmapMode;
  range: { start: DayKey; end: DayKey };
  onCellHover?: (day: DayKey | null) => void;
  renderTooltip?: (day: DayKey) => React.ReactNode;
}

interface RenderCell {
  day: DayKey;
  x: number;
  y: number;
  fill: string;
  title: string;
}

function buildIntensityLookup(
  data: Record<DayKey, number>,
  days: readonly DayKey[],
  ramp: IntensityRamp,
): Map<DayKey, string> {
  const nonZero = days.map((day) => data[day] ?? 0).filter((v) => v > 0);
  const scale = buildIntensityScale(nonZero);
  const fills = new Map<DayKey, string>();
  for (const day of days) {
    const level: IntensityLevel = scale.assign(data[day] ?? 0);
    fills.set(day, intensityColor(level, ramp));
  }
  return fills;
}

function intensityTitle(day: DayKey, count: number): string {
  if (count <= 0) {
    return `${day}: no visits`;
  }
  return `${day}: ${count} visit${count === 1 ? '' : 's'}`;
}

function categoricalTitle(
  day: DayKey,
  entry: { apex: string; visits: number } | undefined,
): string {
  if (entry === undefined) {
    return `${day}: no winner`;
  }
  const { apex, visits } = entry;
  return `${day}: ${apex} (${visits} visit${visits === 1 ? '' : 's'})`;
}

/** Single SVG heatmap primitive for intensity and categorical views (HM-001). */
export function Heatmap(props: HeatmapProps): JSX.Element {
  const { mode, range, onCellHover, renderTooltip } = props;
  const [hoveredDay, setHoveredDay] = useState<DayKey | null>(null);

  const geometry = useMemo(() => computeGeometry(range), [range]);

  const renderCells = useMemo((): RenderCell[] => {
    const days = eachDayInRange(range.start, range.end);

    if (mode.kind === 'intensity') {
      const ramp = mode.ramp ?? PLACEHOLDER_INTENSITY_RAMP;
      const fills = buildIntensityLookup(mode.data, days, ramp);
      return geometry.cells.map((cell) => {
        const count = mode.data[cell.day] ?? 0;
        return {
          day: cell.day,
          x: cell.x,
          y: cell.y,
          fill: fills.get(cell.day) ?? ramp[0],
          title: intensityTitle(cell.day, count),
        };
      });
    }

    return geometry.cells.map((cell) => {
      const entry = mode.data[cell.day];
      const fill = entry === undefined ? EMPTY_CATEGORICAL_COLOR : mode.colorOf(entry.apex);
      return {
        day: cell.day,
        x: cell.x,
        y: cell.y,
        fill,
        title: categoricalTitle(cell.day, entry),
      };
    });
  }, [geometry.cells, mode, range]);

  const hoveredCell = useMemo(
    () => (hoveredDay === null ? null : (renderCells.find((c) => c.day === hoveredDay) ?? null)),
    [hoveredDay, renderCells],
  );

  const notifyHover = useCallback(
    (day: DayKey | null) => {
      setHoveredDay(day);
      onCellHover?.(day);
    },
    [onCellHover],
  );

  const ariaLabel = `Activity heatmap for ${range.start} to ${range.end}`;
  const { cellSize, width, height } = geometry;

  const svg = (
    <svg width={width} height={height} role="img" aria-label={ariaLabel} className="block">
      {geometry.monthLabels.map((label) => (
        <text
          key={`month-${label.weekIndex}`}
          x={label.x}
          y={geometry.gridTop - 4}
          className="fill-muted-foreground text-[10px]"
          dominantBaseline="auto"
        >
          {label.label}
        </text>
      ))}
      {geometry.weekdayLabels.map((label) => (
        <text
          key={`weekday-${label.weekday}`}
          x={geometry.gridLeft - 6}
          y={label.y}
          textAnchor="end"
          dominantBaseline="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {label.label}
        </text>
      ))}
      {renderCells.map((cell) => (
        <rect
          key={cell.day}
          data-day={cell.day}
          x={cell.x}
          y={cell.y}
          width={cellSize}
          height={cellSize}
          fill={cell.fill}
          tabIndex={0}
          className="focus-visible:outline-ring focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1"
          onMouseEnter={() => notifyHover(cell.day)}
          onMouseLeave={() => notifyHover(null)}
          onFocus={() => notifyHover(cell.day)}
          onBlur={() => notifyHover(null)}
        >
          <title>{cell.title}</title>
        </rect>
      ))}
    </svg>
  );

  if (renderTooltip === undefined) {
    return svg;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="relative inline-block">
        {svg}
        {hoveredCell !== null ? (
          <Tooltip open>
            <TooltipTrigger asChild>
              <span
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  left: hoveredCell.x,
                  top: hoveredCell.y,
                  width: cellSize,
                  height: cellSize,
                }}
              />
            </TooltipTrigger>
            <TooltipContent side="top">{renderTooltip(hoveredCell.day)}</TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  );
}
