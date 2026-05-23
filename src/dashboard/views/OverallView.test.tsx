import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { aggregate } from '@/core/aggregate';

import { syntheticVisits } from '../../../tests/fixtures/synthetic-history';
import { OverallView } from './OverallView';

vi.mock('@/dashboard/components/Heatmap', () => ({
  Heatmap: ({ mode }: { mode: { kind: string } }) => (
    <div data-testid="heatmap" data-mode={mode.kind} />
  ),
}));

const PINNED_AT = 1_700_000_000_000;
const agg = aggregate(syntheticVisits(), PINNED_AT);
const range = { start: agg.dateRange.earliest, end: agg.dateRange.latest };

describe('OverallView', () => {
  it('renders intensity heatmap and five stats items', () => {
    render(<OverallView aggregate={agg} range={range} />);

    expect(screen.getByTestId('heatmap')).toHaveAttribute('data-mode', 'intensity');
    expect(screen.getByText('Avg per calendar day')).toBeInTheDocument();
    expect(screen.getAllByRole('definition')).toHaveLength(5);
  });
});
