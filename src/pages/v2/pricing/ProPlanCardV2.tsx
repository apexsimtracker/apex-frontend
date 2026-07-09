import type { Package as RevenueCatPackage } from "@revenuecat/purchases-js";
import { Loader2, Sparkles } from "lucide-react";
import type {
  BillingConfigResponse,
  BillingInterval,
  BillingPlansResponse,
} from "@/lib/api/activityBilling";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BRAND_RED } from "@/lib/appConfig";
import {
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import {
  getPackagePriceLabel,
  priceLabelForCatalogInterval,
  type ResolvedPackages,
} from "@/features/billing/packageMapping";
import { BillingIntervalToggleV2 } from "./BillingIntervalToggleV2";
import { PlanFeatureListV2 } from "./PlanFeatureListV2";
import { PricingAlertsV2 } from "./PricingAlertsV2";

type ProPlanCardV2Props = {
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

export function ProPlanCardV2({
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
}: ProPlanCardV2Props) {
  const hasPackages = Boolean(
    resolvedPackages.monthly || resolvedPackages.annual,
  );
  const showCatalogPricing =
    !isPro && (!isLoggedIn || !hasPackages) && Boolean(plans);

  const displayPrice =
    selectedPackage && !showCatalogPricing
      ? getPackagePriceLabel(selectedPackage, plans)
      : priceLabelForCatalogInterval(billingInterval, plans);

  const showIntervalToggle =
    !isPro &&
    (showCatalogPricing ||
      (isLoggedIn &&
        billingConfig?.enabled &&
        !offeringsPending &&
        hasPackages));

  const monthlyToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.monthly != null;
  const annualToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.annual != null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl border-2 bg-v2-surface-container-low p-6 sm:p-7",
        className,
      )}
      style={{
        borderColor: "color-mix(in srgb, rgb(240, 28, 28) 60%, transparent)",
      }}
    >
      <div
        className="absolute -top-3 left-6 flex items-center gap-1 rounded-full px-3 py-0.5 font-v2-headline text-xs font-medium text-white"
        style={{ backgroundColor: BRAND_RED }}
      >
        <Sparkles className="size-3" aria-hidden />
        Pro
      </div>

      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Apex Pro
      </h2>

      {isPro ? (
        <div className="mt-3 space-y-1" data-testid="billing-pro-active">
          <p className="font-v2-body text-sm font-medium text-v2-on-surface">
            You&apos;re on Apex Pro
          </p>
          {currentSubscriptionLabel && (
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              Current plan: {currentSubscriptionLabel}
            </p>
          )}
          {(isCanceled || accessUntilLabel) && (
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              {isCanceled
                ? accessUntilLabel
                  ? `Canceled — access continues until ${accessUntilLabel}.`
                  : "Canceled — access continues until the end of your billing period."
                : `Renews or ends ${accessUntilLabel}.`}
            </p>
          )}
          {isRefreshingSubscription && (
            <p className="font-v2-body text-xs text-v2-on-surface-variant">
              Updating subscription status…
            </p>
          )}
        </div>
      ) : (
        <>
          {showIntervalToggle && (
            <div className="mt-5">
              <BillingIntervalToggleV2
                interval={billingInterval}
                onIntervalChange={onBillingIntervalChange}
                monthlyAvailable={monthlyToggleAvailable}
                annualAvailable={annualToggleAvailable}
                annualSavingsPercent={annualSavingsPercent}
              />
            </div>
          )}
          <p className="mt-4 font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            {displayPrice}
          </p>
          <p
            aria-hidden={
              !(billingInterval === "ANNUAL" && annualSavingsPercent != null)
            }
            className={cn(
              "mt-1 font-v2-body text-xs text-v2-on-surface-variant",
              !(billingInterval === "ANNUAL" && annualSavingsPercent != null) &&
                "invisible",
            )}
          >
            {`Billed annually · save ${annualSavingsPercent ?? 0}% vs paying monthly`}
          </p>
        </>
      )}

      <PlanFeatureListV2 features={features} variant="pro" />

      <div className="mt-6">
        <PricingAlertsV2 message={message} warning={warning} error={error} />
      </div>

      <div className="mt-auto space-y-3 pt-6">
        {isPro ? (
          <>
            {entitlementBillingInterval && (
              <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
                Billing:{" "}
                {entitlementBillingInterval === "MONTHLY"
                  ? "Monthly"
                  : "Annual"}
              </p>
            )}
            <Button
              type="button"
              data-testid="billing-manage-subscription"
              variant="outline"
              className={cn("w-full", v2OutlineButtonClassName)}
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
          <p className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container p-3 font-v2-body text-sm text-v2-on-surface-variant">
            Billing is not configured for this environment yet.
          </p>
        ) : !isLoggedIn && showCatalogPricing ? (
          <Button
            type="button"
            className={cn("w-full", v2PrimaryButtonClassName)}
            disabled={authLoading}
            onClick={onSignInToSubscribe}
          >
            Sign in to subscribe
          </Button>
        ) : isLoggedIn && offeringsPending ? (
          <div className="flex items-center justify-center rounded-v2-sm border border-v2-outline-variant/15 py-6">
            <Loader2 className="size-5 animate-spin text-v2-on-surface-variant" />
          </div>
        ) : hasPackages || showCatalogPricing ? (
          <Button
            type="button"
            data-testid="billing-subscribe-pro"
            className={cn("w-full", v2PrimaryButtonClassName)}
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
          <p className="rounded-v2-sm border border-v2-outline-variant/15 bg-v2-surface-container p-3 font-v2-body text-sm text-v2-on-surface-variant">
            No active RevenueCat packages are available for this account right
            now.
          </p>
        )}

        <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
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
