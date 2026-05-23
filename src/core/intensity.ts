/** Intensity bucketing for heatmap cells (HM-003). */

export type IntensityLevel = 0 | 1 | 2 | 3 | 4 | 5;

export interface IntensityScale {
  quantiles: readonly [number, number, number, number];
  assign: (v: number) => IntensityLevel;
}

function quantileType7(sorted: readonly number[], p: number): number {
  const n = sorted.length;
  const h = (n - 1) * p + 1;
  const j = Math.floor(h);
  const gamma = h - j;
  const lower = sorted[j - 1]!;
  /* v8 ignore next 3 */
  if (j >= n) {
    return lower;
  }
  const upper = sorted[j]!;
  return lower * (1 - gamma) + upper * gamma;
}

function buildQuantiles(positiveValues: readonly number[]): [number, number, number, number] {
  const distinct = [...new Set(positiveValues)].sort((a, b) => a - b);
  if (distinct.length < 5) {
    const max = distinct[distinct.length - 1]!;
    const slots: number[] = [];
    for (let i = 0; i < 4; i += 1) {
      slots.push(i < distinct.length ? distinct[i]! : max);
    }
    return slots as [number, number, number, number];
  }
  const sorted = [...positiveValues].sort((a, b) => a - b);
  return [
    quantileType7(sorted, 0.2),
    quantileType7(sorted, 0.4),
    quantileType7(sorted, 0.6),
    quantileType7(sorted, 0.8),
  ];
}

function makeAssign(
  quantiles: readonly [number, number, number, number],
): (v: number) => IntensityLevel {
  const [q0, q1, q2, q3] = quantiles;
  return (v: number): IntensityLevel => {
    if (v <= 0) {
      return 0;
    }
    if (v <= q0) {
      return 1;
    }
    if (v <= q1) {
      return 2;
    }
    if (v <= q2) {
      return 3;
    }
    if (v <= q3) {
      return 4;
    }
    return 5;
  };
}

/** Builds HM-003 quantile buckets from non-zero day values in the rendered range. */
export function buildIntensityScale(nonZeroValues: readonly number[]): IntensityScale {
  const positive = nonZeroValues.filter((v) => v > 0);
  const distinctCount = new Set(positive).size;
  if (distinctCount === 0) {
    const quantiles: [number, number, number, number] = [0, 0, 0, 0];
    return { quantiles, assign: () => 0 };
  }
  const quantiles = buildQuantiles(positive);
  return { quantiles, assign: makeAssign(quantiles) };
}
