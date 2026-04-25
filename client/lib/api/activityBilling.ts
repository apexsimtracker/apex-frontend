import { apiGet, apiPost } from "./httpVerbs";
import { resolveApiUrl } from "./config";


export type SessionsFilterType = "all" | "telemetry" | "manual";

/** Default page size for GET /api/activity (must match server default). */
export const ACTIVITY_FEED_DEFAULT_LIMIT = 5;

export type ActivityFeedPageResult = {
  items: unknown[];
  page: number;
  limit: number;
  hasMore: boolean;
};

function feedToNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize one feed session item (GET /api/activity items). */
export function normalizeFeedSession(item: unknown): unknown {
  if (!item || typeof item !== "object") return item;
  const outer = item as Record<string, unknown>;
  const inner =
    outer.session && typeof outer.session === "object" ? (outer.session as Record<string, unknown>) : null;

  const merged: Record<string, unknown> = {
    ...(outer ?? {}),
    ...(inner ?? {}),
  };

  const bestLapMs =
    feedToNumber(merged.bestLapMs) ??
    feedToNumber(merged.bestLapTimeMs) ??
    feedToNumber(merged.best_lap_ms) ??
    feedToNumber(merged.bestLapTime) ??
    feedToNumber(merged.best_lap_time_ms) ??
    feedToNumber(merged.fastestLapMs) ??
    feedToNumber(merged.fastest_lap_ms) ??
    (merged.bestLap && typeof merged.bestLap === "object"
      ? feedToNumber((merged.bestLap as { lapTimeMs?: unknown }).lapTimeMs) ??
        feedToNumber((merged.bestLap as { timeMs?: unknown }).timeMs)
      : null);

  if (bestLapMs != null) merged.bestLapMs = bestLapMs;

  const rawAvatar =
    typeof merged.authorAvatarUrl === "string" ? merged.authorAvatarUrl.trim() : "";
  if (rawAvatar) {
    merged.authorAvatarUrl = resolveApiUrl(rawAvatar) ?? rawAvatar;
  }

  if (merged.commentCount == null && merged.commentsCount != null) {
    const cc = feedToNumber(merged.commentsCount);
    if (cc != null) merged.commentCount = cc;
  }
  const lk = feedToNumber(merged.likeCount);
  if (lk != null) merged.likeCount = lk;
  if (typeof merged.likedByMe !== "boolean" && merged.likedByMe != null) {
    merged.likedByMe = Boolean(merged.likedByMe);
  }

  return merged;
}

/**
 * Paginated activity feed (GET /api/activity).
 */
export async function getActivityFeedPage(options: {
  type?: SessionsFilterType;
  page?: number;
  limit?: number;
}): Promise<ActivityFeedPageResult> {
  const type = options.type ?? "all";
  const page = options.page ?? 1;
  const limit = options.limit ?? ACTIVITY_FEED_DEFAULT_LIMIT;
  const q = new URLSearchParams({
    type,
    page: String(page),
    limit: String(limit),
  });
  const raw = await apiGet<{
    items?: unknown[];
    page?: number;
    limit?: number;
    hasMore?: boolean;
  }>(`/api/activity?${q.toString()}`);

  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map(normalizeFeedSession),
    page: typeof raw?.page === "number" ? raw.page : page,
    limit: typeof raw?.limit === "number" ? raw.limit : limit,
    hasMore: Boolean(raw?.hasMore),
  };
}

/**
 * Home feed only: sessions from the current user and users they follow (GET /api/activity/home).
 * Requires authentication; callers should only invoke when a session token exists.
 */
export async function getActivityHomeFeedPage(options: {
  type?: SessionsFilterType;
  page?: number;
  limit?: number;
}): Promise<ActivityFeedPageResult> {
  const type = options.type ?? "all";
  const page = options.page ?? 1;
  const limit = options.limit ?? ACTIVITY_FEED_DEFAULT_LIMIT;
  const q = new URLSearchParams({
    type,
    page: String(page),
    limit: String(limit),
  });
  const raw = await apiGet<{
    items?: unknown[];
    page?: number;
    limit?: number;
    hasMore?: boolean;
  }>(`/api/activity/home?${q.toString()}`);

  const items = Array.isArray(raw?.items) ? raw.items : [];
  return {
    items: items.map(normalizeFeedSession),
    page: typeof raw?.page === "number" ? raw.page : page,
    limit: typeof raw?.limit === "number" ? raw.limit : limit,
    hasMore: Boolean(raw?.hasMore),
  };
}

/** Default page size for GET /api/sessions/:id/comments (must match server). */
export const SESSION_COMMENTS_PAGE_DEFAULT_LIMIT = 5;

export type SessionCommentItem = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
};

export type SessionCommentsPageResult = {
  comments: SessionCommentItem[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

/**
 * Paginated session comments (GET /api/sessions/:id/comments).
 */
export async function getSessionCommentsPage(
  sessionId: string,
  options: { page?: number; limit?: number } = {}
): Promise<SessionCommentsPageResult> {
  const page = options.page ?? 1;
  const limit = options.limit ?? SESSION_COMMENTS_PAGE_DEFAULT_LIMIT;
  const q = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const raw = await apiGet<{
    comments?: SessionCommentItem[];
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  }>(`/api/sessions/${encodeURIComponent(sessionId)}/comments?${q.toString()}`);

  const comments = Array.isArray(raw?.comments) ? raw.comments : [];
  return {
    comments,
    page: typeof raw?.page === "number" ? raw.page : page,
    limit: typeof raw?.limit === "number" ? raw.limit : limit,
    total: typeof raw?.total === "number" ? raw.total : comments.length,
    hasMore: Boolean(raw?.hasMore),
  };
}

// Billing / Upgrade
export type EntitlementPlan = "FREE" | "PRO";

export type UpgradeInfo = {
  effectivePlan: EntitlementPlan;
  canUpgrade: boolean;
  message: string;
};

export async function getUpgradeInfo(): Promise<UpgradeInfo> {
  return apiGet<UpgradeInfo>("/api/billing/upgrade-info");
}

export type ProWaitlistEntry = {
  fullName: string;
  contactEmail: string;
  company: string | null;
  message: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProWaitlistStatus = {
  joined: boolean;
  entry: ProWaitlistEntry | null;
};

export async function getProWaitlistStatus(): Promise<ProWaitlistStatus> {
  return apiGet<ProWaitlistStatus>("/api/billing/pro-waitlist");
}

export type ProWaitlistSubmitBody = {
  fullName: string;
  contactEmail: string;
  company?: string;
  message?: string;
};

export type ProWaitlistSubmitResponse = {
  success: boolean;
  entry: ProWaitlistEntry;
};

export async function submitProWaitlist(
  body: ProWaitlistSubmitBody
): Promise<ProWaitlistSubmitResponse> {
  return apiPost<ProWaitlistSubmitResponse>("/api/billing/pro-waitlist", body);
}

export type SystemStatusResponse = {
  environment?: string;
  version?: string;
  uptime?: number | string;
  db?: { status?: string; latencyMs?: number };
  featureFlags?: string[];
};

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  return apiGet<SystemStatusResponse>("/api/system/status");
}
