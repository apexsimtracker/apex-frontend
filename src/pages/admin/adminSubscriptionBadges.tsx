import { cn } from "@/lib/utils";

export type AdminSubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "EXPIRED"
  | null;

export type AdminBillingInterval = "MONTHLY" | "ANNUAL" | null;

function formatSubscriptionStatus(status: AdminSubscriptionStatus): string {
  if (!status) return "—";
  if (status === "ACTIVE") return "Active";
  if (status === "CANCELED") return "Canceled";
  if (status === "PAST_DUE") return "Past due";
  if (status === "EXPIRED") return "Expired";
  return status;
}

export function SubscriptionStatusBadge({
  status,
  className,
}: {
  status: AdminSubscriptionStatus;
  className?: string;
}) {
  if (!status) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>—</span>
    );
  }
  const styles =
    status === "ACTIVE"
      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200"
      : status === "PAST_DUE"
        ? "border-amber-500/45 bg-amber-500/15 text-amber-100"
        : status === "CANCELED"
          ? "border-white/20 bg-white/5 text-muted-foreground"
          : "border-white/15 bg-white/5 text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium",
        styles,
        className,
      )}
    >
      {formatSubscriptionStatus(status)}
    </span>
  );
}

export function BillingIntervalChip({
  interval,
  className,
}: {
  interval: AdminBillingInterval;
  className?: string;
}) {
  if (!interval) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>—</span>
    );
  }
  const label = interval === "MONTHLY" ? "Monthly" : "Annual";
  return (
    <span
      className={cn(
        "inline-flex rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-foreground/90",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function CancelAtPeriodEndBadge({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
      Cancel at period end
    </span>
  );
}

export function StaleSyncBadge({ stale }: { stale: boolean }) {
  if (!stale) return null;
  return (
    <span className="inline-flex rounded-full border border-orange-500/40 bg-orange-500/10 px-2 py-0.5 text-xs text-orange-100">
      Stale sync
    </span>
  );
}

export function PlanBadge({
  effectivePlan,
  subscriptionStatus,
  planDisplayName,
  cancelAtPeriodEnd,
}: {
  effectivePlan: "FREE" | "PRO";
  subscriptionStatus: AdminSubscriptionStatus;
  planDisplayName?: string | null;
  cancelAtPeriodEnd?: boolean;
}) {
  if (effectivePlan !== "PRO") {
    return <span className="text-xs text-muted-foreground">Free</span>;
  }

  const label = planDisplayName?.trim() || "Pro";
  const warn =
    subscriptionStatus === "PAST_DUE"
      ? " · Past due"
      : subscriptionStatus === "CANCELED"
        ? cancelAtPeriodEnd
          ? " · Ends at period end"
          : " · Canceled"
        : "";

  return (
    <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs text-amber-100">
      {label}
      {warn}
    </span>
  );
}
