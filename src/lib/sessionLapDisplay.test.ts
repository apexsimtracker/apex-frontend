import { describe, expect, it } from "vitest";
import {
  buildHighlightMapFromLaps,
  coerceSessionDetailLaps,
  DEFAULT_LAP_TIMING_HIGHLIGHTS,
  timingHighlightClass,
} from "./sessionLapDisplay";

describe("coerceSessionDetailLaps", () => {
  it("preserves API highlights on lap/timeMs rows", () => {
    const rows = coerceSessionDetailLaps([
      {
        lap: 1,
        timeMs: 90000,
        highlights: { lap: "purple", s1: "green", s2: "default", s3: "default" },
      },
      { lap: 2, timeMs: 91000, highlights: { lap: "default", s1: "default", s2: "default", s3: "default" } },
    ]);
    const map = buildHighlightMapFromLaps(rows);
    expect(map?.get(1)?.lap).toBe("purple");
    expect(map?.get(1)?.s1).toBe("green");
    expect(map?.get(2)?.lap).toBe("default");
  });

  it("preserves highlights on lapNumber/lapTimeMs rows", () => {
    const rows = coerceSessionDetailLaps([
      {
        lapNumber: 3,
        lapTimeMs: 88000,
        isValid: true,
        isBestLap: true,
        highlights: { lap: "green", s1: "default", s2: "default", s3: "default" },
      },
    ]);
    expect(buildHighlightMapFromLaps(rows)?.get(3)?.lap).toBe("green");
  });
});

describe("buildHighlightMapFromLaps", () => {
  it("returns null when any lap lacks highlights", () => {
    expect(
      buildHighlightMapFromLaps([
        { lap: 1, highlights: { lap: "purple", s1: "default", s2: "default", s3: "default" } },
        { lap: 2, highlights: null },
      ])
    ).toBeNull();
  });

  it("fills defaults when missingAsDefault is true", () => {
    const map = buildHighlightMapFromLaps(
      [
        { lap: 1, highlights: { lap: "green", s1: "default", s2: "default", s3: "default" } },
        { lap: 2, highlights: null },
      ],
      { missingAsDefault: true }
    );
    expect(map?.get(1)?.lap).toBe("green");
    expect(map?.get(2)).toEqual(DEFAULT_LAP_TIMING_HIGHLIGHTS);
  });
});

describe("timingHighlightClass", () => {
  it("maps highlight kinds to utility classes", () => {
    expect(timingHighlightClass("purple", { isLapTime: true })).toContain("purple");
    expect(timingHighlightClass("green")).toContain("lime");
    expect(timingHighlightClass("default")).toContain("white/80");
  });
});
