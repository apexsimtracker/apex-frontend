/**
 * Canonical store product IDs: `apex_pro_monthly` and `apex_pro_annual`.
 * Use those for Play, web/RevenueCat Web Billing, Stripe, and docs.
 *
 * Apple annual is the only exception: `apex_pro_annual` and `apex_pro_yearly`
 * were deleted in App Store Connect (Aug 2026) and cannot be recreated, so
 * Apple annual is `apex_pro_annual_v2`. RevenueCat Apple store: map annual
 * to that ID. Do not put `_v2` on Play or web.
 */

export const STORE_PRO_MONTHLY = "apex_pro_monthly";
export const STORE_PRO_ANNUAL = "apex_pro_annual";

export const PLAY_PRO_MONTHLY = STORE_PRO_MONTHLY;
export const PLAY_PRO_ANNUAL = STORE_PRO_ANNUAL;

export const APPLE_PRO_MONTHLY = STORE_PRO_MONTHLY;
export const APPLE_PRO_ANNUAL = "apex_pro_annual_v2";

/** Apple history only — never recreate, never attach on Play/web. */
export const APPLE_BURNED_PRODUCT_IDS = [
  "apex_pro_annual",
  "apex_pro_yearly",
] as const;

export const APPLE_SUBSCRIPTION_GROUP = "Apex Pro";

export type StoreBillingPlatform = "apple" | "play" | "web";

export function proProductId(
  platform: StoreBillingPlatform,
  interval: "monthly" | "annual",
): string {
  if (interval === "monthly") return STORE_PRO_MONTHLY;
  if (platform === "apple") return APPLE_PRO_ANNUAL;
  return STORE_PRO_ANNUAL;
}
