import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { aggregate } from '@/core/aggregate';

import { syntheticVisits } from '../../../tests/fixtures/synthetic-history';
import { PerSiteView } from './PerSiteView';

vi.mock('@/dashboard/components/Heatmap', () => ({
  Heatmap: ({ mode }: { mode: { kind: string } }) => (
    <div data-testid="heatmap" data-mode={mode.kind} />
  ),
}));

const PINNED_AT = 1_700_000_000_000;
const agg = aggregate(syntheticVisits(), PINNED_AT);
const range = { start: agg.dateRange.earliest, end: agg.dateRange.latest };

describe('PerSiteView', () => {
  it('renders intensity heatmap and four stats items', () => {
    render(
      <PerSiteView
        aggregate={agg}
        range={range}
        selectedApex="google.com"
        onSelectApex={vi.fn()}
      />,
    );

    expect(screen.getByTestId('heatmap')).toHaveAttribute('data-mode', 'intensity');
    expect(screen.getByText('Total visits')).toBeInTheDocument();
    expect(screen.getByText('Longest streak')).toBeInTheDocument();
    expect(screen.getAllByRole('definition')).toHaveLength(4);
  });

  it('shows different total visits when selectedApex changes', () => {
    const { rerender } = render(
      <PerSiteView
        aggregate={agg}
        range={range}
        selectedApex="google.com"
        onSelectApex={vi.fn()}
      />,
    );
    const statsDl = screen.getByText('Total visits').closest('dl')!;
    expect(within(statsDl).getByText('30')).toBeInTheDocument();

    rerender(
      <PerSiteView
        aggregate={agg}
        range={range}
        selectedApex="github.com"
        onSelectApex={vi.fn()}
      />,
    );
    const githubStats = screen.getByText('Total visits').closest('dl')!;
    expect(within(githubStats).getByText('16')).toBeInTheDocument();
    expect(within(githubStats).queryByText('30')).not.toBeInTheDocument();
  });
});
