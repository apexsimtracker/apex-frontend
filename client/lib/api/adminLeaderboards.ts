import { apiGet } from "./httpVerbs";
import type { LeaderboardRow } from "./followAndLeaderboards";

/** Must match server `ADMIN_LEADERBOARD_MAX_LIMIT` in `leaderboardService.ts`. */
export const ADMIN_LEADERBOARD_MAX_LIMIT = 500;

export type AdminGlobalLeaderboardsResponse = {
  metric: string;
  rows: LeaderboardRow[];
  sim?: string;
};

/** Whether to include banned (suspended) and/or soft-deleted users in admin results. */
export type AdminLeaderboardUserFilter =
  | "active"
  | "withBanned"
  | "withDeleted"
  | "all";

export type AdminLeaderboardsParams = {
  metric: string;
  /** Clamped to 1..{@link ADMIN_LEADERBOARD_MAX_LIMIT} on the client. */
  limit?: number;
  sim?: string;
  /** Defaults to "active" (excludes both groups) when omitted. */
  userFilter?: AdminLeaderboardUserFilter;
};

/**
 * GET /api/admin/leaderboards — global derived leaderboards (admin-only, higher row cap than public).
 */
export async function fetchAdminLeaderboards(
  params: AdminLeaderboardsParams
): Promise<AdminGlobalLeaderboardsResponse> {
  const limit = Math.min(
    ADMIN_LEADERBOARD_MAX_LIMIT,
    Math.max(1, params.limit ?? 50)
  );
  const sp = new URLSearchParams();
  sp.set("metric", params.metric);
  sp.set("limit", String(limit));
  if (params.sim?.trim()) {
    sp.set("sim", params.sim.trim());
  }
  if (params.userFilter && params.userFilter !== "active") {
    sp.set("userFilter", params.userFilter);
  }
  return apiGet<AdminGlobalLeaderboardsResponse>(
    `/api/admin/leaderboards?${sp.toString()}`
  );
}
