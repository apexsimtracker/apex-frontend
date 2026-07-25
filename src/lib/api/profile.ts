import { apiGet, apiDelete } from "./httpVerbs";
import { fetchApi } from "./fetchClient";

/** Per-metric progress toward weekly goals (GET /api/profile/summary). */
export type WeeklyGoalMetric = {
  current: number;
  target: number;
};

export type WeeklyGoalsSummary = {
  races: WeeklyGoalMetric;
  podiums: WeeklyGoalMetric;
  laps: WeeklyGoalMetric;
};

export type ProfileSummary = {
  user: {
    id: string;
    displayName: string;
    streakDays: number;
    tagline?: string;
    bio?: string;
    level?: number;
    levelProgressPct?: number;
  };
  totals: {
    races: number;
    wins: number | null;
    podiums: number | null;
    poles: number | null;
    fastestLaps: number;
    avgFinish: number | null;
  };
  weekly: {
    buckets: {
      Mon: number;
      Tue: number;
      Wed: number;
      Thu: number;
      Fri: number;
      Sat: number;
      Sun: number;
    };
    totalRaces: number;
    wins: number | null;
    avgFinish: number | null;
    totalKm: number | null;
  };
  mostPlayed: Array<{
    sim: string;
    sessions: number;
    km: number | null;
    pctOfTotal: number;
  }>;
  raceHistory: Array<{
    id: string;
    date: string;
    sim: string;
    simKey?: string;
    car: string;
    track: string;
    trackName?: string | null;
    carName?: string | null;
    position: number | null;
    qualiPos: number | null;
    bestLapMs: number | null;
    source?: string | null;
    manualSessionKind?: string | null;
  }>;
  statsByGame: Array<{
    sim: string;
    races: number;
    wins: number | null;
    podiums: number | null;
    poles: number | null;
    fastestLaps: number;
    winPct: number | null;
    podiumPct: number | null;
  }>;
  insight: {
    title: string;
    body: string;
    sessionId: string;
  } | null;
  /** ISO week window + deltas; returned by profile summary API. */
  weeklySnapshot?: {
    weekStart: string;
    weekEnd: string;
    sessions: number;
    sessionsDelta: number;
    trackTimeSec: number;
    trackTimeSecDelta: number;
    laps: number;
    lapsDelta: number;
  };
  /** Canonical weekly goal progress for the profile user (same as server-side stats). */
  weeklyGoals?: WeeklyGoalsSummary;
  /** TREND-01 weekly coaching line (own profile summary only). */
  apexTrendInsight?:
    | { locked: false; insight: string | null }
    | { locked: true; message: string };
};

/** GET /api/profile/summary — owned profile stats (SQL aggregates). */
export async function getProfileSummary(): Promise<ProfileSummary> {
  return apiGet<ProfileSummary>("/api/profile/summary");
}

export type ProfileHomeWeekly = Pick<
  ProfileSummary,
  "weeklySnapshot" | "weeklyGoals"
>;

export async function getProfileHomeWeekly(): Promise<ProfileHomeWeekly> {
  return apiGet<ProfileHomeWeekly>("/api/profile/home-weekly");
}

export type ProfileTrendInsight = Pick<ProfileSummary, "apexTrendInsight">;

export async function getProfileTrendInsight(): Promise<ProfileTrendInsight> {
  return apiGet<ProfileTrendInsight>("/api/profile/trend-insight");
}

/** GET /api/profile/summary/:userId — same shape as getProfileSummary; public. */
export async function getProfileSummaryForUser(
  userId: string,
  type?: "all" | "telemetry" | "manual",
): Promise<ProfileSummary> {
  const q = type && type !== "all" ? `?type=${encodeURIComponent(type)}` : "";
  return apiGet<ProfileSummary>(
    `/api/profile/summary/${encodeURIComponent(userId)}${q}`,
  );
}

/** Default page size for race history (must match server default). */
export const RACE_HISTORY_PAGE_SIZE = 6;

