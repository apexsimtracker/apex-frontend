import type { BillingEntitlement, BillingInterval } from "@/lib/api";
import type { getBillingPlans } from "@/lib/api";

type BillingPlans = Awaited<ReturnType<typeof getBillingPlans>>;

function priceLabelForInterval(
  interval: BillingInterval | null | undefined,
  plans: BillingPlans | undefined
): string | null {
  if (interval === "MONTHLY") return plans?.pro.monthly.priceLabel ?? null;
  if (interval === "ANNUAL") return plans?.pro.annual.priceLabel ?? null;
  return null;
}

/** Human-readable current subscription line for pricing / settings. */
export function formatCurrentSubscriptionLabel(
  entitlement: BillingEntitlement | undefined,
  plans: BillingPlans | undefined
): string | null {
  if (!entitlement || entitlement.effectivePlan !== "PRO") return null;

  const name = entitlement.planDisplayName?.trim();
  if (!name) return null;

  const price = priceLabelForInterval(entitlement.billingInterval, plans);
  return price ? `${name} · ${price}` : name;
}
