import { apiGet, apiPost, apiDelete } from "./httpVerbs";
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
export type NotificationItem = {
  id: string;
  type: "FOLLOW" | "FOLLOW_REQUEST" | "FOLLOW_REQUEST_ACCEPTED" | "REPLY" | "COMMENT";
  entityId: string | null;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
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

export type Competition = {
  id: string;
  title: string;
  sim: string;
  track: string;
  vehicle: string;
  targetTimeMs: number | null;
  /** Weekly challenge vs tournament — drives /challenges tab grouping. */
  kind?: "challenge" | "tournament";
  status: "LIVE" | "UPCOMING" | "FINISHED";
  participants: number;
  startsAt: string | null;
  endsAt: string | null;
};

export async function getCompetitions(): Promise<Competition[]> {
  return apiGet<Competition[]>("/api/competitions");
}

export type CompetitionSummary = Competition & {
  yourBestLapMs: number | null;
  fastestLapMs: number | null;
  yourPosition: number | null;
  timeRemainingSec: number | null;
  joined: boolean;
  /** Present on /summary and GET /competitions/:id responses. */
  isSupported?: boolean;
};

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize lap ms fields from camelCase or snake_case API responses. */
function normalizeCompetitionSummaryRow(row: CompetitionSummary): CompetitionSummary {
  const fastest =
    toNum(row.fastestLapMs) ??
    toNum((row as unknown as { fastest_lap_ms?: unknown }).fastest_lap_ms);
  const your =
    toNum(row.yourBestLapMs) ??
    toNum((row as unknown as { your_best_lap_ms?: unknown }).your_best_lap_ms);
  return {
    ...row,
    fastestLapMs: fastest ?? null,
    yourBestLapMs: your ?? null,
  };
}

/**
 * Maps GET /api/competitions (public, no auth) into CompetitionSummary rows so
 * /challenges can load for logged-out users. User-specific fields are null; join uses login redirect.
 */
export function mapCompetitionsToPublicSummaries(list: Competition[]): CompetitionSummary[] {
  const now = Date.now();
  return list.map((c) =>
    normalizeCompetitionSummaryRow({
      ...c,
      yourBestLapMs: null,
      fastestLapMs: null,
      yourPosition: null,
      timeRemainingSec:
        c.endsAt != null
          ? Math.max(0, Math.floor((new Date(c.endsAt).getTime() - now) / 1000))
          : null,
      joined: false,
    })
  );
}

export async function getCompetitionSummary(): Promise<CompetitionSummary[]> {
  const raw = await apiGet<CompetitionSummary[]>("/api/competitions/summary");
  return Array.isArray(raw) ? raw.map(normalizeCompetitionSummaryRow) : [];
}

/** Single competition detail (GET /api/competitions/:id). Falls back to summary list if backend has no detail endpoint. */
export type CompetitionDetail = CompetitionSummary & {
  description?: string | null;
  rules?: string[] | null;
};

export async function getCompetition(id: string): Promise<CompetitionDetail | null> {
  try {
    const data = await apiGet<CompetitionDetail>(`/api/competitions/${encodeURIComponent(id)}`);
    if (!data || typeof data !== "object") return null;
    return normalizeCompetitionSummaryRow(data as CompetitionSummary) as CompetitionDetail;
  } catch {
    return null;
  }
}

export type CompetitionsMeta = {
  activeChallenges: number;
  joinedThisSeason: number;
  yourRank: number | null;
};

export async function getCompetitionsMeta(): Promise<CompetitionsMeta> {
  return apiGet<CompetitionsMeta>("/api/competitions/meta");
}

export async function joinCompetition(
  id: string
): Promise<{ ok: boolean; competitionId: string }> {
  return apiPost<{ ok: boolean; competitionId: string }>(
    `/api/competitions/${id}/join`,
    {}
  );
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error && /Failed to fetch/i.test(err.message))
  );
}
