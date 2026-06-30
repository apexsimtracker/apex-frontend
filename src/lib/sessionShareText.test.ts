import { describe, expect, it } from "vitest";
import {
  buildSessionShareText,
  calcConsistencyScore,
  sanitizeLapTimesForConsistency,
} from "./sessionShareText";

/** Mirror backend consistencyPct for cross-check (see apex/src/lib/sessionLapStats.ts). */
function backendConsistencyPct(lapTimes: number[]): number | null {
  const CONSISTENCY_GAP_TIERS = [
    { maxGapSec: 0.2, score: 97.5 },
    { maxGapSec: 0.3, score: 90 },
    { maxGapSec: 0.4, score: 82.5 },
    { maxGapSec: 0.5, score: 77.5 },
    { maxGapSec: 0.8, score: 70 },
    { maxGapSec: 1.0, score: 55 },
    { maxGapSec: 1.2, score: 45 },
    { maxGapSec: 1.5, score: 30 },
    { maxGapSec: 2.0, score: 20 },
    { maxGapSec: 3.0, score: 10 },
  ];
  function lapConsistencyScore(gapToBestSec: number): number {
    if (gapToBestSec <= 0) return 100;
    for (const tier of CONSISTENCY_GAP_TIERS) {
      if (gapToBestSec <= tier.maxGapSec) return tier.score;
    }
    return 5;
  }

  const laps = lapTimes.filter((ms) => Number.isFinite(ms) && ms > 0);
  if (laps.length < 3) return null;
  const bestLapMs = Math.min(...laps);
  if (bestLapMs <= 0) return null;
  const scores = laps.map((lap) =>
    lapConsistencyScore((lap - bestLapMs) / 1000),
  );
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.max(0, Math.min(100, avg));
}

describe("calcConsistencyScore", () => {
  it("returns null when fewer than 3 positive laps", () => {
    expect(calcConsistencyScore([])).toBeNull();
    expect(calcConsistencyScore([90_000, 0, NaN])).toBeNull();
    expect(calcConsistencyScore([90_000, 91_000])).toBeNull();
  });

  it("matches backend formula (rounded for display)", () => {
    const laps = [90_000, 90_200, 90_300, 91_000];
    const backend = backendConsistencyPct(laps);
    const frontend = calcConsistencyScore(laps);
    expect(backend).not.toBeNull();
    expect(frontend).toBe(Math.round(backend!));
  });

  it("scores moderate stints stricter than old CV formula would", () => {
    const laps = [100_000, 100_350, 100_450, 100_500];
    const score = calcConsistencyScore(laps);
    expect(score).not.toBeNull();
    expect(score!).toBeLessThan(90);
  });

  it("returns 100 for identical laps", () => {
    expect(calcConsistencyScore([90_000, 90_000, 90_000])).toBe(100);
  });

  it("sanitizeLapTimesForConsistency drops invalid times", () => {
    expect(
      sanitizeLapTimesForConsistency([100_000, 0, -5, NaN, 100_100]),
    ).toEqual([100_000, 100_100]);
  });
});

describe("buildSessionShareText", () => {
  it("uses Sprint label for SPRINT telemetry sessions", () => {
    const text = buildSessionShareText({
      sessionType: "SPRINT",
      trackName: "Monza",
      carName: "Ferrari",
      lapCount: 10,
      bestLapMs: 90_000,
      laps: [{ timeMs: 90_000 }, { timeMs: 90_100 }, { timeMs: 90_200 }],
    });
    expect(text.split("\n")[0]).toBe("Apex — Sprint @ Monza");
  });

  it("uses manualSessionKind label for MANUAL_ACTIVITY rows", () => {
    const text = buildSessionShareText({
      sessionType: "MANUAL_ACTIVITY",
      manualSessionKind: "QUALIFY",
      trackName: "Spa",
      carName: "GT3",
      lapCount: 5,
      bestLapMs: 120_000,
      laps: [{ timeMs: 120_000 }, { timeMs: 120_500 }, { timeMs: 121_000 }],
    });
    expect(text.split("\n")[0]).toMatch(/^Apex — Qualifying @ /);
  });
});
