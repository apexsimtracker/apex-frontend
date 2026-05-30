import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Loader2, Sparkles } from "lucide-react";
import type { Package as RevenueCatPackage } from "@revenuecat/purchases-js";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import { getBillingEntitlement, getBillingPlans } from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { useRevenueCat } from "@/features/billing/useRevenueCat";

const PRICING_PATH = "/pricing";
const title = `Pricing | ${COMPANY_NAME}`;
const description = `Compare Free and Apex Pro plans for sim racing telemetry, leaderboards, and coaching. Apex Pro is £5.99/month or £49.99/year.`;

function getPackagePriceLabel(
  rcPackage: RevenueCatPackage,
  plans: Awaited<ReturnType<typeof getBillingPlans>> | undefined
): string {
  const product = rcPackage.webBillingProduct as unknown as Record<
    string,
    unknown
  > | undefined;
  const priceString =
    typeof product?.priceString === "string"
      ? product.priceString
      : typeof product?.currentPriceString === "string"
        ? product.currentPriceString
        : typeof product?.formattedPrice === "string"
          ? product.formattedPrice
          : null;
  if (priceString) return priceString;

  const identifier = rcPackage.identifier?.toLowerCase() ?? "";
  if (identifier.includes("annual") || identifier.includes("year")) {
    return plans?.pro.annual.priceLabel ?? "Unavailable";
  }
  if (identifier.includes("month")) {
    return plans?.pro.monthly.priceLabel ?? "Unavailable";
  }

  return plans?.pro.monthly.priceLabel ?? "Unavailable";
}

