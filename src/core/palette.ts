/** Winner-view color assignment (UX-W-02); final hex values land in Phase 16. */

import type { SiteRank } from './types';

// Placeholder grayscale ramp until design pass (Phase 16).
const PLACEHOLDER_PALETTE: readonly string[] = [
  '#111827',
  '#1f2937',
  '#374151',
  '#4b5563',
  '#6b7280',
  '#9ca3af',
  '#a8a29e',
  '#d1d5db',
  '#d4d4d8',
  '#e5e7eb',
  '#f3f4f6',
] as const;

export interface WinnerPalette {
  colorOf(apex: string): string;
  legend: readonly { color: string; apex: string | null }[];
}

/** Maps top sites to a deterministic 11-slot palette (UX-W-02). */
export function buildWinnerPalette(topSites: readonly SiteRank[]): WinnerPalette {
  const ranked = topSites.slice(0, 10);
  const rankByApex = new Map(ranked.map((site, index) => [site.apexDomain, index]));
  const otherColor = PLACEHOLDER_PALETTE[10]!;

  const legend: { color: string; apex: string | null }[] = ranked.map((site, index) => ({
    color: PLACEHOLDER_PALETTE[index]!,
    apex: site.apexDomain,
  }));
  legend.push({ color: otherColor, apex: null });

  return {
    colorOf(apex: string): string {
      const rank = rankByApex.get(apex);
      return rank === undefined ? otherColor : PLACEHOLDER_PALETTE[rank]!;
    },
    legend,
  };
}
