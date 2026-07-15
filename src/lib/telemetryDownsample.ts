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