function getPackageTitle(
  rcPackage: RevenueCatPackage,
  plans: Awaited<ReturnType<typeof getBillingPlans>> | undefined
): string {
  const identifier = rcPackage.identifier?.trim().toLowerCase() ?? "";
  if (identifier.includes("annual") || identifier.includes("year")) {
    return plans?.pro.annual.name ?? "Pro Annual";
  }
  if (identifier.includes("month") || identifier === "$rc_monthly") {
    return plans?.pro.monthly.name ?? "Pro Monthly";
  }

  if (identifier && !identifier.startsWith("$")) {
    return identifier
      .split(/[-_]/g)
      .filter(Boolean)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ");
  }

  const product = rcPackage.webBillingProduct as unknown as Record<
    string,
    unknown
  > | undefined;
  const displayName =
    typeof product?.displayName === "string"
      ? product.displayName
      : typeof product?.title === "string"
        ? product.title
        : null;
  return displayName ?? plans?.pro.monthly.name ?? "Apex Pro";
}

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const { data: entitlement } = useQuery({
    queryKey: ["billing", "entitlement"],
    queryFn: getBillingEntitlement,
    enabled: Boolean(user),
  });

  const isPro = user?.hasPro === true;
  const isCanceled =
    entitlement?.status === "CANCELED" || entitlement?.cancelAtPeriodEnd === true;
  const accessUntilLabel = entitlement?.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : null;
  const currentSubscriptionLabel = formatCurrentSubscriptionLabel(entitlement, plans);

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

  async function handlePurchase(rcPackage: RevenueCatPackage) {
    try {
      setError(null);
      setWarning(null);
      setMessage(null);
      const outcome = await purchasePackage(rcPackage);
      if (outcome.refreshErrorMessage) {
        setMessage("Purchase completed successfully.");
        setWarning(outcome.refreshErrorMessage);
      } else {
        setMessage("Welcome to Apex Pro! Your subscription is active.");
      }
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
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white sm:text-4xl">Choose your plan</h1>
          <p className="mt-3 text-white/60">
            Start free. Upgrade to Pro for unlimited history, analytics, and more.
          </p>
        </div>

        {plansLoading ? (
          <div className="mt-12 flex justify-center">
            <Loader2 className="size-8 animate-spin text-white/40" />
          </div>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6">
              <h2 className="text-lg font-semibold text-white">{plans?.free.name ?? "Free"}</h2>
              <p className="mt-1 text-2xl font-bold text-white">{plans?.free.priceLabel ?? "£0"}</p>
              <ul className="mt-6 space-y-3">
                {(plans?.free.features ?? []).map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-white/75">
                    <Check className="mt-0.5 size-4 shrink-0 text-white/40" />
                    {f}
                  </li>
                ))}
              </ul>
              {!user ? (
                <Button asChild variant="outline" className="mt-8 w-full border-white/15">
                  <Link to="/signup">Get started free</Link>
                </Button>
              ) : !isPro ? (
                <p className="mt-8 text-center text-sm text-white/60">Current plan</p>
              ) : null}
            </div>

            <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
              <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-medium text-black">
                <Sparkles className="size-3" />
                Pro
              </div>
              <h2 className="text-lg font-semibold text-white">Apex Pro</h2>
              <p className="mt-3 text-2xl font-bold text-white">
                {plans
                  ? `${plans.pro.monthly.priceLabel} or ${plans.pro.annual.priceLabel}`
                  : "£5.99/month or £49.99/year"}
              </p>
              <ul className="mt-6 space-y-3">
                {(plans?.pro.features ?? []).map((f) => (
                  <li key={f} className="flex gap-2 text-sm text-white/80">
                    <Check className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    {f}
                  </li>
                ))}
              </ul>

              {message && (
                <p className="mt-4 rounded-lg border border-green-500/25 bg-green-500/10 px-3 py-2 text-sm text-green-300">
                  {message}
                </p>
              )}
              {warning && (
                <p className="mt-4 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
                  {warning}
                </p>
              )}
              {error && (
                <p className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              {isPro ? (
                <div className="mt-8 space-y-2">
                  <p className="text-center text-sm font-medium text-amber-100">
                    You&apos;re on Apex Pro
                  </p>
                  {currentSubscriptionLabel && (
                    <p className="text-center text-sm text-amber-200/85">
                      Current plan: {currentSubscriptionLabel}
                    </p>
                  )}
                  {(isCanceled || accessUntilLabel) && (
                    <p className="text-center text-sm text-amber-200/70">
                      {isCanceled
                        ? accessUntilLabel
                          ? `Canceled — access continues until ${accessUntilLabel}.`
                          : "Canceled — access continues until the end of your billing period."
                        : `Renews or ends ${accessUntilLabel}.`}
                    </p>
                  )}
                  {isRefreshingSubscription && (
                    <p className="text-center text-xs text-white/45">Updating subscription status…</p>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/15"
                    disabled={isOpeningBillingPortal}
                    onClick={() => void handleManageSubscription()}
                  >
                    {isOpeningBillingPortal ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Manage subscription"
                    )}
                  </Button>
                </div>
              ) : !user ? (
                <Button
                  type="button"
                  className="mt-8 w-full bg-amber-500 text-black hover:bg-amber-400"
                  disabled={authLoading}
                  onClick={handleSignInToSubscribe}
                >
                  Sign in to subscribe
                </Button>
              ) : !billingConfig?.enabled ? (
                <p className="mt-8 rounded-lg border border-amber-500/20 bg-black/20 px-3 py-3 text-sm text-amber-100/85">
                  Billing is not configured for this environment yet.
                </p>
              ) : offeringsQuery.isPending ? (
                <div className="mt-8 flex items-center justify-center rounded-lg border border-white/10 py-6">
                  <Loader2 className="size-5 animate-spin text-white/60" />
                </div>
              ) : availablePackages.length > 0 ? (
                <div className="mt-8 space-y-3">
                  {availablePackages.map((rcPackage) => (
                    <div
                      key={rcPackage.identifier}
                      className="rounded-lg border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium text-white">
                            {getPackageTitle(rcPackage, plans)}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-amber-200">
                          {getPackagePriceLabel(rcPackage, plans)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="mt-4 w-full bg-amber-500 text-black hover:bg-amber-400"
                        disabled={isPurchasing}
                        onClick={() => void handlePurchase(rcPackage)}
                      >
                        {isPurchasing ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          "Choose this plan"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-8 rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/70">
                  No active RevenueCat packages are available for this account right now.
                </p>
              )}
              <p className="mt-3 text-center text-xs text-white/40">
                {!billingConfig
                  ? "Billing configuration is loading."
                  : billingConfig.mode === "sandbox"
                  ? "Sandbox billing mode is enabled. RevenueCat will use test-mode checkout."
                  : "Live billing mode is enabled. RevenueCat will use live checkout."}
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
