import { describe, expect, it } from "vitest";
import {
  computeSectorBoundaryDistances,
  interiorNativeStartsPct,
} from "./telemetrySectors";

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

  it("reconstructs N-1 boundaries for four and seven sectors", () => {
    expect(
      computeSectorBoundaryDistances(distanceM, speedKmh, {
        sectorTimesMs: [10_000, 20_000, 30_000, 40_000],
        lapTimeMs: 100_000,
      }),
    ).toEqual([100, 300, 600]);

    const seven = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sectorTimesMs: [10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 40_000],
      lapTimeMs: 100_000,
    });
    expect(seven).toEqual([100, 200, 300, 400, 500, 600]);
  });

  it("returns no interior boundaries for one complete sector", () => {
    expect(
      computeSectorBoundaryDistances(distanceM, speedKmh, {
        sectorTimesMs: [100_000],
        lapTimeMs: 100_000,
      }),
    ).toEqual([]);
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

  it("places native 3/4/7 starts at fractions of the distance axis", () => {
    const three = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sectorTimesMs: [10_000, 10_000, 80_000],
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0, 0.25, 0.6] });
    expect(three).toEqual([250, 600]);

    const four = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sectorTimesMs: [10_000, 10_000, 10_000, 70_000],
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0, 0.2, 0.45, 0.75] });
    expect(four).toEqual([200, 450, 750]);

    const seven = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sectorTimesMs: [10_000, 10_000, 10_000, 10_000, 10_000, 10_000, 40_000],
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.7] });
    expect(seven).toEqual([100, 200, 300, 400, 500, 700]);
  });

  it("uses duration reconstruction when starts are empty", () => {
    const result = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sector1Ms: 30_000,
      sector2Ms: 30_000,
      sector3Ms: 40_000,
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [] });
    expect(result).toEqual([300, 600]);
  });

  it("does not invent 33/66 when starts are malformed", () => {
    const missingZero = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sector1Ms: 30_000,
      sector2Ms: 30_000,
      sector3Ms: 40_000,
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0.33, 0.66] });
    expect(missingZero).toEqual([300, 600]);
    expect(missingZero).not.toEqual([330, 660]);

    const nonMonotonic = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sector1Ms: 30_000,
      sector2Ms: 30_000,
      sector3Ms: 40_000,
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0, 0.7, 0.4] });
    expect(nonMonotonic).toEqual([300, 600]);

    const atOrPastFinish = computeSectorBoundaryDistances(distanceM, speedKmh, {
      sector1Ms: 30_000,
      sector2Ms: 30_000,
      sector3Ms: 40_000,
      lapTimeMs: 100_000,
    }, { sectorStartsPct: [0, 0.4, 1] });
    expect(atOrPastFinish).toEqual([300, 600]);

    const withStop = speedKmh.slice();
    withStop[5] = 0;
    expect(
      computeSectorBoundaryDistances(distanceM, withStop, {
        sector1Ms: 30_000,
        sector2Ms: 30_000,
        sector3Ms: 40_000,
        lapTimeMs: 100_000,
      }, { sectorStartsPct: [0.33, 0.66] }),
    ).toBeNull();
  });

  it("places native bands even when duration reconstruction would fail", () => {
    const withStop = speedKmh.slice();
    withStop[5] = 0;
    expect(
      computeSectorBoundaryDistances(distanceM, withStop, {
        sector1Ms: 30_000,
        sector2Ms: 30_000,
        sector3Ms: 40_000,
        lapTimeMs: 100_000,
      }, { sectorStartsPct: [0, 0.4, 0.8] }),
    ).toEqual([400, 800]);
  });
});

describe("interiorNativeStartsPct", () => {
  it("accepts a first start within the zero epsilon", () => {
    expect(interiorNativeStartsPct([0.00005, 0.4, 0.8])).toEqual([0.4, 0.8]);
  });

  it("rejects empty, single, or finish-inclusive layouts", () => {
    expect(interiorNativeStartsPct([])).toBeNull();
    expect(interiorNativeStartsPct([0])).toBeNull();
    expect(interiorNativeStartsPct([0, 1])).toBeNull();
  });
});
