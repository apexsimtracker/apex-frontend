import type { AuthUser } from "@/lib/api/authAndContact";

type BetaTrialUserFields = Pick<
  AuthUser,
  | "isBetaUser"
  | "betaTrialStartedAt"
  | "betaTrialExpiresAt"
  | "hasPro"
  | "hasPaidPro"
  | "signupTrialStartedAt"
  | "signupTrialExpiresAt"
>;

/** Open complimentary-access window: inclusive start and exclusive expiry. */
export function isActiveBetaTrial(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!user?.isBetaUser || user.betaTrialExpiresAt == null) return false;
  const startsAt =
    user.betaTrialStartedAt == null
      ? null
      : Date.parse(user.betaTrialStartedAt);
  const expiresAt = Date.parse(user.betaTrialExpiresAt);
  if (
    Number.isNaN(expiresAt) ||
    (startsAt != null && Number.isNaN(startsAt))
  ) {
    return false;
  }
  return (startsAt == null || startsAt <= now) && now < expiresAt;
}

/** Automatic signup trial: inclusive start and exclusive expiry. */
export function isActiveSignupTrial(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!user?.signupTrialStartedAt || !user.signupTrialExpiresAt) return false;
  const startsAt = Date.parse(user.signupTrialStartedAt);
  const expiresAt = Date.parse(user.signupTrialExpiresAt);
  if (Number.isNaN(startsAt) || Number.isNaN(expiresAt)) return false;
  return startsAt <= now && now < expiresAt;
}

export function isActiveComplimentaryAccess(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  return isActiveBetaTrial(user, now) || isActiveSignupTrial(user, now);
}

/**
 * Paid Pro (store subscription), not complimentary beta-only access.
 * Prefer explicit `hasPaidPro` from AuthUser / billing refresh when present.
 */
export function isPaidProUser(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): boolean {
  if (user?.hasPaidPro === true) return true;
  if (user?.hasPaidPro === false) return false;
  return user?.hasPro === true && !isActiveComplimentaryAccess(user, now);
}

export function formatBetaTrialEndsLabel(
  expiresAt: string | null | undefined,
): string | null {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function complimentaryAccessExpiresAt(
  user: BetaTrialUserFields | null | undefined,
  now: number = Date.now(),
): string | null {
  const expiries: string[] = [];
  if (isActiveBetaTrial(user, now) && user?.betaTrialExpiresAt) {
    expiries.push(user.betaTrialExpiresAt);
  }
  if (isActiveSignupTrial(user, now) && user?.signupTrialExpiresAt) {
    expiries.push(user.signupTrialExpiresAt);
  }
  return (
    expiries
      .filter((value) => !Number.isNaN(Date.parse(value)))
      .sort((a, b) => Date.parse(b) - Date.parse(a))[0] ?? null
  );
}

export function betaAccessDurationDays(
  user: Pick<AuthUser, "betaTrialStartedAt" | "betaTrialExpiresAt"> | null | undefined,
): number | null {
  if (!user?.betaTrialStartedAt || !user.betaTrialExpiresAt) return null;
  const startsAt = Date.parse(user.betaTrialStartedAt);
  const expiresAt = Date.parse(user.betaTrialExpiresAt);
  if (
    Number.isNaN(startsAt) ||
    Number.isNaN(expiresAt) ||
    expiresAt <= startsAt
  ) {
    return null;
  }
  const days = (expiresAt - startsAt) / (24 * 60 * 60 * 1000);
  return Math.round(days * 10) / 10;
}

export function formatBetaAccessDuration(
  user: Pick<AuthUser, "betaTrialStartedAt" | "betaTrialExpiresAt"> | null | undefined,
): string | null {
  const days = betaAccessDurationDays(user);
  if (days == null) return null;
  return `${days}-day`;
}
