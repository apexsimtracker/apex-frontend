import { describe, it, expect } from "vitest";
import {
  isRaceKind,
  isPracticeKind,
  isWarmupKind,
  resolveSessionTypeTagKind,
  SESSION_TYPE_TAG_STYLES,
  displayPositionRank,
  getDisplayPosition,
} from "./sessionKind";

describe("sessionKind (frontend)", () => {
  it("matches backend isRaceKind semantics", () => {
    expect(isRaceKind({ sessionType: "RACE" })).toBe(true);
    expect(isRaceKind({ sessionType: "SPRINT" })).toBe(true);
    expect(isRaceKind({ sessionType: "QUALIFYING" })).toBe(false);
    expect(
      isRaceKind({ sessionType: "MANUAL_ACTIVITY", manualSessionKind: "RACE" }),
    ).toBe(true);
    expect(
      isRaceKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
      }),
    ).toBe(false);
  });

  it("isWarmupKind is separate from practice", () => {
    expect(isWarmupKind({ sessionType: "WARMUP" })).toBe(true);
    expect(isPracticeKind({ sessionType: "WARMUP" })).toBe(false);
    expect(isPracticeKind({ sessionType: "PRACTICE" })).toBe(true);
  });
});

describe("resolveSessionTypeTagKind", () => {
  it("maps race kinds to RACE", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "RACE" })).toBe("RACE");
    expect(resolveSessionTypeTagKind({ sessionType: "SPRINT" })).toBe("RACE");
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "RACE",
      }),
    ).toBe("RACE");
  });

  it("maps qualifying kinds to QUALIFY", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "QUALIFYING" })).toBe(
      "QUALIFY",
    );
    expect(resolveSessionTypeTagKind({ sessionType: "QUALIFY" })).toBe(
      "QUALIFY",
    );
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
      }),
    ).toBe("QUALIFY");
  });

  it("maps practice kinds to PRACTICE", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "PRACTICE" })).toBe(
      "PRACTICE",
    );
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "PRACTICE",
      }),
    ).toBe("PRACTICE");
  });

  it("maps warmup to WARMUP", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "WARMUP" })).toBe("WARMUP");
    expect(resolveSessionTypeTagKind({ sessionType: "WARM_UP" })).toBe(
      "WARMUP",
    );
  });

  it("falls back to UNKNOWN for unrecognized types", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "CUSTOM" })).toBe(
      "UNKNOWN",
    );
    expect(resolveSessionTypeTagKind({ sessionType: "UNKNOWN" })).toBe(
      "PRACTICE",
    );
  });

  it("uses client-spec colors", () => {
    expect(SESSION_TYPE_TAG_STYLES.RACE.color).toBe("#E8172B");
    expect(SESSION_TYPE_TAG_STYLES.QUALIFY.color).toBe("#9B59FF");
    expect(SESSION_TYPE_TAG_STYLES.PRACTICE.color).toBe("#888888");
    expect(SESSION_TYPE_TAG_STYLES.WARMUP.color).toBe("#F5C518");
    expect(SESSION_TYPE_TAG_STYLES.UNKNOWN.color).toBe("#888888");
  });
});

describe("getDisplayPosition", () => {
  it("shows race finish as P{n} / total", () => {
    expect(
      getDisplayPosition({
        sessionType: "RACE",
        position: 3,
        totalDrivers: 18,
      }),
    ).toBe("P3 / 18");
  });

  it("shows qualifying finish from qualifyingPosition", () => {
    expect(
      getDisplayPosition({
        sessionType: "QUALIFYING",
        qualifyingPosition: 2,
        totalDrivers: 18,
      }),
    ).toBe("P2 / 18");
  });

  it("falls back to position for manual qualifying rows", () => {
    expect(
      getDisplayPosition({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
        position: 4,
        totalDrivers: 20,
      }),
    ).toBe("P4 / 20");
  });

  it("returns null for practice sessions", () => {
    expect(
      getDisplayPosition({
        sessionType: "PRACTICE",
        position: 1,
        totalDrivers: 20,
      }),
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
      }),
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
      }),
    ).toBe(2);
    expect(displayPositionRank({ sessionType: "QUALIFYING" })).toBe(0);
  });
});
