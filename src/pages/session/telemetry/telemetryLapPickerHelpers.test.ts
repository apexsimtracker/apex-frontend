import { describe, expect, it } from "vitest";
import type { TelemetryLapSummary } from "@/features/telemetry-analysis/types";

/** Mirrors TelemetryLapPicker compare option filtering. */
function compareOptionsFor(
  laps: TelemetryLapSummary[],
  selectedLap: number | null
): TelemetryLapSummary[] {
  return laps
    .filter((l) => l.lapNumber !== selectedLap && l.hasTraces)
    .sort((a, b) => a.lapNumber - b.lapNumber);
}

/** Prefer best non-out-lap for default selection. */
function defaultTimedLapNumber(laps: TelemetryLapSummary[]): number | null {
  return (
    laps.find((l) => l.isBestLap && !l.isOutLap)?.lapNumber ??
    laps.find((l) => l.isValid && !l.isOutLap)?.lapNumber ??
    null
  );
}

function buildLaps(count: number): TelemetryLapSummary[] {
  return Array.from({ length: count }, (_, i) => ({
    lapNumber: i + 1,
    lapTimeMs: 90_000 + i * 100,
    isValid: i !== 0,
    isBestLap: i === 2,
    hasTraces: true,
    hasFuel: false,
    hasTyres: false,
    isOutLap: i === 0,
  }));
}

describe("telemetry lap picker selection helpers", () => {
  it("keeps out-laps selectable but excludes them from defaults", () => {
    const laps = buildLaps(60);
    expect(laps).toHaveLength(60);
    expect(laps[0]?.isOutLap).toBe(true);
    expect(defaultTimedLapNumber(laps)).toBe(3);
    expect(compareOptionsFor(laps, 3).some((l) => l.lapNumber === 1)).toBe(true);
    expect(compareOptionsFor(laps, 3).some((l) => l.lapNumber === 3)).toBe(
      false
    );
  });

  it("clears compare when it equals selected", () => {
    let compare: number | null = 5;
    const selected = 5;
    if (compare != null && compare === selected) compare = null;
    expect(compare).toBeNull();
  });
});
