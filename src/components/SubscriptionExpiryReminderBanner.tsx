import { Clock3 } from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  claimSubscriptionExpiryReminder,
  updateSubscriptionExpiryReminder,
  type SubscriptionExpiryReminderClaim,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { hasExpiredSubscriptionHistory } from "@/features/billing/subscriptionStatusDisplay";

export default function SubscriptionExpiryReminderBanner() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["billing", "expiry-reminder", user?.id ?? null] as const;
  const eligible = hasExpiredSubscriptionHistory(user);

  const reminderQuery = useQuery({
    queryKey,
    queryFn: claimSubscriptionExpiryReminder,
    enabled: Boolean(user?.id) && eligible,
    staleTime: Infinity,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: (query) =>
      query.state.data?.visible ? false : 60 * 60 * 1000,
    retry: false,
  });

  const hideBanner = () => {
    queryClient.setQueryData<SubscriptionExpiryReminderClaim>(queryKey, {
      visible: false,
      expiredAt: null,
      reminderEndsAt: null,
    });
  };

  const actionMutation = useMutation({
    mutationFn: (action: "REMIND_LATER" | "DISMISS") =>
      updateSubscriptionExpiryReminder(action),
    onSuccess: hideBanner,
  });

  const reminder = reminderQuery.data;
  if (!eligible || !reminder?.visible) return null;

  const expiredLabel = reminder.expiredAt
    ? new Date(reminder.expiredAt).toLocaleDateString(undefined, {
        dateStyle: "medium",
      })
    : null;

  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <span
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-200"
          aria-hidden
        >
          <Clock3 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            Your Apex Pro subscription has expired
          </p>
          <p className="text-sm text-foreground/80">
            {expiredLabel ? `Your access ended on ${expiredLabel}. ` : ""}
            Resubscribe anytime to restore Pro features.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/pricing"
            onClick={hideBanner}
            className="rounded-md bg-apex-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
          >
            Resubscribe
          </Link>
          <button
            type="button"
            className="rounded-md border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-white/15"
            disabled={actionMutation.isPending}
            onClick={() => actionMutation.mutate("REMIND_LATER")}
          >
            Remind me tomorrow
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs font-medium text-foreground/75 transition hover:bg-white/10 hover:text-foreground"
            disabled={actionMutation.isPending}
            onClick={() => actionMutation.mutate("DISMISS")}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
