import { describe, expect, it } from "vitest";
import { displayPositionRank, getDisplayPosition } from "./displayPosition";

describe("getDisplayPosition", () => {
  it("shows race finish as P{n} / total", () => {
    expect(
      getDisplayPosition({
        sessionType: "RACE",
        position: 3,
        totalDrivers: 18,
      })
    ).toBe("P3 / 18");
  });

  it("shows qualifying finish from qualifyingPosition", () => {
    expect(
      getDisplayPosition({
        sessionType: "QUALIFYING",
        qualifyingPosition: 2,
        totalDrivers: 18,
      })
    ).toBe("P2 / 18");
  });

  it("falls back to position for manual qualifying rows", () => {
    expect(
      getDisplayPosition({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
        position: 4,
        totalDrivers: 20,
      })
    ).toBe("P4 / 20");
  });

  it("returns null for practice sessions", () => {
    expect(
      getDisplayPosition({
        sessionType: "PRACTICE",
        position: 1,
        totalDrivers: 20,
      })
    ).toBeNull();
  });

  it("returns null when race/qual position is missing", () => {
    expect(getDisplayPosition({ sessionType: "RACE" })).toBeNull();
    expect(getDisplayPosition({ sessionType: "QUALIFYING" })).toBeNull();
  });

  it("returns null when race has totalDrivers but no position", () => {
    expect(
      getDisplayPosition({
        sessionType: "RACE",
        totalDrivers: 18,
      })
    ).toBeNull();
  });
});

describe("displayPositionRank", () => {
  it("extracts rank from display label", () => {
    expect(
      displayPositionRank({
        sessionType: "RACE",
        position: 2,
        totalDrivers: 18,
      })
    ).toBe(2);
    expect(displayPositionRank({ sessionType: "QUALIFYING" })).toBe(0);
  });
});
