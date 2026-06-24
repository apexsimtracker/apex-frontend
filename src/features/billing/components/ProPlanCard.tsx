import type { Package as RevenueCatPackage } from "@revenuecat/purchases-js";
import { Loader2, Sparkles } from "lucide-react";
import type { BillingConfigResponse, BillingInterval, BillingPlansResponse } from "@/lib/api/activityBilling";
import { Button } from "@/components/ui/button";
import { BRAND_RED } from "@/lib/appConfig";
import { cn } from "@/lib/utils";
import {
  getPackagePriceLabel,
  priceLabelForCatalogInterval,
  type ResolvedPackages,
} from "../packageMapping";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { PlanFeatureList } from "./PlanFeatureList";
import { PricingAlerts } from "./PricingAlerts";

type ProPlanCardProps = {
  features: string[];
  plans: BillingPlansResponse | undefined;
  billingConfig: BillingConfigResponse | null | undefined;
  resolvedPackages: ResolvedPackages;
  billingInterval: BillingInterval;
  onBillingIntervalChange: (interval: BillingInterval) => void;
  selectedPackage: RevenueCatPackage | null;
  annualSavingsPercent: number | null;
  isPro: boolean;
  isLoggedIn: boolean;
  authLoading: boolean;
  offeringsPending: boolean;
  isPurchasing: boolean;
  isOpeningBillingPortal: boolean;
  isRefreshingSubscription: boolean;
  currentSubscriptionLabel: string | null;
  isCanceled: boolean;
  accessUntilLabel: string | null;
  entitlementBillingInterval: BillingInterval | null;
  message: string | null;
  warning: string | null;
  error: string | null;
  onSubscribe: () => void;
  onManageSubscription: () => void;
  onSignInToSubscribe: () => void;
  className?: string;
};

export function ProPlanCard({
  features,
  plans,
  billingConfig,
  resolvedPackages,
  billingInterval,
  onBillingIntervalChange,
  selectedPackage,
  annualSavingsPercent,
  isPro,
  isLoggedIn,
  authLoading,
  offeringsPending,
  isPurchasing,
  isOpeningBillingPortal,
  isRefreshingSubscription,
  currentSubscriptionLabel,
  isCanceled,
  accessUntilLabel,
  entitlementBillingInterval,
  message,
  warning,
  error,
  onSubscribe,
  onManageSubscription,
  onSignInToSubscribe,
  className,
}: ProPlanCardProps) {
  const hasPackages = Boolean(resolvedPackages.monthly || resolvedPackages.annual);
  const showCatalogPricing = !isPro && (!isLoggedIn || !hasPackages) && Boolean(plans);

  const displayPrice =
    selectedPackage && !showCatalogPricing
      ? getPackagePriceLabel(selectedPackage, plans)
      : priceLabelForCatalogInterval(billingInterval, plans);

  const showIntervalToggle =
    !isPro &&
    (showCatalogPricing ||
      (isLoggedIn && billingConfig?.enabled && !offeringsPending && hasPackages));

  const monthlyToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.monthly != null;
  const annualToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.annual != null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl border bg-card/50 p-6 sm:p-7",
        className
      )}
      style={{ borderColor: "color-mix(in srgb, rgb(240, 28, 28) 35%, transparent)" }}
    >
      <div
        className="absolute -top-3 left-6 flex items-center gap-1 rounded-full px-3 py-0.5 text-xs font-medium text-white"
        style={{ backgroundColor: BRAND_RED }}
      >
        <Sparkles className="size-3" aria-hidden />
        Pro
      </div>

      <h2 className="text-lg font-semibold text-foreground">Apex Pro</h2>

      {isPro ? (
        <div className="mt-3 space-y-1" data-testid="billing-pro-active">
          <p className="text-sm font-medium text-foreground">You&apos;re on Apex Pro</p>
          {currentSubscriptionLabel && (
            <p className="text-sm text-muted-foreground">Current plan: {currentSubscriptionLabel}</p>
          )}
          {(isCanceled || accessUntilLabel) && (
            <p className="text-sm text-muted-foreground">
              {isCanceled
                ? accessUntilLabel
                  ? `Canceled — access continues until ${accessUntilLabel}.`
                  : "Canceled — access continues until the end of your billing period."
                : `Renews or ends ${accessUntilLabel}.`}
            </p>
          )}
          {isRefreshingSubscription && (
            <p className="text-xs text-muted-foreground">Updating subscription status…</p>
          )}
        </div>
      ) : (
        <>
          {showIntervalToggle && (
            <div className="mt-5">
              <BillingIntervalToggle
                interval={billingInterval}
                onIntervalChange={onBillingIntervalChange}
                monthlyAvailable={monthlyToggleAvailable}
                annualAvailable={annualToggleAvailable}
                annualSavingsPercent={annualSavingsPercent}
              />
            </div>
          )}
          <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">{displayPrice}</p>
          {billingInterval === "ANNUAL" && annualSavingsPercent != null && (
            <p className="mt-1 text-xs text-muted-foreground">
              Billed annually · save {annualSavingsPercent}% vs paying monthly
            </p>
          )}
        </>
      )}

      <PlanFeatureList features={features} variant="pro" />

      <div className="mt-6">
        <PricingAlerts message={message} warning={warning} error={error} />
      </div>

      <div className="mt-auto space-y-3 pt-6">
        {isPro ? (
          <>
            {entitlementBillingInterval && (
              <p className="text-center text-xs text-muted-foreground">
                Billing: {entitlementBillingInterval === "MONTHLY" ? "Monthly" : "Annual"}
              </p>
            )}
            <Button
              type="button"
              data-testid="billing-manage-subscription"
              variant="outline"
              className="w-full border-white/15"
              disabled={isOpeningBillingPortal}
              onClick={onManageSubscription}
            >
              {isOpeningBillingPortal ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Manage subscription"
              )}
            </Button>
          </>
        ) : !billingConfig?.enabled ? (
          <p className="rounded-lg border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">
            Billing is not configured for this environment yet.
          </p>
        ) : !isLoggedIn && showCatalogPricing ? (
          <Button
            type="button"
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: BRAND_RED }}
            disabled={authLoading}
            onClick={onSignInToSubscribe}
          >
            Sign in to subscribe
          </Button>
        ) : isLoggedIn && offeringsPending ? (
          <div className="flex items-center justify-center rounded-lg border border-white/10 py-6">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : hasPackages || showCatalogPricing ? (
          <Button
            type="button"
            data-testid="billing-subscribe-pro"
            className="w-full text-white hover:opacity-90"
            style={{ backgroundColor: BRAND_RED }}
            disabled={
              authLoading || isPurchasing || (isLoggedIn && !selectedPackage)
            }
            onClick={isLoggedIn ? onSubscribe : onSignInToSubscribe}
          >
            {isPurchasing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : isLoggedIn ? (
              "Subscribe to Pro"
            ) : (
              "Sign in to subscribe"
            )}
          </Button>
        ) : (
          <p className="rounded-lg border border-white/10 bg-muted/30 p-3 text-sm text-muted-foreground">
            No active RevenueCat packages are available for this account right now.
          </p>
        )}

        <p className="text-center text-xs text-muted-foreground">
          {!billingConfig
            ? "Billing configuration is loading."
            : billingConfig.mode === "sandbox"
              ? "Sandbox billing mode is enabled. RevenueCat will use test-mode checkout."
              : "Live billing mode is enabled. RevenueCat will use live checkout."}
        </p>
      </div>
    </div>
  );
}
