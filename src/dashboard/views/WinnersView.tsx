import { useMemo } from 'react';

import { buildWinnerPalette } from '@/core/palette';
import type { Aggregate, DayKey } from '@/core/types';
import { Favicon } from '@/dashboard/components/Favicon';
import { Heatmap } from '@/dashboard/components/Heatmap';
import {
  dailyWinnersInRange,
  runnerUpForDay,
  winnerCountsForRange,
} from '@/dashboard/lib/range-filter';

/** Daily winners categorical heatmap and legend (UX-W-01). */
export function WinnersView({
  aggregate,
  range,
}: {
  aggregate: Aggregate;
  range: { start: DayKey; end: DayKey };
}): JSX.Element {
  const winnersByDay = useMemo(
    () => dailyWinnersInRange(aggregate, range.start, range.end),
    [aggregate, range.end, range.start],
  );

  const categoricalData = useMemo(() => {
    const data: Record<DayKey, { apex: string; visits: number }> = {};
    for (const [day, winner] of Object.entries(winnersByDay)) {
      data[day] = { apex: winner.apexDomain, visits: winner.visits };
    }
    return data;
  }, [winnersByDay]);

  const palette = useMemo(() => buildWinnerPalette(aggregate.topSites), [aggregate.topSites]);

  const winCounts = useMemo(
    () => winnerCountsForRange(aggregate, range.start, range.end),
    [aggregate, range.end, range.start],
  );

  const topTenApexes = useMemo(
    () => new Set(aggregate.topSites.slice(0, 10).map((s) => s.apexDomain)),
    [aggregate.topSites],
  );

  const otherDaysWon = useMemo(() => {
    let total = 0;
    for (const [apex, count] of Object.entries(winCounts)) {
      if (!topTenApexes.has(apex)) {
        total += count;
      }
    }
    return total;
  }, [topTenApexes, winCounts]);

  return (
    <div className="space-y-6">
      <Heatmap
        mode={{
          kind: 'categorical',
          data: categoricalData,
          colorOf: (apex) => palette.colorOf(apex),
        }}
        range={range}
        renderTooltip={(day) => {
          const winner = winnersByDay[day];
          if (winner === undefined) {
            return `${day} · winner: — · runner-up: —`;
          }
          const runner = runnerUpForDay(aggregate, day, winner.apexDomain);
          const runnerText = runner === null ? '—' : `${runner.apexDomain} (${runner.visits})`;
          return `${day} · winner: ${winner.apexDomain} (${winner.visits}) · runner-up: ${runnerText}`;
        }}
      />
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="Daily winners legend">
        {palette.legend.map((entry) => {
          const label = entry.apex ?? 'Other';
          const daysWon = entry.apex === null ? otherDaysWon : (winCounts[entry.apex] ?? 0);
          return (
            <li key={label} className="flex items-center gap-2 text-sm">
              <span
                className="border-border size-4 shrink-0 rounded-sm border"
                style={{ backgroundColor: entry.color }}
                aria-hidden
              />
              {entry.apex !== null ? <Favicon apex={entry.apex} size={16} /> : null}
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <span className="text-muted-foreground tabular-nums">{daysWon}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