export type RaceHistoryPageResult = {
  items: ProfileSummary["raceHistory"];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function getProfileRaceHistory(params?: {
  page?: number;
  limit?: number;
  type?: "all" | "telemetry" | "manual";
}): Promise<RaceHistoryPageResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.type && params.type !== "all") sp.set("type", params.type);
  const q = sp.toString();
  return apiGet<RaceHistoryPageResult>(
    `/api/profile/race-history${q ? `?${q}` : ""}`,
  );
}

export async function getProfileRaceHistoryForUser(
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: "all" | "telemetry" | "manual";
  },
): Promise<RaceHistoryPageResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.type && params.type !== "all") sp.set("type", params.type);
  const q = sp.toString();
  return apiGet<RaceHistoryPageResult>(
    `/api/profile/${encodeURIComponent(userId)}/race-history${q ? `?${q}` : ""}`,
  );
}

/** GET /api/users/:userId — profile preview (may mask counts/bio when private). */
export type FollowRelationship = "self" | "following" | "pending" | "none";

/** Controls session detail URLs and race history visibility (synced with server User.sessionVisibility). */
export type SessionVisibility = "PUBLIC" | "FOLLOWERS_ONLY" | "PRIVATE";

/** GET /api/users/:userId — public profile preview (avatar, bio, follow counts). */
export type UserPublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  followersCount: number | null;
  followingCount: number | null;
  isFollowing: boolean;
  privateProfile: boolean;
  viewerHasAccess: boolean;
  followRelationship: FollowRelationship;
  /** Set when viewerHasAccess is true — used for race history empty-state copy. */
  sessionVisibility: SessionVisibility | null;
  isPro: boolean;
  /** Visible badge count (excludes challenges the user is banned from). */
  challengeBadgeCount?: number;
  challengeBadges?: {
    challengeId: string;
    challengeTitle: string;
    sim: string;
    place: number;
    tier: "GOLD" | "SILVER" | "BRONZE" | string;
    awardedAt: string;
  }[];
};

/** Row in GET .../challenge-badges paginated list. */
export type UserChallengeBadge = NonNullable<
  UserPublicProfile["challengeBadges"]
>[number];

