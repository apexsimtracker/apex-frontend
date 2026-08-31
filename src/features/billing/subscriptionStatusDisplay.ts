import type { AuthUser } from "@/lib/api";
import { isActiveBetaTrial } from "./betaTrial";

export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";

type SubscriptionUserFields = Pick<
  AuthUser,
  | "hasPro"
  | "subscriptionStatus"
  | "cancelAtPeriodEnd"
  | "currentPeriodEnd"
  | "isBetaUser"
  | "betaTrialExpiresAt"
>;

export function isSubscriptionCanceled(
  user: SubscriptionUserFields | null | undefined,
): boolean {
  if (!user) return false;
  return (
    user.subscriptionStatus === "CANCELED" || user.cancelAtPeriodEnd === true
  );
}

export function formatAccessUntilLabel(
  currentPeriodEnd: string | null | undefined,
): string | null {
  if (!currentPeriodEnd) return null;
  return new Date(currentPeriodEnd).toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

export function subscriptionStatusLabel(
  user: SubscriptionUserFields | null | undefined,
): string {
  if (!user?.hasPro) return "Free";
  if (isActiveBetaTrial(user)) {
    return "Pro (complimentary access)";
  }
  if (user.subscriptionStatus === "CANCELED" || user.cancelAtPeriodEnd) {
    return "Pro (canceled — access until period end)";
  }
  if (user.subscriptionStatus === "PAST_DUE") {
    return "Pro (payment issue — grace period)";
  }
  return "Pro (active)";
}

export function subscriptionPeriodEndLabel(
  user: SubscriptionUserFields | null | undefined,
): string {
  if (!user?.hasPro) return "Renews / period ends";
  if (isSubscriptionCanceled(user)) return "Access until";
  return "Renews / period ends";
}
