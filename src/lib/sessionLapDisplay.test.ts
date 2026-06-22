import { describe, expect, it } from "vitest";
import {
  buildHighlightMapFromLaps,
  computeSessionLapHighlights,
  computeSessionTimingMinima,
  type NormalizedLapInput,
} from "./sessionLapDisplay";

function lap(
  lapNum: number,
  timeMs: number,
  sectors?: { s1?: number; s2?: number; s3?: number },
  isValid = true
): NormalizedLapInput {
  return {
    lap: lapNum,
    timeMs,
    isValid,
    sector1Ms: sectors?.s1 ?? null,
    sector2Ms: sectors?.s2 ?? null,
    sector3Ms: sectors?.s3 ?? null,
  };
}

describe("computeSessionTimingMinima", () => {
  it("returns null minima for empty laps", () => {
    expect(computeSessionTimingMinima([])).toEqual({
      lapMs: null,
      s1Ms: null,
      s2Ms: null,
      s3Ms: null,
    });
  });

  it("excludes invalid and zero lap times from lap minimum", () => {
    const minima = computeSessionTimingMinima([
      lap(1, 90_000, undefined, false),
      lap(2, 0),
      lap(3, 88_000),
    ]);
    expect(minima.lapMs).toBe(88_000);
  });

  it("computes per-sector minima from positive finite values", () => {
    const minima = computeSessionTimingMinima([
      lap(1, 90_000, { s1: 30_000, s2: 30_000, s3: 30_000 }),
      lap(2, 89_000, { s1: 29_500, s2: 29_800, s3: 29_700 }),
    ]);
    expect(minima).toEqual({
      lapMs: 89_000,
      s1Ms: 29_500,
      s2Ms: 29_800,
      s3Ms: 29_700,
    });
  });

  it("excludes invalid lap sectors from sector minima", () => {
    const minima = computeSessionTimingMinima([
      lap(1, 90_000, { s1: 10_000, s2: 30_000, s3: 30_000 }, false),
      lap(2, 88_000, { s1: 29_000, s2: 29_500, s3: 29_500 }),
    ]);
    expect(minima.s1Ms).toBe(29_000);
  });
});

describe("computeSessionLapHighlights", () => {
  it("marks improving laps green and final fastest purple", () => {
    const laps = [lap(1, 92_000), lap(2, 90_000), lap(3, 88_000)];
    const h = computeSessionLapHighlights(laps);

    expect(h.get(1)?.lap).toBe("green");
    expect(h.get(2)?.lap).toBe("green");
    expect(h.get(3)?.lap).toBe("purple");
  });

  it("marks tied session-best laps purple", () => {
    const laps = [lap(1, 90_000), lap(2, 88_000), lap(3, 88_000)];
    const h = computeSessionLapHighlights(laps);

    expect(h.get(1)?.lap).toBe("green");
    expect(h.get(2)?.lap).toBe("purple");
    expect(h.get(3)?.lap).toBe("purple");
  });

  it("marks superseded sector milestones green and session-best purple", () => {
    const laps = [
      lap(1, 90_000, { s1: 30_500, s2: 30_000, s3: 29_500 }),
      lap(2, 89_500, { s1: 30_000, s2: 29_800, s3: 29_700 }),
      lap(3, 89_000, { s1: 29_500, s2: 29_800, s3: 29_700 }),
    ];
    const h = computeSessionLapHighlights(laps);

    expect(h.get(2)?.s1).toBe("green");
    expect(h.get(3)?.s1).toBe("purple");
    expect(h.get(1)?.s2).toBe("green");
    expect(h.get(2)?.s2).toBe("purple");
    expect(h.get(3)?.s2).toBe("purple");
  });

  it("gives purple priority over green on the same cell", () => {
    const laps = [lap(1, 88_000)];
    const h = computeSessionLapHighlights(laps);
    expect(h.get(1)?.lap).toBe("purple");
  });

  it("leaves non-milestone laps default white", () => {
    const laps = [lap(1, 90_000), lap(2, 91_000), lap(3, 88_000)];
    const h = computeSessionLapHighlights(laps);

    expect(h.get(1)?.lap).toBe("green");
    expect(h.get(2)?.lap).toBe("default");
    expect(h.get(3)?.lap).toBe("purple");
  });

  it("does not mark invalid lap sectors purple when they match valid-only minima", () => {
    const laps = [
      lap(1, 90_000, { s1: 29_000, s2: 30_000, s3: 30_000 }, false),
      lap(2, 88_000, { s1: 29_000, s2: 29_500, s3: 29_500 }),
    ];
    const h = computeSessionLapHighlights(laps);
    expect(h.get(1)?.s1).toBe("default");
    expect(h.get(2)?.s1).toBe("purple");
  });
});

describe("buildHighlightMapFromLaps", () => {
  it("returns map when every lap has highlights", () => {
    const map = buildHighlightMapFromLaps([
      { lap: 1, highlights: { lap: "green", s1: "default", s2: "default", s3: "default" } },
      { lap: 2, highlights: { lap: "purple", s1: "purple", s2: "default", s3: "default" } },
    ]);
    expect(map?.get(1)?.lap).toBe("green");
    expect(map?.get(2)?.lap).toBe("purple");
  });

  it("returns null when any lap lacks highlights", () => {
    expect(
      buildHighlightMapFromLaps([
        { lap: 1, highlights: { lap: "green", s1: "default", s2: "default", s3: "default" } },
        { lap: 2, highlights: null },
      ])
    ).toBeNull();
  });

  it("fills missing highlights with default when missingAsDefault is set", () => {
    const map = buildHighlightMapFromLaps(
      [
        { lap: 1, highlights: { lap: "purple", s1: "default", s2: "default", s3: "default" } },
        { lap: 2, highlights: null },
      ],
      { missingAsDefault: true }
    );
    expect(map?.get(1)?.lap).toBe("purple");
    expect(map?.get(2)).toEqual({
      lap: "default",
      s1: "default",
      s2: "default",
      s3: "default",
    });
  });
});
