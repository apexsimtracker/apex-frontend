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

/** Backend returns paginated object; UI always needs `items`. */
function normalizeFollowListPageResult(
  raw: FollowListPageResult | null | undefined,
  fallbackPage: number,
  fallbackLimit: number,
): FollowListPageResult {
  if (raw && typeof raw === "object" && Array.isArray(raw.items)) {
    return raw;
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
    {},
  );
}

/** DELETE usually returns updated preview; may return `{ message }` when target vanished. */
export async function unfollowUser(
  userId: string,
): Promise<UserPublicProfile | { message: string }> {
  return apiDelete<UserPublicProfile | { message: string }>(
    `/api/users/${encodeURIComponent(userId)}/follow`,
  );
}

/** GET /api/users/:id/followers — paginated. */
export async function getFollowersPage(
  userId: string,
  params?: { page?: number; limit?: number; q?: string },
): Promise<FollowListPageResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? FOLLOW_LIST_PAGE_SIZE;
  const raw = await apiGet<FollowListPageResult>(
    `/api/users/${encodeURIComponent(userId)}/followers${followListParamsToSearch(params)}`,
  );
  return normalizeFollowListPageResult(raw, page, limit);
}

/** GET /api/users/:id/following — paginated. */
export async function getFollowingPage(
  userId: string,
  params?: { page?: number; limit?: number; q?: string },
): Promise<FollowListPageResult> {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? FOLLOW_LIST_PAGE_SIZE;
  const raw = await apiGet<FollowListPageResult>(
    `/api/users/${encodeURIComponent(userId)}/following${followListParamsToSearch(params)}`,
  );
  return normalizeFollowListPageResult(raw, page, limit);
}

export async function getFollowStatus(
  userId: string,
): Promise<FollowRelationshipStatus> {
  return apiGet<FollowRelationshipStatus>(
    `/api/users/${encodeURIComponent(userId)}/follow-status`,
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
  limit = 10,
): Promise<LeaderboardRow[]> {
  const raw = await apiGet<
    | LeaderboardRow[]
    | { rows?: LeaderboardRow[]; leaderboard?: LeaderboardRow[] }
  >(`/api/leaderboards?metric=${encodeURIComponent(metric)}&limit=${limit}`);
  if (Array.isArray(raw)) return raw;
  const rows = raw?.rows ?? raw?.leaderboard ?? [];
  return Array.isArray(rows) ? rows : [];
}
