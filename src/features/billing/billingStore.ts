import type { BillingStore as ApiBillingStore } from "@/lib/api/activityBilling";

export const BILLING_STORE_VALUES = [
  "APP_STORE",
  "PLAY_STORE",
  "STRIPE",
  "REVENUECAT_WEB",
  "UNKNOWN",
] as const satisfies ReadonlyArray<ApiBillingStore>;

export type BillingStore = (typeof BILLING_STORE_VALUES)[number];

const BILLING_STORE_SET = new Set<string>(BILLING_STORE_VALUES);

export function isBillingStore(value: unknown): value is BillingStore {
  return typeof value === "string" && BILLING_STORE_SET.has(value);
}

/** Deduplicate while preserving first-seen order; drop invalid entries. */
export function normalizeBillingStores(raw: unknown): BillingStore[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<BillingStore>();
  const out: BillingStore[] = [];
  for (const entry of raw) {
    if (!isBillingStore(entry) || seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
  }
  return out;
}

export function entitlementHasPaidPro(entitlement: {
  hasPaidPro?: unknown;
}): boolean {
  return entitlement.hasPaidPro === true;
}
