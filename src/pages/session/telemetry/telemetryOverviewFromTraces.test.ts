import { describe, expect, it } from "vitest";
import { telemetryOverviewFromTraces } from "./telemetryOverviewHelpers";
import type { TelemetryTracesResponse } from "@/features/telemetry-analysis/types";

function traces(
  partial: Partial<TelemetryTracesResponse>,
): TelemetryTracesResponse {
  return {
    lapNumber: 1,
    lapTimeMs: 90_000,
    isValid: true,
    isBestLap: true,
    distanceM: [],
    speedKmh: [],
    throttlePct: [],
    brakePct: [],
    gear: [],
    ...partial,
  };
}

describe("telemetryOverviewFromTraces", () => {
  it("computes top gear distance share from distance-aligned gears", () => {
    const result = telemetryOverviewFromTraces(
      traces({
        speedKmh: [100, 120, 140],
        brakePct: [10, 20, 0],
        distanceM: [0, 100, 300, 400],
        gear: [3, 4, 6, 6],
      }),
    );
    expect(result.highestGear).toBe(6);
    // deltas: 100 (gear4) + 200 (gear6) + 100 (gear6) → top gear 300/400 = 75%
    expect(result.topGearDistancePct).toBeCloseTo(75, 5);
    expect(result.topSpeedKmh).toBe(140);
    expect(result.avgBrakePct).toBeCloseTo(10, 5);
  });

  it("returns nulls when traces are empty", () => {
    expect(telemetryOverviewFromTraces(null)).toEqual({
      topSpeedKmh: null,
      avgBrakePct: null,
      highestGear: null,
      topGearDistancePct: null,
    });
  });
});
