import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createBillingPortalSession, getBillingPlans } from "@/lib/api";
import { formatCurrentSubscriptionLabel } from "@/features/billing/subscriptionDisplay";
import { openExternalUrl } from "@/lib/capacitor/openExternalUrl";
import { useAuth } from "@/contexts/AuthContext";
import {
  formatAccessUntilLabel,
  subscriptionPeriodEndLabel,
  subscriptionStatusLabel,
} from "@/features/billing/subscriptionStatusDisplay";
import { v2OutlineButtonClassName } from "@/components/v2/ui/v2ButtonClasses";
import { cn } from "@/lib/utils";

export function SubscriptionCardV2() {
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
    plans,
  );

  const billingInterval = user?.billingInterval ?? null;
  const accessUntilLabel = formatAccessUntilLabel(user?.currentPeriodEnd);

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-v2-on-surface-variant">
        Manage your Apex Pro plan on the pricing page.
      </p>
      <div>
        <span className="text-xs text-v2-on-surface-variant">Plan</span>
        <p className="mt-0.5 font-v2-headline text-sm font-bold text-v2-on-surface">
          {subscriptionStatusLabel(user)}
        </p>
        {hasPro && currentSubscriptionLabel && (
          <p className="mt-0.5 text-sm text-v2-on-surface">
            {currentSubscriptionLabel}
          </p>
        )}
      </div>
      {hasPro && billingInterval && (
        <div>
          <span className="text-xs text-v2-on-surface-variant">Billing</span>
          <p className="mt-0.5 font-v2-headline text-sm font-bold text-v2-on-surface">
            {billingInterval === "MONTHLY" ? "Monthly" : "Annual"}
          </p>
        </div>
      )}
      {hasPro && accessUntilLabel && (
        <div>
          <span className="text-xs text-v2-on-surface-variant">
            {subscriptionPeriodEndLabel(user)}
          </span>
          <p className="mt-0.5 font-v2-headline text-sm font-bold text-v2-on-surface">
            {accessUntilLabel}
          </p>
        </div>
      )}
      {hasPro ? (
        <>
          <Button
            type="button"
            data-testid="billing-manage-subscription"
            variant="outline"
            className={cn("mt-2", v2OutlineButtonClassName)}
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
            <p className="mt-2 rounded-v2-sm border border-v2-error/25 bg-v2-error/10 px-3 py-2 text-sm text-v2-error">
              {portalErrorMessage}
            </p>
          )}
        </>
      ) : (
        <Button asChild variant="outline" className={cn("mt-2", v2OutlineButtonClassName)}>
          <Link to="/pricing">Upgrade to Pro</Link>
        </Button>
      )}
    </div>
  );
}
