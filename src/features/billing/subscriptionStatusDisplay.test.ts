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
});
