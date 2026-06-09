import { describe, it, expect } from "vitest";
import {
  isRaceKind,
  isPracticeKind,
  isWarmupKind,
} from "./sessionKind";

describe("sessionKind (frontend)", () => {
  it("matches backend isRaceKind semantics", () => {
    expect(isRaceKind({ sessionType: "RACE" })).toBe(true);
    expect(isRaceKind({ sessionType: "SPRINT" })).toBe(true);
    expect(isRaceKind({ sessionType: "QUALIFYING" })).toBe(false);
    expect(isRaceKind({ sessionType: "MANUAL_ACTIVITY", manualSessionKind: "RACE" })).toBe(true);
    expect(isRaceKind({ sessionType: "MANUAL_ACTIVITY", manualSessionKind: "QUALIFY" })).toBe(false);
  });

  it("isWarmupKind is separate from practice", () => {
    expect(isWarmupKind({ sessionType: "WARMUP" })).toBe(true);
    expect(isPracticeKind({ sessionType: "WARMUP" })).toBe(false);
    expect(isPracticeKind({ sessionType: "PRACTICE" })).toBe(true);
  });
});