export type UserChallengeBadgesPage = {
  items: UserChallengeBadge[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** Default page size for challenge badge history modal (must match server). */
export const CHALLENGE_BADGES_PAGE_SIZE = 10;

/** Row in GET .../followers and .../following paginated lists (same shape as UserPublicProfile). */
export type FollowUser = UserPublicProfile;

export async function getUserPublicProfile(
  userId: string,
): Promise<UserPublicProfile> {
  return apiGet<UserPublicProfile>(`/api/users/${encodeURIComponent(userId)}`);
}

/** GET /api/users/:userId/challenge-badges — paginated podium history. */
export async function getUserChallengeBadgesPage(
  userId: string,
  params?: { page?: number; pageSize?: number },
): Promise<UserChallengeBadgesPage> {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? CHALLENGE_BADGES_PAGE_SIZE;
  const sp = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return apiGet<UserChallengeBadgesPage>(
    `/api/users/${encodeURIComponent(userId)}/challenge-badges?${sp.toString()}`,
  );
}

/** GET /api/users/founder — public founder profile (avatar + display name), no auth. */
export type FounderPublicProfile = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export async function getFounderPublicProfile(): Promise<FounderPublicProfile> {
  return apiGet<FounderPublicProfile>("/api/users/founder");
}

/** PATCH /api/settings/privacy — Bearer session */
export type PrivacySettingsPayload = {
  privateProfile: boolean;
  manualFollowApproval: boolean;
  sessionVisibility: SessionVisibility;
};

export async function patchPrivacySettings(
  body: Partial<PrivacySettingsPayload>,
): Promise<PrivacySettingsPayload> {
  return fetchApi<PrivacySettingsPayload>(
    "PATCH",
    "/api/settings/privacy",
    body,
  );
}

/** PATCH /api/settings/notifications — Bearer session */
export type InAppNotificationPrefs = {
  social: boolean;
  challenges: boolean;
  activity: boolean;
  account: boolean;
};

export type NotificationSettingsPayload = {
  emailNotifications: boolean;
  showNotificationBadge: boolean;
  inAppNotificationPrefs: InAppNotificationPrefs;
};

export type NotificationSettingsPatch = {
  emailNotifications?: boolean;
  showNotificationBadge?: boolean;
  inAppNotificationPrefs?: Partial<InAppNotificationPrefs>;
};

export async function patchNotificationSettings(
  body: NotificationSettingsPatch,
): Promise<NotificationSettingsPayload> {
  return fetchApi<NotificationSettingsPayload>(
    "PATCH",
    "/api/settings/notifications",
    body,
  );
}

/** GET /api/notifications */
export type NotificationSeverity =
  | "INFO"
  | "SUCCESS"
  | "WARNING"
  | "CRITICAL"
  | "MAINTENANCE";

export type NotificationItem = {
  id: string;
  type:
    | "FOLLOW"
    | "FOLLOW_REQUEST"
    | "FOLLOW_REQUEST_ACCEPTED"
    | "FOLLOW_REQUEST_DECLINED"
    | "REPLY"
    | "COMMENT"
    | "SESSION_LIKE"
    | "SESSION_COMMENT"
    | "CHALLENGE_STARTED"
    | "CHALLENGE_ENDED"
    | "CHALLENGE_WON"
    | "CHALLENGE_BANNED"
    | "CHALLENGE_REMOVED"
    | "SUBSCRIPTION_ACTIVATED"
    | "SUBSCRIPTION_CANCELLED"
    | "SUBSCRIPTION_EXPIRED"
    | "ACCOUNT_SUSPENDED"
    | "SYSTEM_ANNOUNCEMENT";
  entityId: string | null;
  read: boolean;
  createdAt: string;
  /** Populated for rich/system notifications */
  title?: string | null;
  body?: string | null;
  linkUrl?: string | null;
  severity?: NotificationSeverity | null;
  /** Null for rich/system notifications without an actor. */
  actor: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export async function getNotifications(): Promise<{
  notifications: NotificationItem[];
  unreadCount: number;
}> {
  return apiGet<{ notifications: NotificationItem[]; unreadCount: number }>(
    "/api/notifications"
  );
}

export async function markNotificationsRead(
  ids?: string[],
): Promise<{ marked: number }> {
  return fetchApi<{ marked: number }>(
    "POST",
    "/api/notifications/read",
    ids && ids.length > 0 ? { ids } : {},
  );
}

/** DELETE /api/notifications — remove all notifications for the current user */
export async function clearNotifications(): Promise<{ deleted: number }> {
  return apiDelete<{ deleted: number }>("/api/notifications");
}

/** GET /api/me/follow-requests — pending inbound */
export type FollowRequestListItem = {
  id: string;
  createdAt: string;
  follower: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

export async function listFollowRequests(): Promise<{
  requests: FollowRequestListItem[];
}> {
  return apiGet<{ requests: FollowRequestListItem[] }>(
    "/api/me/follow-requests",
  );
}

export async function acceptFollowRequest(
  requestId: string,
): Promise<{ ok: boolean }> {
  return fetchApi<{ ok: boolean }>(
    "POST",
    `/api/me/follow-requests/${encodeURIComponent(requestId)}/accept`,
    {},
  );
}

export async function declineFollowRequest(
  requestId: string,
): Promise<{ ok: boolean }> {
  return fetchApi<{ ok: boolean }>(
    "POST",
    `/api/me/follow-requests/${encodeURIComponent(requestId)}/decline`,
    {},
  );
}

export type {
  ChallengeApiStatus,
  ChallengeSummary,
  ChallengeDetail,
  ChallengesMeta,
  ChallengeListItem,
} from "./challenges";

export {
  getChallengeSummary,
  getChallenge,
  getChallengesMeta,
  joinChallenge,
  getChallengeList,
} from "./challenges";

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error && /Failed to fetch/i.test(err.message))
  );
}
