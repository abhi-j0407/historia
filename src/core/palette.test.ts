import { describe, expect, it } from 'vitest';

import { buildWinnerPalette } from './palette';
import type { SiteRank } from './types';

function rankedSites(count: number): SiteRank[] {
  return Array.from({ length: count }, (_, i) => ({
    apexDomain: `site${i}.com`,
    totalVisits: count - i,
    activeDays: count - i,
  }));
}

describe('buildWinnerPalette', () => {
  it('assigns stable colors by rank across calls', () => {
    const top = rankedSites(3);
    const a = buildWinnerPalette(top).colorOf('site0.com');
    const b = buildWinnerPalette(top).colorOf('site0.com');
    const other = buildWinnerPalette(top).colorOf('site1.com');
    expect(a).toBe(b);
    expect(a).not.toBe(other);
  });

  it('maps sites outside the top 10 to the Other swatch', () => {
    const palette = buildWinnerPalette(rankedSites(12));
    const other = palette.colorOf('site10.com');
    expect(palette.colorOf('site11.com')).toBe(other);
    expect(palette.colorOf('unknown.com')).toBe(other);
  });

  it('exposes an 11-entry legend with null apex on the Other slot', () => {
    const { legend } = buildWinnerPalette(rankedSites(12));
    expect(legend).toHaveLength(11);
    expect(legend[10]?.apex).toBeNull();
  });
});
