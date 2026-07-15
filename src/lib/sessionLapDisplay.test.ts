import { describe, expect, it } from "vitest";
import {
  buildHighlightMapFromLaps,
  coerceSessionDetailLaps,
  coerceTimingHighlight,
  DEFAULT_LAP_TIMING_HIGHLIGHTS,
  timingHighlightClass,
} from "./sessionLapDisplay";

describe("coerceSessionDetailLaps", () => {
  it("preserves purple highlights and coerces legacy green to default", () => {
    const rows = coerceSessionDetailLaps([
      {
        lap: 1,
        timeMs: 90000,
        highlights: {
          lap: "purple",
          s1: "green",
          s2: "default",
          s3: "default",
        },
      },
      {
        lap: 2,
        timeMs: 91000,
        highlights: {
          lap: "default",
          s1: "default",
          s2: "default",
          s3: "default",
        },
      },
    ]);
    const map = buildHighlightMapFromLaps(rows);
    expect(map?.get(1)?.lap).toBe("purple");
    expect(map?.get(1)?.s1).toBe("default");
    expect(map?.get(2)?.lap).toBe("default");
  });

  it("coerces legacy green lap highlight to default on lapNumber rows", () => {
    const rows = coerceSessionDetailLaps([
      {
        lapNumber: 3,
        lapTimeMs: 88000,
        isValid: true,
        isBestLap: true,
        highlights: {
          lap: "green",
          s1: "default",
          s2: "default",
          s3: "default",
        },
      },
    ]);
    expect(buildHighlightMapFromLaps(rows)?.get(3)?.lap).toBe("default");
  });
});

describe("buildHighlightMapFromLaps", () => {
  it("returns null when any lap lacks highlights", () => {
    expect(
      buildHighlightMapFromLaps([
        {
          lap: 1,
          highlights: {
            lap: "purple",
            s1: "default",
            s2: "default",
            s3: "default",
          },
        },
        { lap: 2, highlights: null },
      ]),
    ).toBeNull();
  });

  it("fills defaults when missingAsDefault is true and coerces green", () => {
    const map = buildHighlightMapFromLaps(
      [
        {
          lap: 1,
          highlights: {
            lap: "green",
            s1: "default",
            s2: "default",
            s3: "default",
          },
        },
        { lap: 2, highlights: null },
      ],
      { missingAsDefault: true },
    );
    expect(map?.get(1)?.lap).toBe("default");
    expect(map?.get(2)).toEqual(DEFAULT_LAP_TIMING_HIGHLIGHTS);
  });
});

describe("coerceTimingHighlight", () => {
  it("keeps purple and maps legacy green to default", () => {
    expect(coerceTimingHighlight("purple")).toBe("purple");
    expect(coerceTimingHighlight("green")).toBe("default");
    expect(coerceTimingHighlight("default")).toBe("default");
    expect(coerceTimingHighlight(undefined)).toBe("default");
  });
});

describe("timingHighlightClass", () => {
  it("maps purple and default; never uses lime", () => {
    expect(timingHighlightClass("purple", { isLapTime: true })).toContain(
      "purple",
    );
    expect(timingHighlightClass("default")).toContain("white/80");
    expect(timingHighlightClass("default")).not.toContain("lime");
  });
});

describe("coerceSessionDetailLaps isOutLap", () => {
  it("preserves isOutLap on coerced rows", () => {
    const rows = coerceSessionDetailLaps([
      {
        lapNumber: 1,
        lapTimeMs: 120000,
        isValid: false,
        isBestLap: false,
        isOutLap: true,
      },
      {
        lapNumber: 2,
        lapTimeMs: 90000,
        isValid: true,
        isBestLap: true,
        isOutLap: false,
      },
    ]);
    expect(rows[0]?.isOutLap).toBe(true);
    expect(rows[1]?.isOutLap).toBeUndefined();
  });
});
