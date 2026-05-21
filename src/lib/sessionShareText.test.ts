import { describe, expect, it } from "vitest";
import {
  calcConsistencyScore,
  sanitizeLapTimesForConsistency,
} from "./sessionShareText";

/** Mirror backend consistencyPct for cross-check (see apex/src/lib/sessionLapStats.ts). */
function backendConsistencyPct(lapTimes: number[]): number | null {
  const laps = lapTimes.filter((ms) => Number.isFinite(ms) && ms > 0);
  if (laps.length < 3) return null;
  const mean = laps.reduce((a, b) => a + b, 0) / laps.length;
  if (mean <= 0) return null;
  const variance =
    laps.reduce((sum, t) => sum + (t - mean) ** 2, 0) / laps.length;
  const stdDev = Math.sqrt(variance);
  const pct = 100 - (stdDev / mean) * 100;
  return Math.max(0, Math.min(100, pct));
}

describe("calcConsistencyScore", () => {
  it("returns null when fewer than 3 positive laps", () => {
    expect(calcConsistencyScore([])).toBeNull();
    expect(calcConsistencyScore([90_000, 0, NaN])).toBeNull();
    expect(calcConsistencyScore([90_000, 91_000])).toBeNull();
  });

  it("matches backend formula (rounded for display)", () => {
    const laps = [100_000, 100_500, 99_900];
    const backend = backendConsistencyPct(laps);
    const frontend = calcConsistencyScore(laps);
    expect(backend).not.toBeNull();
    expect(frontend).toBe(Math.round(backend!));
  });

  it("does not use the old CV×4000 scale (would score ~90 on tight laps)", () => {
    const laps = [100_000, 100_500, 99_900];
    const score = calcConsistencyScore(laps);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(99);
  });

  it("sanitizeLapTimesForConsistency drops invalid times", () => {
    expect(sanitizeLapTimesForConsistency([100_000, 0, -5, NaN, 100_100])).toEqual([
      100_000,
      100_100,
    ]);
  });
});
