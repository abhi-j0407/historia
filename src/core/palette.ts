/** Winner-view color assignment (UX-W-02); hex constants only (FR-S-01). */

import type { SiteRank } from './types';

/** Eleven-slot categorical ramp: ranks 1–10 plus neutral Other (index 10). */
export const WINNER_PALETTE: readonly string[] = [
  '#7A4E2A',
  '#2F6B4F',
  '#1F5C8C',
  '#9C2B30',
  '#5C3D8C',
  '#0B7285',
  '#B45309',
  '#4A6B5C',
  '#7C3AED',
  '#C2410C',
  '#8A8478',
] as const;

export interface WinnerPalette {
  colorOf(apex: string): string;
  legend: readonly { color: string; apex: string | null }[];
}

/** Maps top sites to a deterministic 11-slot palette (UX-W-02). */
export function buildWinnerPalette(topSites: readonly SiteRank[]): WinnerPalette {
  const ranked = topSites.slice(0, 10);
  const rankByApex = new Map(ranked.map((site, index) => [site.apexDomain, index]));
  const otherColor = WINNER_PALETTE[10]!;

  const legend: { color: string; apex: string | null }[] = ranked.map((site, index) => ({
    color: WINNER_PALETTE[index]!,
    apex: site.apexDomain,
  }));
  legend.push({ color: otherColor, apex: null });

  return {
    colorOf(apex: string): string {
      const rank = rankByApex.get(apex);
      return rank === undefined ? otherColor : WINNER_PALETTE[rank]!;
    },
    legend,
  };
}
