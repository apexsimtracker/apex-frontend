/**
 * Place sector-band boundaries on the telemetry distance axis.
 *
 * Native iRacing sessions store SplitTimeInfo starts (`sectorStartsPct`). Those
 * map directly onto the plotted distance domain and do not drift with line/pace.
 *
 * When starts are absent (F1/LMU, legacy geometric iRacing) or invalid, fall
 * back to reconstructing interior distances from stored sector durations by
 * integrating distance + speed. That path is conservative: standstill,
 * non-monotonic distance, incomplete times, or a reconstructed lap that
 * disagrees with the stored lap omit the overlay instead of inventing 33/66.
 */

export type LapSectorTimes = {
  sectorTimesMs?: readonly (number | null)[];
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  lapTimeMs?: number | null;
};

export type SectorBoundaryOptions = {
  sectorStartsPct?: readonly number[] | null;
};

/** Below this speed the distance/speed time integration is unreliable. */
const MIN_SPEED_KMH = 3;
/** Reconstructed lap time must match the stored lap time within this fraction. */
const RECON_TOLERANCE = 0.05;
const START_ZERO_EPSILON = 0.0001;

function isPositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

/**
 * Valid native layout: at least two starts, first at/near zero, strictly
 * increasing values in [0, 1). Returns the interior starts (excludes 0 and
 * the implied finish at 1), or null when the layout must not be used.
 */
export function interiorNativeStartsPct(
  value: readonly number[] | null | undefined,
): number[] | null {
  if (!value || value.length < 2) return null;
  if (!Number.isFinite(value[0]) || Math.abs(value[0]!) > START_ZERO_EPSILON) {
    return null;
  }
  const interior: number[] = [];
  for (let i = 1; i < value.length; i++) {
    const start = value[i]!;
    const prev = i === 1 ? 0 : value[i - 1]!;
    if (!Number.isFinite(start) || start <= prev || start < 0 || start >= 1) {
      return null;
    }
    interior.push(start);
  }
  return interior;
}

function boundariesFromNativeStarts(
  distanceM: number[],
  startsPct: readonly number[],
): number[] | null {
  const interiors = interiorNativeStartsPct(startsPct);
  if (!interiors) return null;
  const n = distanceM.length;
  if (n < 2) return null;
  const first = distanceM[0]!;
  const last = distanceM[n - 1]!;
  if (!Number.isFinite(first) || !Number.isFinite(last) || last <= first) {
    return null;
  }
  const span = last - first;
  const boundaries = interiors.map((start) => first + start * span);
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i]!;
    if (b <= first || b >= last) return null;
    if (i > 0 && b <= boundaries[i - 1]!) return null;
  }
  return boundaries;
}

/**
 * Interpolate the distance at which cumulative time first reaches `targetMs`.
 * Returns null when the target is never reached.
 */
function distanceAtTime(
  cumTimeMs: number[],
  distanceM: number[],
  targetMs: number,
): number | null {
  for (let i = 1; i < cumTimeMs.length; i++) {
    const t0 = cumTimeMs[i - 1]!;
    const t1 = cumTimeMs[i]!;
    if (t1 >= targetMs) {
      const span = t1 - t0;
      const frac = span > 0 ? (targetMs - t0) / span : 0;
      return distanceM[i - 1]! + frac * (distanceM[i]! - distanceM[i - 1]!);
    }
  }
  return null;
}

function boundariesFromDurations(
  distanceM: number[],
  speedKmh: number[],
  sectors: LapSectorTimes,
): number[] | null {
  const n = distanceM?.length ?? 0;
  if (n < 2 || speedKmh?.length !== n) return null;

  const sectorTimes =
    sectors.sectorTimesMs ??
    [sectors.sector1Ms ?? null, sectors.sector2Ms ?? null, sectors.sector3Ms ?? null];
  const lapTimeMs = sectors.lapTimeMs;
  if (
    sectorTimes.length < 1 ||
    !sectorTimes.every(isPositive) ||
    !isPositive(lapTimeMs)
  ) return null;

  const cumTimeMs = new Array<number>(n);
  cumTimeMs[0] = 0;
  for (let i = 1; i < n; i++) {
    const dDist = distanceM[i]! - distanceM[i - 1]!;
    if (!Number.isFinite(dDist) || dDist < 0) return null;
    const v0 = speedKmh[i - 1]!;
    const v1 = speedKmh[i]!;
    if (!Number.isFinite(v0) || !Number.isFinite(v1)) return null;
    if (v0 < MIN_SPEED_KMH || v1 < MIN_SPEED_KMH) return null;
    const vAvgMs = (v0 + v1) / 2 / 3.6;
    const dtMs = vAvgMs > 0 ? (dDist / vAvgMs) * 1000 : 0;
    cumTimeMs[i] = cumTimeMs[i - 1]! + dtMs;
  }

  const reconTotal = cumTimeMs[n - 1]!;
  if (reconTotal <= 0) return null;
  if (Math.abs(reconTotal - lapTimeMs) / lapTimeMs > RECON_TOLERANCE) return null;

  let cumulative = 0;
  const targets = sectorTimes.slice(0, -1).map((value) => {
    cumulative += value!;
    return cumulative;
  });
  const boundaries: number[] = [];
  for (const target of targets) {
    if (target <= 0 || target >= reconTotal) return null;
    const d = distanceAtTime(cumTimeMs, distanceM, target);
    if (d == null) return null;
    boundaries.push(d);
  }

  const first = distanceM[0]!;
  const last = distanceM[n - 1]!;
  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i]!;
    if (b <= first || b >= last) return null;
    if (i > 0 && b <= boundaries[i - 1]!) return null;
  }

  return boundaries;
}

/**
 * Interior sector boundary distances (meters, same unit as `distanceM`).
 * Prefers native `sectorStartsPct` when valid; otherwise duration reconstruction.
 * Never invents 33/66 geometric splits.
 */
export function computeSectorBoundaryDistances(
  distanceM: number[],
  speedKmh: number[],
  sectors: LapSectorTimes,
  options?: SectorBoundaryOptions,
): number[] | null {
  const native = boundariesFromNativeStarts(
    distanceM,
    options?.sectorStartsPct ?? [],
  );
  if (native) return native;
  return boundariesFromDurations(distanceM, speedKmh, sectors);
}
