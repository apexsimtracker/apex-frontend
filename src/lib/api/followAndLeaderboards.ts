import { apiGet, apiPost, apiDelete } from "./httpVerbs";
import type { UserPublicProfile, FollowUser } from "./profile";
import { RACE_HISTORY_PAGE_SIZE } from "./profile";

/** Default page size for follower/following lists (must match server FOLLOW_LIST_DEFAULT_LIMIT). */
export const FOLLOW_LIST_PAGE_SIZE = RACE_HISTORY_PAGE_SIZE;

export type FollowListPageResult = {
  items: FollowUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

/** GET /api/users/:id/follow-status */
export type FollowRelationshipStatus = {
  isFollowing: boolean;
};

function followListParamsToSearch(params?: {
  page?: number;
  limit?: number;
  q?: string;
}): string {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const q = sp.toString();
  return q ? `?${q}` : "";
}

/** Backend may return paginated object or legacy raw array; UI always needs `items`. */
function filterFollowUsersByQuery(items: FollowUser[], q: string): FollowUser[] {
  const tokens = q
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return items;
  return items.filter((u) => {
    const name = (u.displayName ?? "").toLowerCase();
    const haystack = name;
    return tokens.every((t) => haystack.includes(t));
  });
}

function normalizeFollowListPageResult(
  raw: FollowListPageResult | FollowUser[] | null | undefined,
  fallbackPage: number,
  fallbackLimit: number,
  searchQ: string
): FollowListPageResult {
  if (Array.isArray(raw)) {
    let items = raw;
    const q = searchQ.trim();
    if (q) {
      items = filterFollowUsersByQuery(items, q);
    }
    const total = items.length;
    const totalPages = total === 0 ? 1 : Math.max(1, Math.ceil(total / fallbackLimit));
    const page = Math.min(Math.max(1, fallbackPage), totalPages);
    const skip = (page - 1) * fallbackLimit;
    const pageItems = items.slice(skip, skip + fallbackLimit);
    return {
      items: pageItems,
      page,
      limit: fallbackLimit,
      total,
      totalPages,
    };
  }
  if (raw && typeof raw === "object" && Array.isArray((raw as FollowListPageResult).items)) {
    return raw as FollowListPageResult;
  }
  return {
    items: [],
    page: fallbackPage,
    limit: fallbackLimit,
    total: 0,
    totalPages: 1,
  };
}

// Follow / social API
/** POST returns updated target user preview; 201. */
export async function followUser(userId: string): Promise<UserPublicProfile> {
  return apiPost<UserPublicProfile>(
    `/api/users/${encodeURIComponent(userId)}/follow`,
    {}
  );
}

/** DELETE usually returns updated preview; may return `{ message }` when target vanished. */
export async function unfollowUser(
  userId: string
): Promise<UserPublicProfile | { message: string }> {
  return apiDelete<UserPublicProfile | { message: string }>(
    `/api/users/${encodeURIComponent(userId)}/follow`
  );
}

/** GET /api/users/:id/followers — paginated (or legacy array). */
export async function getFollowersPage(
  userId: string,
  params?: { page?: number; limit?: number; q?: string }
): Promise<FollowListPageResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? FOLLOW_LIST_PAGE_SIZE;
  const q = params?.q?.trim() ?? "";
  const raw = await apiGet<FollowListPageResult | FollowUser[]>(
    `/api/users/${encodeURIComponent(userId)}/followers${followListParamsToSearch(params)}`
  );
  return normalizeFollowListPageResult(raw, page, limit, q);
}

/** GET /api/users/:id/following — paginated (or legacy array). */
export async function getFollowingPage(
  userId: string,
  params?: { page?: number; limit?: number; q?: string }
): Promise<FollowListPageResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? FOLLOW_LIST_PAGE_SIZE;
  const q = params?.q?.trim() ?? "";
  const raw = await apiGet<FollowListPageResult | FollowUser[]>(
    `/api/users/${encodeURIComponent(userId)}/following${followListParamsToSearch(params)}`
  );
  return normalizeFollowListPageResult(raw, page, limit, q);
}

export async function getFollowStatus(userId: string): Promise<FollowRelationshipStatus> {
  return apiGet<FollowRelationshipStatus>(
    `/api/users/${encodeURIComponent(userId)}/follow-status`
  );
}

// Leaderboards
export type LeaderboardRow = {
  rank: number;
  displayName: string;
  value?: number | null;
  bestLapMs?: number | null;
  userId?: string;
};

export async function getLeaderboards(
  metric: string,
  limit = 10
): Promise<LeaderboardRow[]> {
  const raw = await apiGet<LeaderboardRow[] | { rows?: LeaderboardRow[]; leaderboard?: LeaderboardRow[] }>(
    `/api/leaderboards?metric=${encodeURIComponent(metric)}&limit=${limit}`
  );
  if (Array.isArray(raw)) return raw;
  const rows = raw?.rows ?? raw?.leaderboard ?? [];
  return Array.isArray(rows) ? rows : [];
}
