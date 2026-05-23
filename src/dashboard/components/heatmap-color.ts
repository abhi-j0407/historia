/** Placeholder intensity ramp until Phase 16 design pass (HM-002). */

import type { IntensityLevel } from '@/core/intensity';

export interface IntensityRamp {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

export const PLACEHOLDER_INTENSITY_RAMP: IntensityRamp = {
  0: '#f4f4f5',
  1: '#d4d4d8',
  2: '#a1a1aa',
  3: '#71717a',
  4: '#52525b',
  5: '#27272a',
};

/** Maps HM-003 intensity level to a fill color. */
export function intensityColor(
  level: IntensityLevel,
  ramp: IntensityRamp = PLACEHOLDER_INTENSITY_RAMP,
): string {
  return ramp[level];
}
