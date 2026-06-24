import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/features/settings/components/SettingsCard";
import { createBillingPortalSession, getBillingPlans } from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { openExternalUrl } from "@/lib/capacitor/openExternalUrl";
import { useAuth } from "@/contexts/AuthContext";

import {
  formatAccessUntilLabel,
  subscriptionPeriodEndLabel,
  subscriptionStatusLabel,
} from "@/features/billing/subscriptionStatusDisplay";

export function SubscriptionCard() {
  const { user } = useAuth();
  const hasPro = user?.hasPro === true;

  const portalMutation = useMutation({
    mutationFn: async () => {
      const { url } = await createBillingPortalSession();
      await openExternalUrl(url);
      return url;
    },
  });
  const portalErrorMessage =
    portalMutation.error instanceof Error ? portalMutation.error.message : null;

  const { data: plans } = useQuery({
    queryKey: ["billing", "plans"],
    queryFn: getBillingPlans,
  });

  const currentSubscriptionLabel = formatCurrentSubscriptionLabel(
    user
      ? {
          effectivePlan: user.effectivePlan,
          billingInterval: user.billingInterval ?? null,
        }
      : undefined,
    plans
  );

  const billingInterval = user?.billingInterval ?? null;
  const accessUntilLabel = formatAccessUntilLabel(user?.currentPeriodEnd);

  return (
    <SettingsCard
      title="Subscription"
      description="Manage your Apex Pro plan on the pricing page."
    >
      <div className="space-y-3 text-sm">
        <div>
          <span className="text-muted-foreground">Plan</span>
          <p className="mt-0.5 font-medium text-foreground">{subscriptionStatusLabel(user)}</p>
          {hasPro && currentSubscriptionLabel && (
            <p className="mt-0.5 text-foreground/80">{currentSubscriptionLabel}</p>
          )}
        </div>
        {hasPro && billingInterval && (
          <div>
            <span className="text-muted-foreground">Billing</span>
            <p className="mt-0.5 font-medium text-foreground">
              {billingInterval === "MONTHLY" ? "Monthly" : "Annual"}
            </p>
          </div>
        )}
        {hasPro && accessUntilLabel && (
          <div>
            <span className="text-muted-foreground">{subscriptionPeriodEndLabel(user)}</span>
            <p className="mt-0.5 font-medium text-foreground">{accessUntilLabel}</p>
          </div>
        )}
        {hasPro ? (
          <>
            <Button
              type="button"
              data-testid="billing-manage-subscription"
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
    </SettingsCard>
  );
}
