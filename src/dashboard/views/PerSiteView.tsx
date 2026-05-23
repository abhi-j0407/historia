import { useMemo } from 'react';

import type { Aggregate, DayKey } from '@/core/types';
import { Heatmap } from '@/dashboard/components/Heatmap';
import { SiteSwitcher } from '@/dashboard/components/SiteSwitcher';
import { StatsCard } from '@/dashboard/components/StatsCard';
import { siteStatsForRange, sliceDailyMap } from '@/dashboard/lib/range-filter';

function formatBusiestDay(busiest: { day: DayKey; visits: number } | null): string {
  if (busiest === null) {
    return '—';
  }
  return `${busiest.day} (${busiest.visits})`;
}

/** Per-site intensity heatmap, switcher, and stats (UX-PS-01). */
export function PerSiteView({
  aggregate,
  range,
  selectedApex,
  onSelectApex,
}: {
  aggregate: Aggregate;
  range: { start: DayKey; end: DayKey };
  selectedApex: string;
  onSelectApex: (apex: string) => void;
}): JSX.Element {
  const siteDaily = useMemo(
    () => sliceDailyMap(aggregate.visitsPerSitePerDay[selectedApex] ?? {}, range.start, range.end),
    [aggregate.visitsPerSitePerDay, range.end, range.start, selectedApex],
  );

  const stats = useMemo(
    () => siteStatsForRange(aggregate, selectedApex, range.start, range.end),
    [aggregate, range.end, range.start, selectedApex],
  );

  const statsItems = useMemo(
    () => [
      { label: 'Total visits', value: stats.totalVisits },
      { label: 'Active days', value: stats.activeDays },
      { label: 'Longest streak', value: stats.longestStreak },
      { label: 'Busiest day', value: formatBusiestDay(stats.busiestDay) },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <SiteSwitcher
        topSites={aggregate.topSites}
        selectedApex={selectedApex}
        onSelect={onSelectApex}
      />
      <Heatmap
        mode={{ kind: 'intensity', data: siteDaily }}
        range={range}
        renderTooltip={(day) => {
          const visits = siteDaily[day] ?? 0;
          const suffix = visits === 1 ? '' : 's';
          return `${day} · ${visits} visit${suffix} to ${selectedApex}`;
        }}
      />
      <StatsCard items={statsItems} />
    </div>
  );
}
