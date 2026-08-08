import type { AuthUser } from "@/lib/api/authAndContact";
import { isActiveBetaTrial } from "./betaTrial";

export type PlanTier = "FREE" | "PRO" | "BETA";

type PlanTierUserFields = Pick<
  AuthUser,
  "isBetaUser" | "betaTrialExpiresAt" | "hasPro"
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
  return user?.hasPro === true ? "PRO" : "FREE";
}

export function planTierLabel(tier: PlanTier): string {
  switch (tier) {
    case "BETA":
      return "Beta";
    case "PRO":
      return "Pro";
    case "FREE":
      return "Free";
  }
}
