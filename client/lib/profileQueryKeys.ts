import type { QueryClient } from "@tanstack/react-query";
import {
  getProfileSummary,
  getProfileRaceHistory,
  getFollowers,
  getFollowing,
  RACE_HISTORY_PAGE_SIZE,
} from "@/lib/api";

/** Stable segment for token-scoped profile queries when /me omits `user.id` briefly. */
export function ownedProfileUserKey(
  user: { id?: string | null } | null | undefined
): string {
  return user?.id?.trim() || "me";
}

export const profileKeys = {
  summary: (userKey: string) => ["profile", "summary", userKey] as const,
  raceHistory: (userKey: string, page: number) =>
    ["profile", "raceHistory", userKey, page] as const,
  follows: (userId: string) => ["profile", "follows", userId] as const,
  userBundle: (id: string) => ["userProfile", "bundle", id] as const,
  userRaceHistory: (id: string, page: number) =>
    ["userProfile", "raceHistory", id, page] as const,
  userFollows: (id: string) => ["userProfile", "follows", id] as const,
} as const;

/** Invalidate every cached own-profile summary (all `userKey` variants). */
export const PROFILE_SUMMARY_ALL_QUERY_FILTER = {
  queryKey: ["profile", "summary"] as const,
};

/**
 * Warm cache for /profile: summary, race history page 1, and follows (if `user.id` exists).
 * Safe to fire from hover/idle; respects global staleTime.
 */
export function prefetchOwnProfileQueries(
  queryClient: QueryClient,
  user: { id?: string | null } | null | undefined
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
      queryKey: profileKeys.follows(uid),
      queryFn: async () => {
        const [f1, f2] = await Promise.all([getFollowers(uid), getFollowing(uid)]);
        return {
          followers: Array.isArray(f1) ? f1 : [],
          following: Array.isArray(f2) ? f2 : [],
        };
      },
    });
  }
}
