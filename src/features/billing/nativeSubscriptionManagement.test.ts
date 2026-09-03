import { describe, expect, it } from "vitest";
import { nativeSubscriptionManagementUrl } from "./nativeSubscriptionManagement";

describe("nativeSubscriptionManagement", () => {
  it("opens only platform store subscription pages", () => {
    expect(nativeSubscriptionManagementUrl("apple")).toBe(
      "https://apps.apple.com/account/subscriptions",
    );
    expect(nativeSubscriptionManagementUrl("play")).toBe(
      "https://play.google.com/store/account/subscriptions?package=com.apexsimtracker.app",
    );
  });

  it("does not provide a web or Stripe fallback", () => {
    expect(() => nativeSubscriptionManagementUrl("web")).toThrow(
      "unavailable on web",
    );
  });
});
