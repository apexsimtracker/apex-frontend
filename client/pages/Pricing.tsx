import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Sparkles } from "lucide-react";
import PageMeta from "@/components/PageMeta";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import {
  cancelSubscription,
  getBillingPlans,
  subscribeToPro,
  type BillingInterval,
} from "@/lib/api";

const PRICING_PATH = "/pricing";
const title = `Pricing | ${COMPANY_NAME}`;
const description = `Compare Free and Apex Pro plans. Pro from £5.99/month at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

export default function Pricing() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [interval, setInterval] = useState<BillingInterval>("MONTHLY");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plans, isPending: plansLoading } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getBillingPlans,
  });

  const subscribeMutation = useMutation({
    mutationFn: () => subscribeToPro(interval),
    onSuccess: async () => {
      setError(null);
      setMessage("Welcome to Apex Pro! Your subscription is active.");
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Could not subscribe.");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelSubscription,
    onSuccess: async () => {
      setError(null);
      setMessage(
        "Subscription canceled. You keep Pro access until the end of your billing period."
      );
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ["billing"] });
    },
    onError: (err) => {
      setMessage(null);
      setError(err instanceof Error ? err.message : "Could not cancel.");
    },
  });

  const isPro = user?.hasPro === true;
  const monthly = plans?.pro.monthly;
  const annual = plans?.pro.annual;
  const selectedPrice =
    interval === "MONTHLY" ? monthly?.priceLabel : annual?.priceLabel;

  function handleSubscribe() {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(PRICING_PATH)}`);
      return;
    }
    setMessage(null);
    setError(null);
    subscribeMutation.mutate();
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
              <Button asChild variant="outline" className="mt-8 w-full border-white/15">
                <Link to={!user ? "/signup" : "/sessions"}>
                  {!user ? "Get started free" : isPro ? "Free tier features" : "Current plan"}
                </Link>
              </Button>
            </div>

            <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
              <div className="absolute -top-3 left-6 flex items-center gap-1 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-medium text-black">
                <Sparkles className="size-3" />
                Pro
              </div>
              <h2 className="text-lg font-semibold text-white">Apex Pro</h2>
              <div className="mt-4 flex rounded-lg border border-white/10 p-1">
                <button
                  type="button"
                  onClick={() => setInterval("MONTHLY")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    interval === "MONTHLY"
                      ? "bg-amber-500 text-black"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setInterval("ANNUAL")}
                  className={cn(
                    "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    interval === "ANNUAL"
                      ? "bg-amber-500 text-black"
                      : "text-white/70 hover:text-white"
                  )}
                >
                  Annual
                </button>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">{selectedPrice ?? "—"}</p>
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
              {error && (
                <p className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {error}
                </p>
              )}

              {isPro ? (
                <div className="mt-8 space-y-2">
                  <p className="text-center text-sm text-amber-200/80">You&apos;re on Apex Pro</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full border-white/15"
                    disabled={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate()}
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      "Cancel subscription"
                    )}
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  className="mt-8 w-full bg-amber-500 text-black hover:bg-amber-400"
                  disabled={authLoading || subscribeMutation.isPending}
                  onClick={handleSubscribe}
                >
                  {subscribeMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : user ? (
                    "Subscribe"
                  ) : (
                    "Sign in to subscribe"
                  )}
                </Button>
              )}
              <p className="mt-3 text-center text-xs text-white/40">
                Test billing — no card required. Stripe checkout coming later.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
