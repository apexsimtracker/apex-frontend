import { fetchApi } from "./fetchClient";

export type AdminMetrics = {
  usersTotal: number;
  usersActiveNonDeleted: number;
  usersNewLast7Days: number;
  usersAdmins: number;
  sessionsTotal: number;
  lapsTotal: number;
  devicesTotal: number;
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
  proWaitlistTotal: number;
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

export type DevicesMetrics = Pick<
  AdminMetrics,
  "devicesTotal" | "authSessionsTotal" | "authSessionsActive"
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
  "challengeJoinsTotal" | "challengesWithJoins" | "proEntitlementsActive" | "proWaitlistTotal"
>;

export type AuthSignalsMetrics = Pick<
  AdminMetrics,
  "emailCodesTotal" | "passwordResetCodesPending"
>;

// Legacy aggregate endpoint. The dashboard now uses the per-section fetchers
// below for progressive rendering, but this is preserved for back-compat.
export async function fetchAdminMetrics(): Promise<AdminMetrics> {
  return fetchApi<AdminMetrics>("GET", "/api/admin/metrics", undefined, false);
}

export async function fetchAdminAccountsMetrics(): Promise<AccountsMetrics> {
  return fetchApi<AccountsMetrics>("GET", "/api/admin/metrics/accounts", undefined, false);
}

export async function fetchAdminRacingMetrics(): Promise<RacingMetrics> {
  return fetchApi<RacingMetrics>("GET", "/api/admin/metrics/racing", undefined, false);
}

export async function fetchAdminDevicesMetrics(): Promise<DevicesMetrics> {
  return fetchApi<DevicesMetrics>("GET", "/api/admin/metrics/devices", undefined, false);
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
