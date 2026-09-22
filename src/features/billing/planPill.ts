import type { AuthUser } from "@/lib/api/authAndContact";
import { isActiveBetaTrial, isActiveSignupTrial } from "./betaTrial";

export type PlanTier = "FREE" | "PRO" | "BETA" | "TRIAL";

type PlanTierUserFields = Pick<
  AuthUser,
  | "isBetaUser"
  | "betaTrialExpiresAt"
  | "hasPro"
  | "signupTrialStartedAt"
  | "signupTrialExpiresAt"
>;

/**
 * Beta outranks Pro: a trial user has Pro access but has not paid. Buying Pro
 * closes the trial window server-side, so paid subscribers resolve to `PRO`.
 */
export function planTierForUser(
  user: PlanTierUserFields | null | undefined,
  now: number = Date.now(),
): PlanTier {
  if (isActiveBetaTrial(user, now)) return "BETA";
  if (isActiveSignupTrial(user, now)) return "TRIAL";
  return user?.hasPro === true ? "PRO" : "FREE";
}

export function planTierLabel(tier: PlanTier): string {
  switch (tier) {
    case "BETA":
      return "Beta";
    case "PRO":
      return "Pro";
    case "TRIAL":
      return "Trial";
    case "FREE":
      return "Free";
  }
}
