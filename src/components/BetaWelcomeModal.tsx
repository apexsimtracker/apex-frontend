import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";
import { appPrimaryButtonClassName } from "@/components/app-ui/appButtonClasses";
import { AUTH_ME_QUERY_KEY, useAuth } from "@/contexts/AuthContext";
import { dismissBetaWelcome, type AuthUser } from "@/lib/api/authAndContact";
import { cn } from "@/lib/utils";

export default function BetaWelcomeModal() {
  const { user, loading } = useAuth();
  const queryClient = useQueryClient();
  const [locallyDismissed, setLocallyDismissed] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  const needsWelcome =
    !loading &&
    user != null &&
    user.isBetaUser === true &&
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

  if (!isOpen) {
    return null;
  }

  return (
    <AppBaseModal
      isOpen={isOpen}
      onClose={() => {
        void persistDismiss();
      }}
      title="Welcome to Apex Beta"
      description="You have 30 days of full Pro access — unlimited history, analytics, and agent uploads."
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
            Get Started
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
          paid plan ends the free trial and continues your Pro access under your
          subscription.
        </p>
      </div>
    </AppBaseModal>
  );
}
