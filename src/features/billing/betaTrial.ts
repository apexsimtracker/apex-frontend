import type { AuthUser } from "@/lib/api/authAndContact";

type BetaTrialUserFields = Pick<
  AuthUser,
  "isBetaUser" | "betaTrialExpiresAt" | "hasPro"
>;

/** Open beta trial window: cohort flag + exclusive expiry (`now < expiresAt`). */
export function isActiveBetaTrial(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!user?.isBetaUser || user.betaTrialExpiresAt == null) return false;
  const expiresAt = Date.parse(user.betaTrialExpiresAt);
  if (Number.isNaN(expiresAt)) return false;
  return now < expiresAt;
}

/** Paid Pro (RevenueCat), not trial-only access. */
export function isPaidProUser(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  return user?.hasPro === true && !isActiveBetaTrial(user, now);
}

export function formatBetaTrialEndsLabel(
  expiresAt: string | null | undefined,
): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}
