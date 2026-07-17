/**
 * Derive sector-distance boundaries from ACTUAL lap telemetry.
 *
 * Telemetry is stored as distance/speed channels with no per-sample time, and
 * sectors are stored only as durations (sector1Ms/2/3Ms). To place sector
 * boundaries on the distance x-axis we reconstruct cumulative lap time by
 * integrating the real distance + speed channels, then find the distances where
 * cumulative time crosses the real sector times.
 *
 * This is intentionally conservative: if the reconstruction cannot be trusted
 * (missing/incomplete sector times, a standstill that makes the distance/speed
 * integration blow up, non-monotonic distance, or a reconstructed lap time that
 * disagrees with the stored lap time), it returns null so the caller omits the
 * overlay instead of drawing wrong bands.
 */

export type LapSectorTimes = {
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  lapTimeMs?: number | null;
};

/** Below this speed the distance/speed time integration is unreliable. */
const MIN_SPEED_KMH = 3;
/** Reconstructed lap time must match the stored lap time within this fraction. */
const RECON_TOLERANCE = 0.05;

function isPositive(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
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

/**
 * Returns the interior sector boundary distances (in meters, same unit as the
 * `distanceM` input) — end of sector 1 and end of sector 2 — or null when the
 * data cannot be trusted.
 */
export function computeSectorBoundaryDistances(
  distanceM: number[],
  speedKmh: number[],
  sectors: LapSectorTimes,
): number[] | null {
  const n = distanceM?.length ?? 0;
  if (n < 2 || speedKmh?.length !== n) return null;

  const s1 = sectors.sector1Ms;
  const s2 = sectors.sector2Ms;
  const lapTimeMs = sectors.lapTimeMs;
  // Two interior boundaries require at least S1 and S2, plus a lap time to
  // validate the reconstruction against.
  if (!isPositive(s1) || !isPositive(s2) || !isPositive(lapTimeMs)) return null;

  const cumTimeMs = new Array<number>(n);
  cumTimeMs[0] = 0;
  for (let i = 1; i < n; i++) {
    const dDist = distanceM[i]! - distanceM[i - 1]!;
    if (!Number.isFinite(dDist) || dDist < 0) return null; // non-monotonic distance
    const v0 = speedKmh[i - 1]!;
    const v1 = speedKmh[i]!;
    if (!Number.isFinite(v0) || !Number.isFinite(v1)) return null;
    if (v0 < MIN_SPEED_KMH || v1 < MIN_SPEED_KMH) return null; // standstill / pit
    const vAvgMs = (v0 + v1) / 2 / 3.6; // km/h -> m/s
    const dtMs = vAvgMs > 0 ? (dDist / vAvgMs) * 1000 : 0;
    cumTimeMs[i] = cumTimeMs[i - 1]! + dtMs;
  }

  const reconTotal = cumTimeMs[n - 1]!;
  if (reconTotal <= 0) return null;
  if (Math.abs(reconTotal - lapTimeMs) / lapTimeMs > RECON_TOLERANCE) return null;

  const targets = [s1, s1 + s2];
  const boundaries: number[] = [];
  for (const target of targets) {
    if (target <= 0 || target >= reconTotal) return null; // must be interior
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
