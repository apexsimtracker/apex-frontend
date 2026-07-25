/**
 * Prefetch helpers for authenticated home (Dashboard) so /me, chunk, and data overlap.
 */

import type { QueryClient } from "@tanstack/react-query";
import {
  getActivityHomeFeedPage,
  getProfileHomeWeekly,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  ACTIVITY_FEED_INITIAL_MAX_SESSIONS,
} from "@/lib/api";
import { storedAccessTokenSubject } from "@/lib/impersonation";
import { ownedProfileUserKey, profileKeys } from "@/lib/profileQueryKeys";

export function homeActivityFeedQueryKey(userId: string) {
  return [
    "activity",
    "feed",
    "home",
    userId,
    "all",
    ACTIVITY_FEED_DEFAULT_LIMIT,
  ] as const;
}

/** Start Dashboard / PublicHome chunk download without waiting for /me. */
export function prefetchHomePageChunk(preferDashboard: boolean): Promise<unknown> {
  return preferDashboard
    ? import("@/pages/Dashboard")
    : import("@/pages/PublicHome");
}

/**
 * Warm home weekly + first activity page using JWT `sub` when /me is still in flight.
 * Keys must match Dashboard once `user.id` resolves to the same subject.
 */
export function prefetchAuthenticatedHomeData(
  queryClient: QueryClient,
  user?: { id?: string | null } | null,
): void {
  const userId =
    user?.id?.trim() || storedAccessTokenSubject()?.trim() || null;
  if (!userId) return;

  const userKey = ownedProfileUserKey({ id: userId });

  void queryClient.prefetchQuery({
    queryKey: profileKeys.homeWeekly(userKey),
    queryFn: getProfileHomeWeekly,
  });

  void queryClient.prefetchInfiniteQuery({
    queryKey: homeActivityFeedQueryKey(userId),
    queryFn: ({ pageParam }) => {
      const param = pageParam as {
        groupOffset: number;
        maxSessions: number;
      };
      return getActivityHomeFeedPage({
        type: "all",
        groupOffset: param.groupOffset,
        limit: ACTIVITY_FEED_DEFAULT_LIMIT,
        maxSessions: param.maxSessions,
      });
    },
    initialPageParam: {
      groupOffset: 0,
      maxSessions: ACTIVITY_FEED_INITIAL_MAX_SESSIONS,
    },
  });
}
