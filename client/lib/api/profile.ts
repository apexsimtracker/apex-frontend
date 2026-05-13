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
};

// Profile summary endpoint is optional; current backend may not implement it yet.
// Prefer authMe() for current user; this function is not used by the main profile page.
export async function getProfileSummary(): Promise<ProfileSummary> {
  return apiGet<ProfileSummary>("/api/profile/summary");
}

/** GET /api/profile/summary/:userId — same shape as getProfileSummary; public. */
export async function getProfileSummaryForUser(
  userId: string,
  type?: "all" | "telemetry" | "manual"
): Promise<ProfileSummary> {
  const q =
    type && type !== "all"
      ? `?type=${encodeURIComponent(type)}`
      : "";
  return apiGet<ProfileSummary>(
    `/api/profile/summary/${encodeURIComponent(userId)}${q}`
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
    `/api/profile/race-history${q ? `?${q}` : ""}`
  );
}

export async function getProfileRaceHistoryForUser(
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    type?: "all" | "telemetry" | "manual";
  }
): Promise<RaceHistoryPageResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.type && params.type !== "all") sp.set("type", params.type);
  const q = sp.toString();
  return apiGet<RaceHistoryPageResult>(
    `/api/profile/${encodeURIComponent(userId)}/race-history${q ? `?${q}` : ""}`
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
  challengeBadges?: {
    challengeId: string;
    challengeTitle: string;
    sim: string;
    place: number;
    tier: "GOLD" | "SILVER" | "BRONZE" | string;
    awardedAt: string;
  }[];
};

/** Row in GET .../followers and .../following paginated lists (same shape as UserPublicProfile). */
export type FollowUser = UserPublicProfile;

export async function getUserPublicProfile(userId: string): Promise<UserPublicProfile> {
  return apiGet<UserPublicProfile>(`/api/users/${encodeURIComponent(userId)}`);
}

/** PATCH /api/settings/privacy — Bearer session */
export type PrivacySettingsPayload = {
  privateProfile: boolean;
  manualFollowApproval: boolean;
  sessionVisibility: SessionVisibility;
};

export async function patchPrivacySettings(
  body: Partial<PrivacySettingsPayload>
): Promise<PrivacySettingsPayload> {
  return fetchApi<PrivacySettingsPayload>("PATCH", "/api/settings/privacy", body);
}

/** PATCH /api/settings/notifications — Bearer session */
export type NotificationSettingsPayload = {
  emailNotifications: boolean;
  showNotificationBadge: boolean;
};

export async function patchNotificationSettings(
  body: Partial<NotificationSettingsPayload>
): Promise<NotificationSettingsPayload> {
  return fetchApi<NotificationSettingsPayload>("PATCH", "/api/settings/notifications", body);
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
    | "REPLY"
    | "COMMENT"
    | "SYSTEM_ANNOUNCEMENT";
  entityId: string | null;
  read: boolean;
  createdAt: string;
  /** Populated only for SYSTEM_ANNOUNCEMENT */
  title?: string | null;
  body?: string | null;
  linkUrl?: string | null;
  severity?: NotificationSeverity | null;
  /** Null for SYSTEM_ANNOUNCEMENT (no actor user). */
  actor: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export async function getNotifications(): Promise<{ notifications: NotificationItem[] }> {
  return apiGet<{ notifications: NotificationItem[] }>("/api/notifications");
}

export async function markNotificationsRead(ids?: string[]): Promise<{ marked: number }> {
  return fetchApi<{ marked: number }>(
    "POST",
    "/api/notifications/read",
    ids && ids.length > 0 ? { ids } : {}
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

export async function listFollowRequests(): Promise<{ requests: FollowRequestListItem[] }> {
  return apiGet<{ requests: FollowRequestListItem[] }>("/api/me/follow-requests");
}

export async function acceptFollowRequest(requestId: string): Promise<{ ok: boolean }> {
  return fetchApi<{ ok: boolean }>(
    "POST",
    `/api/me/follow-requests/${encodeURIComponent(requestId)}/accept`,
    {}
  );
}

export async function declineFollowRequest(requestId: string): Promise<{ ok: boolean }> {
  return fetchApi<{ ok: boolean }>(
    "POST",
    `/api/me/follow-requests/${encodeURIComponent(requestId)}/decline`,
    {}
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

/** @deprecated alias — use ChallengeSummary */
export type CompetitionSummary = import("./challenges").ChallengeSummary;

/** @deprecated alias — use ChallengeDetail */
export type CompetitionDetail = import("./challenges").ChallengeDetail & {
  rules?: string[] | null;
};

/** @deprecated alias — use ChallengeListItem */
export type Competition = import("./challenges").ChallengeListItem;

export type CompetitionsMeta = import("./challenges").ChallengesMeta;

export async function getCompetitions(): Promise<Competition[]> {
  const res = await import("./challenges").then((m) =>
    m.getChallengeList({
      /** Logged-out /challenges needs ENDED rows for Past + All tabs (same as omitting status on the API). */
      status: "UPCOMING,ACTIVE,ENDED",
      pageSize: 100,
    })
  );
  return res.items;
}

/** Maps public challenge list rows into summary-shaped rows for logged-out /challenges UI. */
export function mapCompetitionsToPublicSummaries(
  list: Competition[]
): import("./challenges").ChallengeSummary[] {
  const now = Date.now();
  return list.map((c) => ({
    id: c.id,
    title: c.title,
    sim: c.sim,
    track: c.track,
    vehicle: c.vehicle,
    kind: "challenge",
    status: c.status,
    participants: c.participants,
    startsAt: c.startsAt,
    endsAt: c.endsAt,
    targetTimeMs: c.targetTimeMs,
    yourBestLapMs: null,
    fastestLapMs: c.fastestLapMs,
    yourPosition: null,
    timeRemainingSec:
      c.status === "ACTIVE" && c.endsAt
        ? Math.max(0, Math.floor((new Date(c.endsAt).getTime() - now) / 1000))
        : null,
    joined: false,
    isSupported: true,
  }));
}

export async function getCompetitionSummary(): Promise<CompetitionSummary[]> {
  const { getChallengeSummary } = await import("./challenges");
  return getChallengeSummary();
}

export async function getCompetition(id: string): Promise<CompetitionDetail | null> {
  const { getChallenge } = await import("./challenges");
  const row = await getChallenge(id);
  return row as CompetitionDetail | null;
}

export async function getCompetitionsMeta(): Promise<CompetitionsMeta> {
  const { getChallengesMeta } = await import("./challenges");
  return getChallengesMeta();
}

export async function joinCompetition(
  id: string
): Promise<{ ok: boolean; competitionId: string }> {
  const { joinChallenge } = await import("./challenges");
  const r = await joinChallenge(id);
  return { ok: r.ok, competitionId: r.challengeId };
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error && /Failed to fetch/i.test(err.message))
  );
}
