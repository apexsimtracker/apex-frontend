import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BRAND_RED } from "@/lib/appConfig";
import { useQuery } from "@tanstack/react-query";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import type { BillingInterval } from "@/lib/api";
import { getBillingPlans } from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { useRevenueCat } from "@/features/billing/useRevenueCat";
import { FreePlanCard } from "@/features/billing/components/FreePlanCard";
import { PricingHero } from "@/features/billing/components/PricingHero";
import { PricingPageSkeleton } from "@/features/billing/components/PricingPageSkeleton";
import { ProPlanCard } from "@/features/billing/components/ProPlanCard";
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

const PRICING_PATH = "/pricing";
const title = `Pricing | ${COMPANY_NAME}`;
const description = `Compare Free and Apex Pro plans for sim racing telemetry, leaderboards, and coaching. Apex Pro is £5.99/month or £49.99/year.`;

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("ANNUAL");
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
    plans
  );
  const userBillingInterval = user?.billingInterval ?? null;
  const isCanceled = isSubscriptionCanceled(user);
  const accessUntilLabel = formatAccessUntilLabel(user?.currentPeriodEnd);

  const resolvedPackages = useMemo(
    () => resolvePackagesByInterval(availablePackages),
    [availablePackages]
  );

  const annualSavingsPercent = useMemo(
    () => computeAnnualSavingsPercent(plans),
    [plans]
  );

  const selectedPackage = useMemo(
    () => packageForInterval(resolvedPackages, billingInterval),
    [resolvedPackages, billingInterval]
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
      setError(err instanceof Error ? err.message : "Could not open billing portal.");
    }
  }

  function handleSignInToSubscribe() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(PRICING_PATH)}`);
    }
  }

  return (
    <>
      <PageMeta title={title} description={description} path={PRICING_PATH} />
      <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
        <PricingHero />

        {showAgentCta && message && !error && (
          <div className="mt-8 rounded-xl border border-green-500/30 bg-green-500/10 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-green-400">{message}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download the Apex Agent and sign in with your website email and password to start
                  automatic telemetry uploads.
                </p>
              </div>
              <Button
                asChild
                className="shrink-0 text-white hover:opacity-90"
                style={{ backgroundColor: BRAND_RED }}
              >
                <Link to="/agent?welcome=pro">
                  <Cpu className="size-4" />
                  Download Apex Agent
                </Link>
              </Button>
            </div>
          </div>
        )}

        {plansLoading ? (
          <PricingPageSkeleton />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch">
            <FreePlanCard
              name={plans?.free.name ?? "Free"}
              priceLabel={plans?.free.priceLabel ?? "£0"}
              features={plans?.free.features ?? []}
              isLoggedIn={Boolean(user)}
              isPro={isPro}
            />
            <ProPlanCard
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
              message={message}
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
