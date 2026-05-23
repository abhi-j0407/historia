/** Intensity ramp for heatmap fills (HM-002). Hex lives here and in core palette only. */

import type { IntensityLevel } from '@/core/intensity';

export interface IntensityRamp {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
}

/** Warm copper ramp: empty bucket + five visit-intensity steps on light paper. */
export const INTENSITY_RAMP: IntensityRamp = {
  0: '#F5F0E8',
  1: '#D2A876',
  2: '#C49252',
  3: '#B8895A',
  4: '#8F5C2E',
  5: '#5C3A1A',
};

/** Maps HM-003 intensity level to a fill color. */
export function intensityColor(
  level: IntensityLevel,
  ramp: IntensityRamp = INTENSITY_RAMP,
): string {
  return ramp[level];
}
