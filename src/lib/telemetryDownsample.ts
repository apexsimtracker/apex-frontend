/**
 * Aligned LTTB downsampling for multi-channel telemetry keyed by distance.
 * Channels share the same index set so overlays stay synchronized.
 */

export const DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET = 800;

export type AlignedTelemetrySeries = {
  distanceM: number[];
  [channel: string]: number[] | undefined;
};

/**
 * Largest-Triangle-Three-Buckets on an x/y series. Returns selected indices
 * (always includes first and last).
 */
export function lttbIndices(
  x: number[],
  y: number[],
  targetPoints: number,
): number[] {
  const n = x.length;
  if (n === 0) return [];
  if (targetPoints <= 0 || n <= targetPoints) {
    return Array.from({ length: n }, (_, i) => i);
  }
  if (targetPoints === 1) return [0];
  if (targetPoints === 2) return [0, n - 1];

  const indices: number[] = [0];
  const bucketSize = (n - 2) / (targetPoints - 2);
  let a = 0;

  for (let i = 0; i < targetPoints - 2; i++) {
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(
      Math.floor((i + 2) * bucketSize) + 1,
      n - 1,
    );
    const avgRangeLength = Math.max(avgRangeEnd - avgRangeStart, 1);

    let avgX = 0;
    let avgY = 0;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += x[j]!;
      avgY += y[j]!;
    }
    avgX /= avgRangeLength;
    avgY /= avgRangeLength;

    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketSize) + 1, n - 1);

    const pointAX = x[a]!;
    const pointAY = y[a]!;

    let maxArea = -1;
    let nextA = rangeOffs;

    for (let j = rangeOffs; j < rangeTo; j++) {
      const area =
        Math.abs(
          (pointAX - avgX) * (y[j]! - pointAY) -
            (pointAX - x[j]!) * (avgY - pointAY),
        ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        nextA = j;
      }
    }

    indices.push(nextA);
    a = nextA;
  }

  indices.push(n - 1);
  return indices;
}

/**
 * Trim a trailing distance "wrap" so the distance series is usable as a
 * monotonic x-axis. Some sims (e.g. LMU) include a few samples past the
 * start/finish line where Lap Dist resets to ~0, producing a non-monotonic
 * array that collapses uPlot's numeric x-scale. We keep everything up to and
 * including the peak-distance sample and drop the trailing wrap, slicing every
 * aligned channel identically so overlays stay in sync. No-op when distance is
 * already monotonic (peak is the last sample), e.g. iRacing.
 */
export function clampToMonotonicDistance(
  series: AlignedTelemetrySeries,
): AlignedTelemetrySeries {
  const distanceM = series.distanceM;
  if (!Array.isArray(distanceM) || distanceM.length < 2) return series;

  let peakIdx = 0;
  let peak = distanceM[0]!;
  for (let i = 1; i < distanceM.length; i++) {
    if (distanceM[i]! > peak) {
      peak = distanceM[i]!;
      peakIdx = i;
    }
  }

  if (peakIdx >= distanceM.length - 1) return series;

  const end = peakIdx + 1;
  const out: AlignedTelemetrySeries = { distanceM: distanceM.slice(0, end) };
  for (const [key, values] of Object.entries(series)) {
    if (key === "distanceM" || values == null) continue;
    out[key] = values.slice(0, end);
  }
  return out;
}

/**
 * Linearly resample a source channel onto a target distance grid so a
 * comparison lap can be overlaid on the primary lap's x-axis. Both distance
 * arrays must be ascending. Target points outside the source distance range
 * return NaN so uPlot renders a gap rather than an invented value.
 */
export function resampleChannelToGrid(
  srcDistance: number[],
  srcValues: number[],
  targetDistance: number[],
): number[] {
  const out = new Array<number>(targetDistance.length).fill(NaN);
  const n = srcDistance.length;
  if (n === 0 || srcValues.length !== n) return out;

  let j = 0;
  for (let i = 0; i < targetDistance.length; i++) {
    const x = targetDistance[i]!;
    const first = srcDistance[0]!;
    const last = srcDistance[n - 1]!;
    if (x < first || x > last) {
      out[i] = NaN;
      continue;
    }
    if (x === first) {
      out[i] = srcValues[0]!;
      continue;
    }
    if (x === last) {
      out[i] = srcValues[n - 1]!;
      continue;
    }
    while (j < n - 1 && srcDistance[j + 1]! < x) j++;
    const x0 = srcDistance[j]!;
    const x1 = srcDistance[j + 1]!;
    const span = x1 - x0;
    const frac = span > 0 ? (x - x0) / span : 0;
    out[i] = srcValues[j]! + frac * (srcValues[j + 1]! - srcValues[j]!);
  }
  return out;
}

function pickPrimaryY(series: AlignedTelemetrySeries): number[] {
  if (series.speedKmh && series.speedKmh.length === series.distanceM.length) {
    return series.speedKmh;
  }
  for (const [key, values] of Object.entries(series)) {
    if (key === "distanceM") continue;
    if (Array.isArray(values) && values.length === series.distanceM.length) {
      return values;
    }
  }
  return series.distanceM;
}

/**
 * Downsample all aligned channels by a shared LTTB index set (driven by
 * distance vs primary channel, usually speed). Returns originals when
 * length <= target.
 */
export function downsampleAlignedTelemetry(
  series: AlignedTelemetrySeries,
  targetPoints: number = DEFAULT_TELEMETRY_DOWNSAMPLE_TARGET,
): AlignedTelemetrySeries {
  const distanceM = series.distanceM;
  if (!Array.isArray(distanceM) || distanceM.length === 0) {
    return { distanceM: [] };
  }

  const n = distanceM.length;
  for (const [key, values] of Object.entries(series)) {
    if (key === "distanceM") continue;
    if (values != null && values.length !== n) {
      throw new Error(
        `Channel "${key}" length ${values.length} does not match distanceM length ${n}`,
      );
    }
  }

  if (n <= targetPoints) {
    return series;
  }

  const y = pickPrimaryY(series);
  const indices = lttbIndices(distanceM, y, targetPoints);

  const out: AlignedTelemetrySeries = {
    distanceM: indices.map((i) => distanceM[i]!),
  };

  for (const [key, values] of Object.entries(series)) {
    if (key === "distanceM" || values == null) continue;
    out[key] = indices.map((i) => values[i]!);
  }

  return out;
}
