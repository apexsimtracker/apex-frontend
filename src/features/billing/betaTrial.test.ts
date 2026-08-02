import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatBetaTrialEndsLabel,
  isActiveBetaTrial,
  isPaidProUser,
} from "./betaTrial";

describe("betaTrial helpers", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const now = new Date("2026-08-03T12:00:00.000Z").getTime();
  const future = "2026-09-02T12:00:00.000Z";
  const past = "2026-07-01T12:00:00.000Z";

  it("isActiveBetaTrial requires cohort flag and open expiry", () => {
    expect(
      isActiveBetaTrial(
        { isBetaUser: true, betaTrialExpiresAt: future, hasPro: true },
        now,
      ),
    ).toBe(true);
    expect(
      isActiveBetaTrial(
        { isBetaUser: true, betaTrialExpiresAt: past, hasPro: true },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBetaTrial(
        { isBetaUser: false, betaTrialExpiresAt: future, hasPro: false },
        now,
      ),
    ).toBe(false);
    expect(
      isActiveBetaTrial(
        { isBetaUser: true, betaTrialExpiresAt: null, hasPro: true },
        now,
      ),
    ).toBe(false);
    expect(isActiveBetaTrial(undefined, now)).toBe(false);
  });

  it("treats expiry equal to now as ended (exclusive)", () => {
    const exact = "2026-08-03T12:00:00.000Z";
    expect(
      isActiveBetaTrial(
        { isBetaUser: true, betaTrialExpiresAt: exact, hasPro: true },
        now,
      ),
    ).toBe(false);
  });

  it("isPaidProUser is hasPro without an active beta trial", () => {
    expect(
      isPaidProUser(
        { isBetaUser: true, betaTrialExpiresAt: future, hasPro: true },
        now,
      ),
    ).toBe(false);
    expect(
      isPaidProUser(
        { isBetaUser: true, betaTrialExpiresAt: past, hasPro: true },
        now,
      ),
    ).toBe(true);
    expect(
      isPaidProUser(
        { isBetaUser: false, betaTrialExpiresAt: null, hasPro: true },
        now,
      ),
    ).toBe(true);
    expect(
      isPaidProUser(
        { isBetaUser: false, betaTrialExpiresAt: null, hasPro: false },
        now,
      ),
    ).toBe(false);
  });

  it("formatBetaTrialEndsLabel returns a locale medium date", () => {
    expect(formatBetaTrialEndsLabel(future)).toMatch(/2026/);
    expect(formatBetaTrialEndsLabel(null)).toBeNull();
    expect(formatBetaTrialEndsLabel("not-a-date")).toBeNull();
  });
});
