import type { BillingInterval } from "@/lib/api";
import type { getBillingPlans } from "@/lib/api";

type BillingPlans = Awaited<ReturnType<typeof getBillingPlans>>;

type SubscriptionDisplayFields = {
  effectivePlan?: "FREE" | "PRO";
  billingInterval?: BillingInterval | null;
  planDisplayName?: string | null;
};

function priceLabelForInterval(
  interval: BillingInterval | null | undefined,
  plans: BillingPlans | undefined
): string | null {
  if (interval === "MONTHLY") return plans?.pro.monthly.priceLabel ?? null;
  if (interval === "ANNUAL") return plans?.pro.annual.priceLabel ?? null;
  return null;
}

function planNameForInterval(
  interval: BillingInterval | null | undefined,
  plans: BillingPlans | undefined
): string | null {
  if (interval === "MONTHLY") return plans?.pro.monthly.name ?? null;
  if (interval === "ANNUAL") return plans?.pro.annual.name ?? null;
  return plans?.pro.monthly.name ?? plans?.pro.annual.name ?? null;
}

/** Human-readable current subscription line for pricing / settings. */
export function formatCurrentSubscriptionLabel(
  subscription: SubscriptionDisplayFields | undefined,
  plans: BillingPlans | undefined
): string | null {
  if (!subscription || subscription.effectivePlan !== "PRO") return null;

  const name =
    subscription.planDisplayName?.trim() ||
    planNameForInterval(subscription.billingInterval, plans) ||
    "Apex Pro";
  const price = priceLabelForInterval(subscription.billingInterval, plans);
  return price ? `${name} · ${price}` : name;
}
