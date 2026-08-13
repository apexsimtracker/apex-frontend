import type { QueryClient } from "@tanstack/react-query";
import {
  getProfileSummary,
  getProfileHomeWeekly,
  getProfileRaceHistory,
  getUserPublicProfile,
  getFollowersPage,
  getFollowingPage,
  FOLLOW_LIST_PAGE_SIZE,
  RACE_HISTORY_PAGE_SIZE,
} from "@/lib/api";

/** Stable segment for token-scoped profile queries when /me omits `user.id` briefly. */
export function ownedProfileUserKey(
  user: { id?: string | null } | null | undefined,
): string {
  return user?.id?.trim() || "me";
}

export const profileKeys = {
  summary: (userKey: string) => ["profile", "summary", userKey] as const,
  homeWeekly: (userKey: string) => ["profile", "homeWeekly", userKey] as const,
  trendInsight: (userKey: string) =>
    ["profile", "trendInsight", userKey] as const,
  raceHistory: (userKey: string, page: number) =>
    ["profile", "raceHistory", userKey, page] as const,
  /** GET /api/users/:id — authoritative follow counts for own profile. */
  publicPreview: (userId: string) =>
    ["profile", "publicPreview", userId] as const,
  /**
   * Paginated follower/following modal (GET .../followers|following).
   * Invalidate with prefix `['profile', 'followList', userId]` to clear all pages/searches.
   */
  followList: (
    userId: string,
    kind: "followers" | "following",
    page: number,
    q: string,
  ) => ["profile", "followList", userId, kind, page, q] as const,
  challengeBadges: (userId: string, page: number) =>
    ["profile", "challengeBadges", userId, page] as const,
  userBundle: (id: string) => ["userProfile", "bundle", id] as const,
  userSummary: (id: string) => ["userProfile", "summary", id] as const,
  userRaceHistory: (id: string, page: number) =>
    ["userProfile", "raceHistory", id, page] as const,
} as const;

/** Invalidate every cached own-profile summary (all `userKey` variants). */
export const PROFILE_SUMMARY_ALL_QUERY_FILTER = {
  queryKey: ["profile", "summary"] as const,
};

/**
 * Refresh profile stats, race history, activity feeds, leaderboards, and other
 * session-derived UI after create/update/delete/upload — without requiring a full
 * page reload.
 */
export function invalidateSessionDerivedCaches(
  queryClient: QueryClient,
  opts: {
    ownerUserId?: string | null;
    /** Session affected: invalidate detail/edit, or remove after delete. */
    sessionId?: string;
    /** Pass `true` after DELETE so detail/edit caches are dropped. Omit or `false` after update (refetch only). */
    removeSessionQueries?: boolean;
  } = {},
): void {
  const { ownerUserId, sessionId, removeSessionQueries } = opts;
  const sid = sessionId?.trim();

  void queryClient.invalidateQueries(PROFILE_SUMMARY_ALL_QUERY_FILTER);
  void queryClient.invalidateQueries({ queryKey: ["profile", "homeWeekly"] });
  void queryClient.invalidateQueries({ queryKey: ["profile", "trendInsight"] });
  void queryClient.invalidateQueries({ queryKey: ["profile", "raceHistory"] });
  void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  void queryClient.invalidateQueries({ queryKey: ["activity"] });
  void queryClient.invalidateQueries({ queryKey: ["sessions-library"] });
  void queryClient.invalidateQueries({ queryKey: ["leaderboards"] });

  const uid = ownerUserId?.trim();
  if (uid) {
    void queryClient.invalidateQueries({
      queryKey: profileKeys.publicPreview(uid),
    });
  }

  if (!sid) return;

  if (removeSessionQueries) {
    void queryClient.removeQueries({ queryKey: ["sessions", "detail", sid] });
    void queryClient.removeQueries({ queryKey: ["sessions", "edit", sid] });
  } else {
    void queryClient.invalidateQueries({
      queryKey: ["sessions", "detail", sid],
    });
    void queryClient.invalidateQueries({ queryKey: ["sessions", "edit", sid] });
  }
}

/**
 * Warm home weekly stats after sign-in so the authenticated home screen populates faster.
 */
export function prefetchHomeWeeklyAfterAuth(
  queryClient: QueryClient,
  user: { id?: string | null } | null | undefined,
): void {
  if (!user) return;
  const userKey = ownedProfileUserKey(user);
  void queryClient.prefetchQuery({
    queryKey: profileKeys.homeWeekly(userKey),
    queryFn: getProfileHomeWeekly,
  });
}

/**
 * Prefetch cache for the post-auth destination so the lander paints faster.
 * Default redirect is `/profile`; home weekly is warmed only when going `/`.
 */
export function prefetchAfterAuthRedirect(
  queryClient: QueryClient,
  user: { id?: string | null } | null | undefined,
  redirectTo: string,
): void {
  if (!user) return;
  const path = (redirectTo.split("?")[0] || "/").replace(/\/$/, "") || "/";
  if (path === "/" || path === "/home") {
    prefetchHomeWeeklyAfterAuth(queryClient, user);
    return;
  }
  prefetchOwnProfileQueries(queryClient, user);
}

/**
 * Warm cache for /profile: summary, race history page 1, and public preview for follow counts.
 * Safe to fire from hover/idle; respects global staleTime.
 */
export function prefetchOwnProfileQueries(
  queryClient: QueryClient,
  user: { id?: string | null } | null | undefined,
): void {
  if (!user) return;
  const userKey = ownedProfileUserKey(user);
  void queryClient.prefetchQuery({
    queryKey: profileKeys.summary(userKey),
    queryFn: getProfileSummary,
  });
  void queryClient.prefetchQuery({
    queryKey: profileKeys.raceHistory(userKey, 1),
    queryFn: () =>
      getProfileRaceHistory({ page: 1, limit: RACE_HISTORY_PAGE_SIZE }),
  });
  const uid = user.id?.trim();
  if (uid) {
    void queryClient.prefetchQuery({
      queryKey: profileKeys.publicPreview(uid),
      queryFn: () => getUserPublicProfile(uid),
    });
  }
}

/**
 * Warm follower/following modal page 1 on count-button hover/focus.
 * Safe to fire repeatedly; respects global staleTime.
 */
export function prefetchFollowList(
  queryClient: QueryClient,
  userId: string,
  kind: "followers" | "following",
): void {
  const uid = userId.trim();
  if (!uid) return;
  void queryClient.prefetchQuery({
    queryKey: profileKeys.followList(uid, kind, 1, ""),
    queryFn: () =>
      kind === "followers"
        ? getFollowersPage(uid, {
            page: 1,
            limit: FOLLOW_LIST_PAGE_SIZE,
            q: "",
          })
        : getFollowingPage(uid, {
            page: 1,
            limit: FOLLOW_LIST_PAGE_SIZE,
            q: "",
          }),
  });
}
