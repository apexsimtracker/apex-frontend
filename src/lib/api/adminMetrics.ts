import { fetchApi } from "./fetchClient";

export type AdminMetrics = {
  usersTotal: number;
  usersActiveNonDeleted: number;
  usersNewLast7Days: number;
  usersAdmins: number;
  sessionsTotal: number;
  lapsTotal: number;
  authSessionsTotal: number;
  authSessionsActive: number;
  discussionsTotal: number;
  discussionCommentsTotal: number;
  discussionLikesTotal: number;
  discussionViewsTotal: number;
  followsTotal: number;
  followRequestsTotal: number;
  notificationsTotal: number;
  challengeJoinsTotal: number;
  challengesWithJoins: number;
  proEntitlementsActive: number;
  proAccessActive: number;
  proCanceledAtPeriodEnd: number;
  proPastDue: number;
  proExpired: number;
  freeNoSubscriptionRow: number;
  proNewLast7d: number;
  proChurnedLast7d: number;
  byIntervalMonthly: number;
  byIntervalAnnual: number;
  staleSyncCount: number;
  sessionLikesTotal: number;
  sessionCommentsTotal: number;
  personalBestsTotal: number;
  emailCodesTotal: number;
  passwordResetCodesPending: number;
};

export type AccountsMetrics = Pick<
  AdminMetrics,
  "usersTotal" | "usersActiveNonDeleted" | "usersNewLast7Days" | "usersAdmins"
>;

export type RacingMetrics = Pick<
  AdminMetrics,
  | "sessionsTotal"
  | "lapsTotal"
  | "personalBestsTotal"
  | "sessionLikesTotal"
  | "sessionCommentsTotal"
>;

export type AuthSessionsMetrics = Pick<
  AdminMetrics,
  "authSessionsTotal" | "authSessionsActive"
>;

export type CommunityMetrics = Pick<
  AdminMetrics,
  | "discussionsTotal"
  | "discussionCommentsTotal"
  | "discussionLikesTotal"
  | "discussionViewsTotal"
>;

export type SocialMetrics = Pick<
  AdminMetrics,
  "followsTotal" | "followRequestsTotal" | "notificationsTotal"
>;

export type CompetitionMetrics = Pick<
  AdminMetrics,
  | "challengeJoinsTotal"
  | "challengesWithJoins"
  | "proEntitlementsActive"
  | "proAccessActive"
  | "proCanceledAtPeriodEnd"
  | "proPastDue"
  | "proExpired"
  | "freeNoSubscriptionRow"
  | "proNewLast7d"
  | "proChurnedLast7d"
  | "byIntervalMonthly"
  | "byIntervalAnnual"
  | "staleSyncCount"
>;

export type AuthSignalsMetrics = Pick<
  AdminMetrics,
  "emailCodesTotal" | "passwordResetCodesPending"
>;

export async function fetchAdminAccountsMetrics(): Promise<AccountsMetrics> {
  return fetchApi<AccountsMetrics>("GET", "/api/admin/metrics/accounts", undefined, false);
}

export async function fetchAdminRacingMetrics(): Promise<RacingMetrics> {
  return fetchApi<RacingMetrics>("GET", "/api/admin/metrics/racing", undefined, false);
}

export async function fetchAdminAuthSessionsMetrics(): Promise<AuthSessionsMetrics> {
  return fetchApi<AuthSessionsMetrics>("GET", "/api/admin/metrics/devices", undefined, false);
}

export async function fetchAdminCommunityMetrics(): Promise<CommunityMetrics> {
  return fetchApi<CommunityMetrics>("GET", "/api/admin/metrics/community", undefined, false);
}

export async function fetchAdminSocialMetrics(): Promise<SocialMetrics> {
  return fetchApi<SocialMetrics>("GET", "/api/admin/metrics/social", undefined, false);
}

export async function fetchAdminCompetitionMetrics(): Promise<CompetitionMetrics> {
  return fetchApi<CompetitionMetrics>("GET", "/api/admin/metrics/competition", undefined, false);
}

export async function fetchAdminAuthSignalsMetrics(): Promise<AuthSignalsMetrics> {
  return fetchApi<AuthSignalsMetrics>(
    "GET",
    "/api/admin/metrics/auth-signals",
    undefined,
    false
  );
}
