/**
 * Light isolated-sample clip for throttle/brake charts.
 * Matches ingest clip in apex/src/telemetry/downsampleTraces.ts so already-stored
 * max-pooled traces do not render a single noisy sample as a 0→100 input.
 * Gear is discrete and is not clipped.
 */

export const PEDAL_ISLAND_GAP_PCT = 40;
export const PEDAL_NEIGHBOR_AGREE_PCT = 15;

export function clipIsolatedPedalIslands(values: readonly number[]): number[] {
  const n = values.length;
  const out = values.slice();
  if (n < 3) return out;
  for (let i = 1; i < n - 1; i++) {
    const prev = values[i - 1]!;
    const cur = values[i]!;
    const next = values[i + 1]!;
    if (
      Math.abs(cur - prev) >= PEDAL_ISLAND_GAP_PCT &&
      Math.abs(cur - next) >= PEDAL_ISLAND_GAP_PCT &&
      Math.abs(prev - next) <= PEDAL_NEIGHBOR_AGREE_PCT
    ) {
      out[i] = (prev + next) / 2;
    }
  }
  return out;
}

type PedalSeries = {
  throttlePct?: number[];
  brakePct?: number[];
};

/** Copy-on-write clip of pedal channels; leaves other fields on `series` as-is. */
export function clipPedalChannels<T>(series: T): T {
  const pedals = series as T & PedalSeries;
  const next = { ...pedals };
  if (pedals.throttlePct) {
    next.throttlePct = clipIsolatedPedalIslands(pedals.throttlePct);
  }
  if (pedals.brakePct) {
    next.brakePct = clipIsolatedPedalIslands(pedals.brakePct);
  }
  return next as T;
}
