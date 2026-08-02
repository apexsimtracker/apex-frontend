import { describe, expect, it } from "vitest";
import {
  formatAccessUntilLabel,
  isSubscriptionCanceled,
  subscriptionPeriodEndLabel,
  subscriptionStatusLabel,
} from "./subscriptionStatusDisplay";

describe("subscriptionStatusDisplay", () => {
  it("detects canceled subscriptions while Pro access remains", () => {
    expect(
      isSubscriptionCanceled({
        hasPro: true,
        subscriptionStatus: "CANCELED",
        cancelAtPeriodEnd: false,
      }),
    ).toBe(true);
    expect(
      isSubscriptionCanceled({
        hasPro: true,
        subscriptionStatus: "ACTIVE",
        cancelAtPeriodEnd: true,
      }),
    ).toBe(true);
  });

  it("formats canceled status and access-until labels", () => {
    expect(
      subscriptionStatusLabel({
        hasPro: true,
        subscriptionStatus: "CANCELED",
        cancelAtPeriodEnd: true,
      }),
    ).toBe("Pro (canceled — access until period end)");
    expect(
      subscriptionPeriodEndLabel({
        hasPro: true,
        subscriptionStatus: "CANCELED",
        cancelAtPeriodEnd: true,
      }),
    ).toBe("Access until");
    expect(formatAccessUntilLabel("2026-07-01T00:00:00.000Z")).toMatch(/2026/);
  });

  it("labels an active beta trial as a 1-month free trial", () => {
    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    expect(
      subscriptionStatusLabel({
        hasPro: true,
        subscriptionStatus: "EXPIRED",
        cancelAtPeriodEnd: false,
        isBetaUser: true,
        betaTrialExpiresAt: future,
      }),
    ).toBe("Pro (1-month free trial)");
  });

  it("uses paid Pro label after beta trial has ended", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(
      subscriptionStatusLabel({
        hasPro: true,
        subscriptionStatus: "ACTIVE",
        cancelAtPeriodEnd: false,
        isBetaUser: true,
        betaTrialExpiresAt: past,
      }),
    ).toBe("Pro (active)");
  });
});
