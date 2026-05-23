import { useMemo } from 'react';

import type { Aggregate, DayKey } from '@/core/types';
import { Heatmap } from '@/dashboard/components/Heatmap';
import { StatsCard } from '@/dashboard/components/StatsCard';
import { overallStatsForRange, sliceDailyMap } from '@/dashboard/lib/range-filter';

function formatBusiestDay(busiest: { day: DayKey; visits: number } | null): string {
  if (busiest === null) {
    return '—';
  }
  return `${busiest.day} (${busiest.visits})`;
}

/** Overall daily intensity heatmap and stats (UX-OV-01). */
export function OverallView({
  aggregate,
  range,
}: {
  aggregate: Aggregate;
  range: { start: DayKey; end: DayKey };
}): JSX.Element {
  const dailyTotals = useMemo(
    () => sliceDailyMap(aggregate.totalVisitsPerDay, range.start, range.end),
    [aggregate.totalVisitsPerDay, range.end, range.start],
  );

  const stats = useMemo(
    () => overallStatsForRange(aggregate, range.start, range.end),
    [aggregate, range.end, range.start],
  );

  const statsItems = useMemo(
    () => [
      { label: 'Total visits', value: stats.totalVisits },
      { label: 'Active days', value: stats.activeDays },
      { label: 'Busiest day', value: formatBusiestDay(stats.busiestDay) },
      { label: 'Avg per active day', value: stats.avgPerActiveDay },
      { label: 'Avg per calendar day', value: stats.avgPerCalendarDay },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <Heatmap
        mode={{ kind: 'intensity', data: dailyTotals }}
        range={range}
        renderTooltip={(day) => {
          const visits = dailyTotals[day] ?? 0;
          const suffix = visits === 1 ? '' : 's';
          return `${day} · ${visits} total visit${suffix}`;
        }}
      />
      <StatsCard items={statsItems} />
    </div>
  );
}
