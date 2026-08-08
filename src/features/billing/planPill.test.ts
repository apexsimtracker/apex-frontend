import { describe, expect, it } from "vitest";
import { planTierForUser, planTierLabel } from "./planPill";

describe("planTierForUser", () => {
  const now = new Date("2026-08-03T12:00:00.000Z").getTime();
  const future = "2026-09-02T12:00:00.000Z";
  const past = "2026-07-01T12:00:00.000Z";

  it("returns FREE for a signed-out or non-pro user", () => {
    expect(planTierForUser(null, now)).toBe("FREE");
    expect(planTierForUser(undefined, now)).toBe("FREE");
    expect(
      planTierForUser(
        { isBetaUser: false, betaTrialExpiresAt: null, hasPro: false },
        now,
      ),
    ).toBe("FREE");
  });

  it("returns PRO for a paid subscriber", () => {
    expect(
      planTierForUser(
        { isBetaUser: false, betaTrialExpiresAt: null, hasPro: true },
        now,
      ),
    ).toBe("PRO");
  });

  it("returns BETA while the trial window is open", () => {
    expect(
      planTierForUser(
        { isBetaUser: true, betaTrialExpiresAt: future, hasPro: true },
        now,
      ),
    ).toBe("BETA");
  });

  it("falls back to FREE once the trial has ended without a purchase", () => {
    expect(
      planTierForUser(
        { isBetaUser: true, betaTrialExpiresAt: past, hasPro: false },
        now,
      ),
    ).toBe("FREE");
  });

  it("returns PRO for a beta cohort member who subscribed", () => {
    expect(
      planTierForUser(
        { isBetaUser: true, betaTrialExpiresAt: past, hasPro: true },
        now,
      ),
    ).toBe("PRO");
  });
});

describe("planTierLabel", () => {
  it("maps each tier to its display label", () => {
    expect(planTierLabel("FREE")).toBe("Free");
    expect(planTierLabel("PRO")).toBe("Pro");
    expect(planTierLabel("BETA")).toBe("Beta");
  });
});
