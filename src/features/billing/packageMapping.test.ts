import { describe, expect, it } from "vitest";
import type { Package as RevenueCatPackage } from "@revenuecat/purchases-js";
import {
  computeAnnualSavingsPercent,
  isAnnualPackage,
  isMonthlyPackage,
  pickDefaultInterval,
  resolvePackagesByInterval,
} from "./packageMapping";
import type { BillingPlansResponse } from "@/lib/api/activityBilling";
import { APPLE_PRO_ANNUAL, APPLE_PRO_MONTHLY } from "./storeProductIds";

function mockPackage(identifier: string): RevenueCatPackage {
  return { identifier } as RevenueCatPackage;
}

const samplePlans: BillingPlansResponse = {
  free: { id: "free", name: "Free", priceLabel: "£0", features: [] },
  pro: {
    monthly: {
      interval: "MONTHLY",
      name: "Pro Monthly",
      priceGbp: 5.99,
      priceLabel: "£5.99/month",
    },
    annual: {
      interval: "ANNUAL",
      name: "Pro Annual",
      priceGbp: 49.99,
      priceLabel: "£49.99/year",
    },
    features: [],
  },
};

describe("packageMapping", () => {
  it("classifies RevenueCat package identifiers", () => {
    expect(isMonthlyPackage(mockPackage("$rc_monthly"))).toBe(true);
    expect(isAnnualPackage(mockPackage("$rc_annual"))).toBe(true);
    expect(isMonthlyPackage(mockPackage(APPLE_PRO_MONTHLY))).toBe(true);
    expect(isAnnualPackage(mockPackage(APPLE_PRO_ANNUAL))).toBe(true);
  });

  it("resolvePackagesByInterval maps monthly and annual", () => {
    const resolved = resolvePackagesByInterval([
      mockPackage("$rc_annual"),
      mockPackage("$rc_monthly"),
    ]);
    expect(resolved.monthly?.identifier).toBe("$rc_monthly");
    expect(resolved.annual?.identifier).toBe("$rc_annual");
  });

  it("pickDefaultInterval prefers annual when available", () => {
    expect(
      pickDefaultInterval({
        monthly: mockPackage("$rc_monthly"),
        annual: mockPackage("$rc_annual"),
      }),
    ).toBe("ANNUAL");
    expect(
      pickDefaultInterval({
        monthly: mockPackage("$rc_monthly"),
        annual: null,
      }),
    ).toBe("MONTHLY");
  });

  it("computeAnnualSavingsPercent from catalog prices", () => {
    const pct = computeAnnualSavingsPercent(samplePlans);
    expect(pct).toBeGreaterThan(25);
    expect(pct).toBeLessThan(35);
  });

  it("computeAnnualSavingsPercent returns null when annual is not cheaper", () => {
    const expensiveAnnual: BillingPlansResponse = {
      ...samplePlans,
      pro: {
        ...samplePlans.pro,
        annual: { ...samplePlans.pro.annual, priceGbp: 100 },
      },
    };
    expect(computeAnnualSavingsPercent(expensiveAnnual)).toBeNull();
  });
});
