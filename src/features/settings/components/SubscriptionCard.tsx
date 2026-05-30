import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/features/settings/components/SettingsCard";
import {
  createBillingPortalSession,
  getBillingEntitlement,
  type BillingEntitlementStatus,
} from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { getBillingPlans } from "@/lib/api";

function formatInterval(interval: string | null | undefined): string {
  if (interval === "MONTHLY") return "Monthly";
  if (interval === "ANNUAL") return "Annual";
  return "—";
}

function statusLabel(status: BillingEntitlementStatus, hasPro: boolean): string {
  if (!hasPro) return "Free";
  if (status === "CANCELED") return "Pro (canceled — access until period end)";
  if (status === "PAST_DUE") return "Pro (payment issue — grace period)";
  return "Pro (active)";
}

export function SubscriptionCard() {
  const { user } = useAuth();
  const hasPro = user?.hasPro === true;

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { url } = await createBillingPortalSession();
      window.location.assign(url);
      return url;
    },
  });
  const portalErrorMessage =
    portalMutation.error instanceof Error ? portalMutation.error.message : null;

  const { data: plans } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getBillingPlans,
  });

  const { data: entitlement, isPending } = useQuery({
    queryKey: ["billing", "entitlement"],
    queryFn: getBillingEntitlement,
    enabled: Boolean(user),
  });

  const currentSubscriptionLabel = formatCurrentSubscriptionLabel(entitlement, plans);

  const periodEnd = entitlement?.currentPeriodEnd
    ? new Date(entitlement.currentPeriodEnd).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : null;

  return (
    <SettingsCard
      title="Subscription"
      description="Manage your Apex Pro plan on the pricing page."
    >
      {isPending ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <span className="text-muted-foreground">Plan</span>
            <p className="mt-0.5 font-medium text-foreground">
              {statusLabel(entitlement?.status ?? "ACTIVE", hasPro)}
            </p>
            {hasPro && currentSubscriptionLabel && (
              <p className="mt-0.5 text-foreground/80">{currentSubscriptionLabel}</p>
            )}
          </div>
          {hasPro && entitlement?.billingInterval && (
            <div>
              <span className="text-muted-foreground">Billing</span>
              <p className="mt-0.5 font-medium text-foreground">
                {formatInterval(entitlement.billingInterval)}
              </p>
            </div>
          )}
          {hasPro && periodEnd && (
            <div>
              <span className="text-muted-foreground">
                {entitlement?.status === "CANCELED" ? "Access until" : "Renews / period ends"}
              </span>
              <p className="mt-0.5 font-medium text-foreground">{periodEnd}</p>
            </div>
          )}
          {hasPro ? (
            <>
              <Button
                type="button"
                variant="outline"
                className="mt-2 border-white/15"
                disabled={portalMutation.isPending}
                onClick={() => {
                  portalMutation.reset();
                  portalMutation.mutate();
                }}
              >
                {portalMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Manage subscription"
                )}
              </Button>
              {portalErrorMessage && (
                <p className="mt-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                  {portalErrorMessage}
                </p>
              )}
            </>
          ) : (
            <Button asChild variant="outline" className="mt-2 border-white/15">
              <Link to="/pricing">Upgrade to Pro</Link>
            </Button>
          )}
        </div>
      )}
    </SettingsCard>
  );
}
