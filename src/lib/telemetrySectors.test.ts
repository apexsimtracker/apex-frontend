import { describe, expect, it } from "vitest";
import { computeSectorBoundaryDistances } from "./telemetrySectors";

// Constant 36 km/h = 10 m/s. 11 samples, 0..1000 m in 100 m steps.
// cumTime = distance / 10 m/s => 100 ms per meter, so 1000 m == 100_000 ms.
const distanceM = Array.from({ length: 11 }, (_, i) => i * 100);
const speedKmh = distanceM.map(() => 36);

describe("computeSectorBoundaryDistances", () => {
  it("locates boundaries from real distance + speed for a valid lap", () => {
    const result = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sector1Ms: 30_000,
      sector2Ms: 30_000,
      sector3Ms: 40_000,
      lapTimeMs: 100_000,
    });
    expect(result).not.toBeNull();
    expect(result![0]).toBeCloseTo(300, 5);
    expect(result![1]).toBeCloseTo(600, 5);
  });

  it("omits (null) when a sector time is missing", () => {
    expect(
      computeSectorBoundaryDistances(distanceM, speedKmh, {
        sector1Ms: 30_000,
        sector2Ms: null,
        lapTimeMs: 100_000,
      }),
    ).toBeNull();
  });

  it("omits (null) on a standstill where integration is unreliable", () => {
    const withStop = speedKmh.slice();
    withStop[5] = 0;
    expect(
      computeSectorBoundaryDistances(distanceM, withStop, {
        sector1Ms: 30_000,
        sector2Ms: 30_000,
        lapTimeMs: 100_000,
      }),
    ).toBeNull();
  });

  it("omits (null) when reconstructed lap time disagrees with stored lap time", () => {
    expect(
      computeSectorBoundaryDistances(distanceM, speedKmh, {
        sector1Ms: 60_000,
        sector2Ms: 60_000,
        lapTimeMs: 200_000, // reconstruction yields ~100_000 -> 50% off
      }),
    ).toBeNull();
  });

  it("omits (null) when distance is non-monotonic (wrap)", () => {
    const wrapped = distanceM.slice();
    wrapped[10] = 50; // trailing wrap past start/finish
    expect(
      computeSectorBoundaryDistances(wrapped, speedKmh, {
        sector1Ms: 30_000,
        sector2Ms: 30_000,
        lapTimeMs: 100_000,
      }),
    ).toBeNull();
  });
});
