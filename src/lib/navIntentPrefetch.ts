/**
 * Intent prefetch for primary nav: route chunks + light meta queries.
 */

import type { QueryClient } from "@tanstack/react-query";
import {
  getChallengeList,
  getChallengesMeta,
  type ChallengesMeta,
} from "@/lib/api/challenges";
import { getLeaderboards } from "@/lib/api/followAndLeaderboards";
import { preloadRouteChunk } from "@/routes/routePreload";

const LB_LIMIT = 10;
const META_STALE_MS = 5 * 60_000;
const LB_STALE_MS = 90_000;
const PAGE_SIZE = 12;

function listParamsForDefaultTab(
  tab: NonNullable<ChallengesMeta["defaultTab"]>,
) {
  switch (tab) {
    case "upcoming":
      return { status: "UPCOMING" as const, sort: "startsAtAsc" as const };
    case "live":
      return { status: "ACTIVE" as const, sort: "startsAtDesc" as const };
    case "past":
      return { status: "ENDED" as const, sort: "startsAtDesc" as const };
    case "joined":
      return { joinedOnly: true as const, sort: "startsAtDesc" as const };
  }
}

/** Warm default leaderboards tab (wins) — matches Leaderboards page first paint. */
export function prefetchLeaderboardsMeta(queryClient: QueryClient): void {
  void queryClient.prefetchQuery({
    queryKey: ["leaderboards", "wins", LB_LIMIT],
    queryFn: async () => {
      const data = await getLeaderboards("wins", LB_LIMIT);
      return Array.isArray(data) ? data : [];
    },
    staleTime: LB_STALE_MS,
  });
}

export function prefetchChallengesMeta(
  queryClient: QueryClient,
  userId?: string | null,
): void {
  const metaKey = ["challenges", "meta", userId ?? "anon"] as const;
  void queryClient.prefetchQuery({
    queryKey: metaKey,
    queryFn: () => getChallengesMeta(),
    staleTime: META_STALE_MS,
  });

  const cached = queryClient.getQueryData<ChallengesMeta>(metaKey);
  const defaultTab = cached?.defaultTab;
  if (!defaultTab) return;
  if (defaultTab === "joined" && !userId) return;

  void queryClient.prefetchQuery({
    queryKey: [
      "challenges",
      "list",
      userId ?? "anon",
      defaultTab,
      1,
      "",
      "",
      "",
    ],
    queryFn: () =>
      getChallengeList({
        page: 1,
        pageSize: PAGE_SIZE,
        ...listParamsForDefaultTab(defaultTab),
      }),
  });
}

/** Call on pointerenter / focus of primary nav links. */
export function prefetchNavIntent(
  to: string,
  queryClient: QueryClient,
  opts?: { userId?: string | null },
): void {
  const path = to.split("?")[0] || "/";
  preloadRouteChunk(path);

  if (path === "/leaderboards") {
    prefetchLeaderboardsMeta(queryClient);
  } else if (path === "/challenges") {
    prefetchChallengesMeta(queryClient, opts?.userId);
  }
}
