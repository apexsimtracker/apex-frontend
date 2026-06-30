import type { Package as RevenueCatPackage } from "@revenuecat/purchases-js";
import type {
  BillingInterval,
  BillingPlansResponse,
} from "@/lib/api/activityBilling";

export type ResolvedPackages = {
  monthly: RevenueCatPackage | null;
  annual: RevenueCatPackage | null;
};

function packageIdentifier(rcPackage: RevenueCatPackage): string {
  return rcPackage.identifier?.trim().toLowerCase() ?? "";
}

export function isAnnualPackage(rcPackage: RevenueCatPackage): boolean {
  const id = packageIdentifier(rcPackage);
  return id.includes("annual") || id.includes("year");
}

export function isMonthlyPackage(rcPackage: RevenueCatPackage): boolean {
  const id = packageIdentifier(rcPackage);
  return id.includes("month") || id === "$rc_monthly";
}

export function resolvePackagesByInterval(
  availablePackages: RevenueCatPackage[],
): ResolvedPackages {
  let monthly: RevenueCatPackage | null = null;
  let annual: RevenueCatPackage | null = null;

  for (const pkg of availablePackages) {
    if (!annual && isAnnualPackage(pkg)) annual = pkg;
    if (!monthly && isMonthlyPackage(pkg)) monthly = pkg;
  }

  return { monthly, annual };
}

export function pickDefaultInterval(
  resolved: ResolvedPackages,
): BillingInterval {
  if (resolved.annual) return "ANNUAL";
  if (resolved.monthly) return "MONTHLY";
  return "ANNUAL";
}

export function packageForInterval(
  resolved: ResolvedPackages,
  interval: BillingInterval,
): RevenueCatPackage | null {
  return interval === "ANNUAL" ? resolved.annual : resolved.monthly;
}

export function computeAnnualSavingsPercent(
  plans: BillingPlansResponse | undefined,
): number | null {
  if (!plans) return null;
  const monthly = plans.pro.monthly.priceGbp;
  const annual = plans.pro.annual.priceGbp;
  if (!Number.isFinite(monthly) || !Number.isFinite(annual) || monthly <= 0) {
    return null;
  }
  const yearlyAtMonthly = monthly * 12;
  if (yearlyAtMonthly <= annual) return null;
  return Math.round(((yearlyAtMonthly - annual) / yearlyAtMonthly) * 100);
}

export function getPackagePriceLabel(
  rcPackage: RevenueCatPackage,
  plans: BillingPlansResponse | undefined,
): string {
  const product = rcPackage.webBillingProduct as unknown as
    | Record<string, unknown>
    | undefined;
  const priceString =
    typeof product?.priceString === "string"
      ? product.priceString
      : typeof product?.currentPriceString === "string"
        ? product.currentPriceString
        : typeof product?.formattedPrice === "string"
          ? product.formattedPrice
          : null;
  if (priceString) return priceString;

  if (isAnnualPackage(rcPackage)) {
    return plans?.pro.annual.priceLabel ?? "Unavailable";
  }
  if (isMonthlyPackage(rcPackage)) {
    return plans?.pro.monthly.priceLabel ?? "Unavailable";
  }

  return plans?.pro.monthly.priceLabel ?? "Unavailable";
}

export function getPackageTitle(
  rcPackage: RevenueCatPackage,
  plans: BillingPlansResponse | undefined,
): string {
  if (isAnnualPackage(rcPackage)) {
    return plans?.pro.annual.name ?? "Pro Annual";
  }
  if (isMonthlyPackage(rcPackage)) {
    return plans?.pro.monthly.name ?? "Pro Monthly";
  }

  const identifier = packageIdentifier(rcPackage);
  if (identifier && !identifier.startsWith("$")) {
    return identifier
      .split(/[-_]/g)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  const product = rcPackage.webBillingProduct as unknown as
    | Record<string, unknown>
    | undefined;
  const displayName =
    typeof product?.displayName === "string"
      ? product.displayName
      : typeof product?.title === "string"
        ? product.title
        : null;
  return displayName ?? plans?.pro.monthly.name ?? "Apex Pro";
}

export function priceLabelForCatalogInterval(
  interval: BillingInterval,
  plans: BillingPlansResponse | undefined,
): string {
  if (interval === "ANNUAL")
    return plans?.pro.annual.priceLabel ?? "£49.99/year";
  return plans?.pro.monthly.priceLabel ?? "£5.99/month";
}
