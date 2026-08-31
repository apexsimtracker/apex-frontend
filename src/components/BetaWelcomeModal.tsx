import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { AUTH_ME_QUERY_KEY, useAuth } from "@/contexts/AuthContext";
import { dismissBetaWelcome, type AuthUser } from "@/lib/api/authAndContact";
import {
  formatBetaAccessDuration,
  formatBetaTrialEndsLabel,
  isActiveBetaTrial,
} from "@/features/billing/betaTrial";
import { cn } from "@/lib/utils";

export function betaAccessNoticeCopy(user: AuthUser): {
  title: string;
  description: string;
} {
  const duration = formatBetaAccessDuration(user);
  const endsAt = formatBetaTrialEndsLabel(user.betaTrialExpiresAt);
  const previousEnd = formatBetaTrialEndsLabel(
    user.betaAccessPreviousExpiresAt,
  );
  const durationText = duration ? `a ${duration} period of` : "complimentary";
  const durationLength = duration?.replace("-day", " days");
  const endingText = endsAt ? ` Your access runs until ${endsAt}.` : "";

  switch (user.betaAccessNoticeType) {
    case "WELCOME":
      return {
        title: "Welcome to Apex Pro",
        description: `You have ${durationText} full Pro access — unlimited history, analytics, and agent uploads.${endingText}`,
      };
    case "EXTENDED":
      return {
        title: "Your Pro access was extended",
        description:
          previousEnd && endsAt
            ? `Your complimentary Pro access was extended from ${previousEnd} to ${endsAt}.${durationLength ? ` Your updated access window is ${durationLength}.` : ""}`
            : `Your complimentary Pro access has been extended.${endingText}`,
      };
    case "RESTORED":
      return {
        title: "Your Pro access was restored",
        description: `You have been given ${durationText} full Pro access.${endingText}`,
      };
    case "UPDATED":
      return {
        title: "Your Pro access was updated",
        description: `Your complimentary Pro access period has been updated.${endingText}`,
      };
    case "GRANTED":
    default:
      return {
        title: "You’ve been given Pro access",
        description: `An administrator has given you ${durationText} full Pro access — unlimited history, analytics, and agent uploads.${endingText}`,
      };
  }
}

export default function BetaWelcomeModal() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [locallyDismissed, setLocallyDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const needsWelcome =
    !loading &&
    user != null &&
    user.isBetaUser === true &&
    isActiveBetaTrial(user) &&
    user.hasSeenBetaWelcomeModal === false;

  const isOpen = needsWelcome && !locallyDismissed;

  const persistDismiss = useCallback(async () => {
    if (!user || locallyDismissed) return;
    setLocallyDismissed(true);
    setDismissing(true);

    const optimistic: AuthUser = {
      ...user,
      hasSeenBetaWelcomeModal: true,
    };
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, optimistic);

    try {
      const updated = await dismissBetaWelcome();
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, updated);
    } catch {
      queryClient.setQueryData(AUTH_ME_QUERY_KEY, optimistic);
    } finally {
      setDismissing(false);
    }
  }, [locallyDismissed, queryClient, user]);

  if (!isOpen || !user) {
    return null;
  }

  const notice = betaAccessNoticeCopy(user);

  return (
    <AppBaseModal
      isOpen={isOpen}
      onClose={() => {
        void persistDismiss();
      }}
      title={notice.title}
      description={notice.description}
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className={cn(
              appPrimaryButtonClassName,
              "inline-flex items-center justify-center px-4 py-2",
            )}
            disabled={dismissing}
            onClick={() => {
              void persistDismiss();
            }}
          >
            Continue
          </button>
        </div>
      }
    >
      <div className="flex items-start gap-3 font-apex-body text-sm text-apex-on-surface-variant">
        <Sparkles
          className="mt-0.5 size-4 shrink-0 text-apex-primary"
          aria-hidden
        />
        <p>
          When you are ready, you can subscribe to Apex Pro anytime. Starting a
          paid plan ends complimentary access and continues your Pro access
          under your subscription.
        </p>
      </div>
    </AppBaseModal>
  );
}
