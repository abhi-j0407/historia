import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { aggregate } from '@/core/aggregate';
import type { Visit } from '@/core/types';

import { WinnersView } from './WinnersView';

vi.mock('@/dashboard/components/Heatmap', () => ({
  Heatmap: ({ mode }: { mode: { kind: string } }) => (
    <div data-testid="heatmap" data-mode={mode.kind} />
  ),
}));

const PINNED_AT = 1_700_000_000_000;

function visit(apexDomain: string, day: string, hour: number): Visit {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return {
    url: `https://${apexDomain}/p`,
    apexDomain,
    title: '',
    visitedAt: new Date(y, m - 1, d, hour, 0, 0, 0).getTime(),
  };
}

function aggregateWithElevenTopSites(): ReturnType<typeof aggregate> {
  const visits: Visit[] = [];
  for (let i = 0; i < 12; i += 1) {
    visits.push(visit(`rank${i}.com`, '2026-05-01', 10 + i));
  }
  return aggregate(visits, PINNED_AT);
}

const agg = aggregateWithElevenTopSites();
const range = { start: agg.dateRange.earliest, end: agg.dateRange.latest };

describe('WinnersView', () => {
  it('renders categorical heatmap and an 11-entry legend with Other last', () => {
    render(<WinnersView aggregate={agg} range={range} />);

    expect(screen.getByTestId('heatmap')).toHaveAttribute('data-mode', 'categorical');
    const legend = screen.getByRole('list', { name: /daily winners legend/i });
    const items = legend.querySelectorAll('li');
    expect(items).toHaveLength(11);
    expect(items[items.length - 1]).toHaveTextContent('Other');
  });
});
