import { describe, it, expect } from "vitest";
import { resolveSessionTypeTagKind, SESSION_TYPE_TAG_STYLES } from "./sessionTypeTag";

describe("resolveSessionTypeTagKind", () => {
  it("maps race kinds to RACE", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "RACE" })).toBe("RACE");
    expect(resolveSessionTypeTagKind({ sessionType: "SPRINT" })).toBe("RACE");
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "RACE",
      })
    ).toBe("RACE");
  });

  it("maps qualifying kinds to QUALIFY", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "QUALIFYING" })).toBe("QUALIFY");
    expect(resolveSessionTypeTagKind({ sessionType: "QUALIFY" })).toBe("QUALIFY");
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
      })
    ).toBe("QUALIFY");
  });

  it("maps practice kinds to PRACTICE", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "PRACTICE" })).toBe("PRACTICE");
    expect(
      resolveSessionTypeTagKind({
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "PRACTICE",
      })
    ).toBe("PRACTICE");
  });

  it("maps warmup to WARMUP", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "WARMUP" })).toBe("WARMUP");
    expect(resolveSessionTypeTagKind({ sessionType: "WARM_UP" })).toBe("WARMUP");
  });

  it("falls back to UNKNOWN for unrecognized types", () => {
    expect(resolveSessionTypeTagKind({ sessionType: "CUSTOM" })).toBe("UNKNOWN");
    expect(resolveSessionTypeTagKind({ sessionType: "UNKNOWN" })).toBe("PRACTICE");
  });

  it("uses client-spec colors", () => {
    expect(SESSION_TYPE_TAG_STYLES.RACE.color).toBe("#E8172B");
    expect(SESSION_TYPE_TAG_STYLES.QUALIFY.color).toBe("#9B59FF");
    expect(SESSION_TYPE_TAG_STYLES.PRACTICE.color).toBe("#888888");
    expect(SESSION_TYPE_TAG_STYLES.WARMUP.color).toBe("#F5C518");
    expect(SESSION_TYPE_TAG_STYLES.UNKNOWN.color).toBe("#888888");
  });
});
