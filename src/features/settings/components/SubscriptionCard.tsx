import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/features/settings/components/SettingsCard";
import { getBillingEntitlement, type BillingEntitlementStatus } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

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

  const { data: entitlement, isPending } = useQuery({
    queryKey: ["billing", "entitlement"],
    queryFn: getBillingEntitlement,
    enabled: Boolean(user),
  });

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
          <Button asChild variant="outline" className="mt-2 border-white/15">
            <Link to="/pricing">{hasPro ? "Manage on pricing" : "Upgrade to Pro"}</Link>
          </Button>
        </div>
      )}
    </SettingsCard>
  );
}
