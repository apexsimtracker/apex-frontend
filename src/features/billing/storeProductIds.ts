/**
 * Canonical plan IDs are `apex_pro_monthly` and `apex_pro_annual`.
 *
 * Store exceptions:
 * - Google Play monthly was created as `apexsim_pro_monthly` and cannot be
 *   renamed/reused. Map that SKU to the canonical monthly plan.
 * - Apple annual was recreated as `apex_pro_annual_v2` after
 *   `apex_pro_annual` and `apex_pro_yearly` were deleted and burned.
 */

export const STORE_PRO_MONTHLY = "apex_pro_monthly";
export const STORE_PRO_ANNUAL = "apex_pro_annual";

export const PLAY_PRO_MONTHLY = "apexsim_pro_monthly";
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
  if (interval === "monthly") {
    return platform === "play" ? PLAY_PRO_MONTHLY : STORE_PRO_MONTHLY;
  }
  if (platform === "apple") return APPLE_PRO_ANNUAL;
  return STORE_PRO_ANNUAL;
}
