import { describe, expect, it } from "vitest";
import {
  ALREADY_HAVE_PRO_MESSAGE,
  paidProHeadline,
  resolveSubscriptionManageActions,
  shouldShowNativeRestore,
  UNKNOWN_BILLING_SOURCE_MESSAGE,
} from "./subscriptionManagement";

describe("resolveSubscriptionManageActions", () => {
  it("routes App Store Pro to Apple subscriptions only", () => {
    const actions = resolveSubscriptionManageActions(["APP_STORE"], {
      hasPaidPro: true,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "app_store",
      kind: "external_url",
      label: "Manage on App Store",
    });
    if (actions[0].kind === "external_url") {
      expect(actions[0].url).toContain("apps.apple.com");
    }
  });

  it("routes Play Store Pro to Google Play subscriptions only", () => {
    const actions = resolveSubscriptionManageActions(["PLAY_STORE"], {
      hasPaidPro: true,
    });
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "play_store",
      kind: "external_url",
    });
    if (actions[0].kind === "external_url") {
      expect(actions[0].url).toContain("play.google.com");
    }
  });

  it("dedupes Stripe and RevenueCat Web into one website portal action", () => {
    const actions = resolveSubscriptionManageActions(
      ["STRIPE", "REVENUECAT_WEB"],
      { hasPaidPro: true },
    );
    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      id: "web_portal",
      kind: "web_portal",
      label: "Manage on website",
    });
  });

  it("shows separate actions for multi-store paid Pro", () => {
    const actions = resolveSubscriptionManageActions(
      ["APP_STORE", "STRIPE", "PLAY_STORE"],
      { hasPaidPro: true },
    );
    expect(actions.map((a) => a.id)).toEqual([
      "app_store",
      "play_store",
      "web_portal",
    ]);
  });

  it("does not silently open a destination for UNKNOWN or missing source", () => {
    const unknown = resolveSubscriptionManageActions(["UNKNOWN"], {
      hasPaidPro: true,
    });
    expect(unknown).toHaveLength(1);
    expect(unknown[0]).toMatchObject({
      id: "unknown",
      kind: "instructions",
    });
    expect(unknown[0].description).toBe(UNKNOWN_BILLING_SOURCE_MESSAGE);

    const missing = resolveSubscriptionManageActions([], { hasPaidPro: true });
    expect(missing).toHaveLength(1);
    expect(missing[0].kind).toBe("instructions");
  });

  it("keeps unknown-source guidance alongside a known store", () => {
    const actions = resolveSubscriptionManageActions(
      ["APP_STORE", "UNKNOWN"],
      { hasPaidPro: true },
    );

    expect(actions.map((action) => action.id)).toEqual([
      "app_store",
      "unknown",
    ]);
  });

  it("never infers store from absence of billingStores when not paid", () => {
    expect(resolveSubscriptionManageActions([], { hasPaidPro: false })).toEqual(
      [],
    );
  });
});

describe("paid Pro vs restore helpers", () => {
  it("uses explicit already-have-Pro headline for paid users", () => {
    expect(paidProHeadline(true)).toBe(ALREADY_HAVE_PRO_MESSAGE);
    expect(paidProHeadline(false)).toBe("You're on Apex Pro");
  });

  it("keeps native restore available for paid Pro receipts", () => {
    expect(
      shouldShowNativeRestore({
        isNative: true,
        isLoggedIn: true,
        isBillingEnabled: true,
      }),
    ).toBe(true);
    expect(
      shouldShowNativeRestore({
        isNative: false,
        isLoggedIn: true,
        isBillingEnabled: true,
      }),
    ).toBe(false);
  });
});
