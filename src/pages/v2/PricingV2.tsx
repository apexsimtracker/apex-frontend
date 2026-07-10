import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { V2_AUTH_PATHS } from "@/config/navigation";
import type { BillingInterval } from "@/lib/api";
import { getBillingPlans } from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { useRevenueCat } from "@/features/billing/useRevenueCat";
import {
  computeAnnualSavingsPercent,
  packageForInterval,
  pickDefaultInterval,
  resolvePackagesByInterval,
} from "@/features/billing/packageMapping";
import {
  formatAccessUntilLabel,
  isSubscriptionCanceled,
} from "@/features/billing/subscriptionStatusDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { v2PrimaryButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";
import { FreePlanCardV2 } from "./pricing/FreePlanCardV2";
import { PricingPageSkeletonV2 } from "./pricing/PricingPageSkeletonV2";
import { ProPlanCardV2 } from "./pricing/ProPlanCardV2";

const PRICING_V2_PATH = "/v2/pricing";
const title = `Pricing | ${COMPANY_NAME}`;
const description = `Compare Free and Apex Pro plans for sim racing telemetry, leaderboards, and coaching. Apex Pro is £5.99/month or £49.99/year.`;

export default function PricingV2() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] =
    useState<BillingInterval>("ANNUAL");
  const [showAgentCta, setShowAgentCta] = useState(false);

  const { data: plans, isPending: plansLoading } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getBillingPlans,
  });

  const {
    billingConfig,
    availablePackages,
    offeringsQuery,
    purchasePackage,
    isPurchasing,
    openBillingPortal,
    isOpeningBillingPortal,
    refreshSubscription,
    isRefreshingSubscription,
  } = useRevenueCat();

  const isPro = user?.hasPro === true;
  const currentSubscriptionLabel = formatCurrentSubscriptionLabel(
    user
      ? {
          effectivePlan: user.effectivePlan,
          billingInterval: user.billingInterval ?? null,
        }
      : undefined,
    plans,
  );
  const userBillingInterval = user?.billingInterval ?? null;
  const isCanceled = isSubscriptionCanceled(user);
  const accessUntilLabel = formatAccessUntilLabel(user?.currentPeriodEnd);

  const resolvedPackages = useMemo(
    () => resolvePackagesByInterval(availablePackages),
    [availablePackages],
  );

  const annualSavingsPercent = useMemo(
    () => computeAnnualSavingsPercent(plans),
    [plans],
  );

  const selectedPackage = useMemo(
    () => packageForInterval(resolvedPackages, billingInterval),
    [resolvedPackages, billingInterval],
  );

  useEffect(() => {
    if (availablePackages.length === 0) return;
    setBillingInterval((current) => {
      if (packageForInterval(resolvedPackages, current)) return current;
      return pickDefaultInterval(resolvedPackages);
    });
  }, [availablePackages, resolvedPackages]);

  useEffect(() => {
    if (!user?.id) return;

    const syncFromRevenueCat = () => {
      if (document.visibilityState !== "visible") return;
      void refreshSubscription().catch(() => undefined);
    };

    void refreshSubscription().catch(() => undefined);
    window.addEventListener("focus", syncFromRevenueCat);
    document.addEventListener("visibilitychange", syncFromRevenueCat);

    return () => {
      window.removeEventListener("focus", syncFromRevenueCat);
      document.removeEventListener("visibilitychange", syncFromRevenueCat);
    };
  }, [user?.id, refreshSubscription]);

  async function handlePurchase() {
    if (!selectedPackage) return;
    try {
      setError(null);
      setWarning(null);
      setMessage(null);
      const outcome = await purchasePackage(selectedPackage);
      if (outcome.refreshErrorMessage) {
        setMessage("Purchase completed successfully.");
        setWarning(outcome.refreshErrorMessage);
      } else {
        setMessage("Welcome to Apex Pro! Your subscription is active.");
      }
      setShowAgentCta(true);
    } catch (err) {
      setMessage(null);
      setWarning(null);
      setError(err instanceof Error ? err.message : "Could not subscribe.");
    }
  }

  async function handleManageSubscription() {
    try {
      setMessage(null);
      setWarning(null);
      setError(null);
      await openBillingPortal();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not open billing portal.",
      );
    }
  }

  function handleSignInToSubscribe() {
    if (!user) {
      navigate(
        `${V2_AUTH_PATHS.login}?next=${encodeURIComponent(PRICING_V2_PATH)}`,
      );
    }
  }

  return (
    <>
      <PageMeta
        title={title}
        description={description}
        path={PRICING_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8">
        <div className="mb-10">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Choose your plan
          </h1>
          <p className="mt-2 text-sm tracking-wide text-v2-on-surface-variant">
            Start free. Upgrade to Pro for unlimited history, analytics, and
            more.
          </p>
        </div>

        {showAgentCta && message && !error && (
          <div className="mb-8 rounded-v2-lg border border-v2-success/30 bg-v2-success/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-v2-headline font-medium text-v2-success">
                  {message}
                </p>
                <p className="mt-1 font-v2-body text-sm text-v2-on-surface-variant">
                  Download the Apex Agent and sign in with your website email
                  and password to start automatic telemetry uploads.
                </p>
              </div>
              <Button
                asChild
                className={cn("shrink-0", v2PrimaryButtonClassName)}
              >
                <Link to="/v2/agent?welcome=pro">
                  <Cpu className="size-4" />
                  Download Apex Agent
                </Link>
              </Button>
            </div>
          </div>
        )}

        {plansLoading ? (
          <PricingPageSkeletonV2 />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 md:items-stretch">
            <FreePlanCardV2
              name={plans?.free.name ?? "Free"}
              priceLabel={plans?.free.priceLabel ?? "£0"}
              features={plans?.free.features ?? []}
              isLoggedIn={Boolean(user)}
              isPro={isPro}
            />
            <ProPlanCardV2
              features={plans?.pro.features ?? []}
              plans={plans}
              billingConfig={billingConfig}
              resolvedPackages={resolvedPackages}
              billingInterval={billingInterval}
              onBillingIntervalChange={setBillingInterval}
              selectedPackage={selectedPackage}
              annualSavingsPercent={annualSavingsPercent}
              isPro={isPro}
              isLoggedIn={Boolean(user)}
              authLoading={authLoading}
              offeringsPending={offeringsQuery.isLoading}
              isPurchasing={isPurchasing}
              isOpeningBillingPortal={isOpeningBillingPortal}
              isRefreshingSubscription={isRefreshingSubscription}
              currentSubscriptionLabel={currentSubscriptionLabel}
              isCanceled={isCanceled}
              accessUntilLabel={accessUntilLabel}
              entitlementBillingInterval={userBillingInterval}
              message={showAgentCta ? null : message}
              warning={warning}
              error={error}
              onSubscribe={() => void handlePurchase()}
              onManageSubscription={() => void handleManageSubscription()}
              onSignInToSubscribe={handleSignInToSubscribe}
            />
          </div>
        )}
      </div>
    </>
  );
}
