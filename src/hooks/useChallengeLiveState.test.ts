import { describe, it, expect } from "vitest";
import { challengeLiveRefetchIntervalMs } from "@/hooks/useChallengeLiveState";

describe("challengeLiveRefetchIntervalMs", () => {
  it("polls more frequently for active challenges", () => {
    expect(challengeLiveRefetchIntervalMs("ACTIVE")).toBe(15_000);
    expect(challengeLiveRefetchIntervalMs("UPCOMING")).toBe(30_000);
    expect(challengeLiveRefetchIntervalMs("ENDED")).toBe(false);
  });
});
