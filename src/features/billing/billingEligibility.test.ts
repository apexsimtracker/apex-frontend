import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPurchaseAllowed,
  clearBillingEligibilityCache,
  ensureBillingEligibility,
  resetBillingEligibilityForTests,
} from "./billingEligibility";
import type { BillingRefreshResponse } from "@/lib/api/activityBilling";

function refreshResponse(
  overrides: Partial<BillingRefreshResponse["entitlement"]> = {},
): BillingRefreshResponse {
  return {
    success: true,
    entitlement: {
      plan: "PRO",
      status: "ACTIVE",
      billingInterval: "MONTHLY",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      pastDueSince: null,
      effectivePlan: "PRO",
      cancelAtPeriodEnd: false,
      lastSyncedAt: null,
      hasPaidPro: false,
      billingStores: [],
      ...overrides,
    },
  };
}

describe("ensureBillingEligibility", () => {
  afterEach(() => {
    resetBillingEligibilityForTests();
  });

  it("identifies native before refresh when requested", async () => {
    const order: string[] = [];
    const identifyNativeFn = vi.fn(async () => {
      order.push("identify");
    });
    const refreshFn = vi.fn(async () => {
      order.push("refresh");
      return refreshResponse({
        hasPaidPro: true,
        billingStores: ["STRIPE"],
      });
    });

    const result = await ensureBillingEligibility({
      userId: "user-1",
      identifyNative: true,
      forceRefresh: true,
      identifyNativeFn,
      refreshFn,
    });

    expect(order).toEqual(["identify", "refresh"]);
    expect(identifyNativeFn).toHaveBeenCalledWith({
      userId: "user-1",
      email: null,
    });
    expect(result.hasPaidPro).toBe(true);
    expect(result.billingStores).toEqual(["STRIPE"]);
  });

  it("caches soft eligibility and forceRefresh revalidates", async () => {
    const refreshFn = vi
      .fn()
      .mockResolvedValueOnce(
        refreshResponse({ hasPaidPro: false, billingStores: [] }),
      )
      .mockResolvedValueOnce(
        refreshResponse({
          hasPaidPro: true,
          billingStores: ["APP_STORE"],
        }),
      );

    const first = await ensureBillingEligibility({
      userId: "user-2",
      forceRefresh: false,
      refreshFn,
    });
    const cached = await ensureBillingEligibility({
      userId: "user-2",
      forceRefresh: false,
      refreshFn,
    });
    const forced = await ensureBillingEligibility({
      userId: "user-2",
      forceRefresh: true,
      refreshFn,
    });

    expect(first.hasPaidPro).toBe(false);
    expect(cached.hasPaidPro).toBe(false);
    expect(forced.hasPaidPro).toBe(true);
    expect(forced.billingStores).toEqual(["APP_STORE"]);
    expect(refreshFn).toHaveBeenCalledTimes(2);
  });

  it("fails closed with a retryable sync error when refresh fails", async () => {
    clearBillingEligibilityCache();
    await expect(
      ensureBillingEligibility({
        userId: "user-3",
        forceRefresh: true,
        refreshFn: async () => {
          throw new Error("network down");
        },
      }),
    ).rejects.toThrow(/Could not verify your subscription status/);
  });

  it("assertPurchaseAllowed blocks paid Pro before store purchase", () => {
    expect(() => assertPurchaseAllowed({ hasPaidPro: true })).toThrow(
      "You already have Pro",
    );
    expect(() => assertPurchaseAllowed({ hasPaidPro: false })).not.toThrow();
  });
});
