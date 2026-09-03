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
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import {
  getPackagePriceLabel,
  priceLabelForCatalogInterval,
  type ResolvedPackages,
} from "@/features/billing/packageMapping";
import type { BillingPackage } from "@/features/billing/billingPackage";
import { BillingIntervalToggle } from "./BillingIntervalToggle";
import { PlanFeatureList } from "./PlanFeatureList";
import { PricingAlerts } from "./PricingAlerts";

type ProPlanCardProps = {
  features: string[];
  plans: BillingPlansResponse | undefined;
  billingConfig: BillingConfigResponse | null | undefined;
  isBillingEnabled: boolean;
  isNative: boolean;
  resolvedPackages: ResolvedPackages;
  billingInterval: BillingInterval;
  onBillingIntervalChange: (interval: BillingInterval) => void;
  selectedPackage: BillingPackage | null;
  annualSavingsPercent: number | null;
  isPro: boolean;
  /** Active code-level beta trial (has Pro access but not a paid subscription). */
  onBetaTrial?: boolean;
  betaTrialEndsLabel?: string | null;
  isLoggedIn: boolean;
  authLoading: boolean;
  offeringsPending: boolean;
  isPurchasing: boolean;
  isRestoringPurchases: boolean;
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
  onRestorePurchases: () => void;
  onManageSubscription: () => void;
  onSignInToSubscribe: () => void;
  className?: string;
};

export function ProPlanCard({
  features,
  plans,
  billingConfig,
  isBillingEnabled,
  isNative,
  resolvedPackages,
  billingInterval,
  onBillingIntervalChange,
  selectedPackage,
  annualSavingsPercent,
  isPro,
  onBetaTrial = false,
  betaTrialEndsLabel = null,
  isLoggedIn,
  authLoading,
  offeringsPending,
  isPurchasing,
  isRestoringPurchases,
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
  onRestorePurchases,
  onManageSubscription,
  onSignInToSubscribe,
  className,
}: ProPlanCardProps) {
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
      (isLoggedIn && isBillingEnabled && !offeringsPending && hasPackages));

  const monthlyToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.monthly != null;
  const annualToggleAvailable = showCatalogPricing
    ? true
    : resolvedPackages.annual != null;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-xl border-2 bg-apex-surface-container-low p-6 sm:p-7",
        className,
      )}
      style={{
        borderColor: "color-mix(in srgb, rgb(240, 28, 28) 60%, transparent)",
      }}
    >
      <div
        className="absolute -top-3 left-6 flex items-center gap-1 rounded-full px-3 py-0.5 font-apex-headline text-xs font-medium text-white"
        style={{ backgroundColor: BRAND_RED }}
      >
        <Sparkles className="size-3" aria-hidden />
        Pro
      </div>

      <h2 className="font-apex-headline text-lg font-semibold text-apex-on-surface">
        Apex Pro
      </h2>

      {isPro ? (
        <div className="mt-3 space-y-1" data-testid="billing-pro-active">
          <p className="font-apex-body text-sm font-medium text-apex-on-surface">
            You&apos;re on Apex Pro
          </p>
          {currentSubscriptionLabel && (
            <p className="font-apex-body text-sm text-apex-on-surface-variant">
              Current plan: {currentSubscriptionLabel}
            </p>
          )}
          {(isCanceled || accessUntilLabel) && (
            <p className="font-apex-body text-sm text-apex-on-surface-variant">
              {isCanceled
                ? accessUntilLabel
                  ? `Canceled — access continues until ${accessUntilLabel}.`
                  : "Canceled — access continues until the end of your billing period."
                : `Renews or ends ${accessUntilLabel}.`}
            </p>
          )}
          {isRefreshingSubscription && (
            <p className="font-apex-body text-xs text-apex-on-surface-variant">
              Updating subscription status…
            </p>
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
          <p className="mt-4 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface">
            {displayPrice}
          </p>
          <p
            aria-hidden={
              !(billingInterval === "ANNUAL" && annualSavingsPercent != null)
            }
            className={cn(
              "mt-1 font-apex-body text-xs text-apex-on-surface-variant",
              !(billingInterval === "ANNUAL" && annualSavingsPercent != null) &&
                "invisible",
            )}
          >
            {`Billed annually · save ${annualSavingsPercent ?? 0}% vs paying monthly`}
          </p>
          {onBetaTrial ? (
            <p
              className="mt-3 font-apex-body text-sm text-apex-on-surface"
              data-testid="billing-beta-trial-note"
            >
              Your complimentary Pro access is active
              {betaTrialEndsLabel ? ` until ${betaTrialEndsLabel}` : ""}.
              Subscribe now to keep Pro afterward — complimentary access ends
              when paid Pro starts.
            </p>
          ) : null}
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
              <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
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
              className={cn("w-full", appOutlineButtonClassName)}
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
        ) : !isLoggedIn ? (
          <Button
            type="button"
            className={cn("w-full", appPrimaryButtonClassName)}
            disabled={authLoading}
            onClick={onSignInToSubscribe}
          >
            Sign in to subscribe
          </Button>
        ) : !isBillingEnabled ? (
          <p className="rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container p-3 font-apex-body text-sm text-apex-on-surface-variant">
            Billing is not configured for this environment yet.
          </p>
        ) : isLoggedIn && offeringsPending ? (
          <div className="flex items-center justify-center rounded-apex-sm border border-apex-outline-variant/15 py-6">
            <Loader2 className="size-5 animate-spin text-apex-on-surface-variant" />
          </div>
        ) : hasPackages || showCatalogPricing ? (
          <Button
            type="button"
            data-testid="billing-subscribe-pro"
            className={cn("w-full", appPrimaryButtonClassName)}
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
          <p className="rounded-apex-sm border border-apex-outline-variant/15 bg-apex-surface-container p-3 font-apex-body text-sm text-apex-on-surface-variant">
            No active RevenueCat packages are available for this account right
            now.
          </p>
        )}

        {isNative && isLoggedIn && !isPro && isBillingEnabled && (
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isPurchasing || isRestoringPurchases}
            onClick={onRestorePurchases}
          >
            {isRestoringPurchases ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Restore purchases"
            )}
          </Button>
        )}

        <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
          {isNative
            ? "Purchases are handled securely by the App Store or Google Play."
            : !billingConfig
              ? "Billing configuration is loading."
              : billingConfig.mode === "sandbox"
                ? "Sandbox billing mode is enabled. RevenueCat will use test-mode checkout."
                : "Live billing mode is enabled. RevenueCat will use live checkout."}
        </p>
      </div>
    </div>
  );
}
