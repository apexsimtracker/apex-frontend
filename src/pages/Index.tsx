import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, X } from "lucide-react";
import ActivityFeedList from "@/components/ActivityFeedList";
import DiscussionCard from "@/components/DiscussionCard";
import WeeklySnapshot from "@/components/WeeklySnapshot";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  isNetworkError,
  getDiscussionsPage,
  DISCUSSIONS_PAGE_DEFAULT_LIMIT,
  getActivityHomeFeedPage,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  getProfileHomeWeekly,
  getProfileTrendInsight,
  type ActivityFeedPageResult,
  type Discussion,
} from "@/lib/api";
import type { InfiniteData } from "@tanstack/react-query";
import { patchActivityFeedInfiniteData } from "@/lib/activityFeedCache";
import type { SessionItem } from "@/lib/groupSessions";
import GoalsBar from "@/components/GoalsBar";
import ApexAnalysisTrendCard from "@/components/ApexAnalysisTrendCard";
import OnboardingEmptyState from "@/components/OnboardingEmptyState";
import { useAuth } from "@/contexts/AuthContext";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import {
  ownedProfileUserKey,
  profileKeys,
} from "@/lib/profileQueryKeys";
import { isRaceKind } from "@/lib/sessionKind";

const HOME_PATH = "/";
const HOME_TITLE = `Home | ${COMPANY_NAME}`;
const HOME_DESCRIPTION = `Your signed-in ${COMPANY_NAME} feed: activity, weekly goals, sessions, leaderboards, challenges, and community.`;

const HOME_DISCUSSIONS_QUERY_KEY = [
  "discussions",
  "home",
  DISCUSSIONS_PAGE_DEFAULT_LIMIT,
] as const;

type RawActivityItem = SessionItem & {
  type?: "session";
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  owner?: {
    id?: string | null;
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
};

function deltaNumber(curr: number, prev: number) {
  return curr - prev;
}

function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function FeedSkeletonCard() {
  return (
    <div className="border-white/6 mb-6 overflow-hidden rounded-lg border bg-card/20">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
        <SkeletonBlock height={36} width={36} rounded="full" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={12} width={56} />
        </div>
      </div>
      <div className="px-4 pb-4 pt-1.5 sm:px-5 sm:pb-5">
        <SkeletonBlock height={12} width={64} className="mb-2" />
        <SkeletonBlock height={20} width="75%" className="mb-3" />
        <SkeletonBlock height={14} width={96} className="mb-4" />
        <div className="flex gap-4">
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
        </div>
        <SkeletonBlock height={16} width={112} className="mt-4" />
      </div>
      <div className="flex items-center gap-4 border-t border-white/5 px-4 py-2.5 sm:px-5">
        <SkeletonBlock height={14} width={48} />
        <SkeletonBlock height={14} width={56} />
      </div>
    </div>
  );
}

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showUploadBanner, setShowUploadBanner] = useState(false);
  const [homeDiscussionsEnabled, setHomeDiscussionsEnabled] = useState(false);
  const [homeTrendEnabled, setHomeTrendEnabled] = useState(false);

  /** Home feed (`type: "all"`); includes user id so cache does not leak across accounts. Match `setQueryData` patch sites. */
  const homeActivityFeedQueryKey = useMemo(
    () =>
      [
        "activity",
        "feed",
        "home",
        user?.id ?? "_",
        "all",
        ACTIVITY_FEED_DEFAULT_LIMIT,
      ] as const,
    [user?.id]
  );

  const {
    data: activityPages,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: homeActivityFeedQueryKey,
    queryFn: ({ pageParam }) =>
      getActivityHomeFeedPage({
        type: "all",
        page: pageParam as number,
        limit: ACTIVITY_FEED_DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    placeholderData: (previousData) => previousData,
    enabled: Boolean(user),
  });

  const activity = useMemo(
    () =>
      (activityPages?.pages.flatMap((p) => p.items) ?? []) as RawActivityItem[],
    [activityPages]
  );

  const profileSummaryKey = ownedProfileUserKey(user);
  const { data: profileHomeWeekly, isPending: profileHomeWeeklyPending } = useQuery({
    queryKey: profileKeys.homeWeekly(profileSummaryKey),
    queryFn: getProfileHomeWeekly,
    enabled: Boolean(user),
  });
  const profileWeeklyGoals = profileHomeWeekly?.weeklyGoals ?? null;

  const { data: profileTrendInsight } = useQuery({
    queryKey: profileKeys.trendInsight(profileSummaryKey),
    queryFn: getProfileTrendInsight,
    enabled: Boolean(user) && homeTrendEnabled,
  });

  const {
    data: discussionPages,
    isLoading: discussionsLoading,
    fetchNextPage: fetchNextDiscussionsPage,
    hasNextPage: discussionsHasNextPage,
    isFetchingNextPage: isFetchingNextDiscussionsPage,
  } = useInfiniteQuery({
    queryKey: HOME_DISCUSSIONS_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      getDiscussionsPage({
        page: pageParam as number,
        limit: DISCUSSIONS_PAGE_DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    enabled: homeDiscussionsEnabled,
    placeholderData: (previousData) => previousData,
  });

  const discussions = useMemo(
    () =>
      (discussionPages?.pages.flatMap((p) => p.items) ?? []) as Discussion[],
    [discussionPages]
  );

  const feedError = useMemo(() => {
    if (!activityError) return null;
    return isNetworkError(activityError)
      ? "Can't reach Apex backend. Check it's running."
      : null;
  }, [activityError]);

  const error = useMemo(() => {
    if (!activityError || feedError) return null;
    return activityError instanceof Error
      ? activityError.message
      : "Failed to load activity";
  }, [activityError, feedError]);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) setHomeDiscussionsEnabled(true);
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(run, 1);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) setHomeTrendEnabled(true);
    };
    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (typeof requestIdleCallback !== "undefined") {
      idleId = requestIdleCallback(run, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(run, 1);
    }
    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof cancelIdleCallback !== "undefined") {
        cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (searchParams.get("uploaded") === "1") {
      setShowUploadBanner(true);
      setSearchParams({}, { replace: true });

      const timer = setTimeout(() => {
        setShowUploadBanner(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams]);

  const weeklyStats = useMemo(() => {
    // Signed-in: only server weeklySnapshot (user + ISO week). Do not derive weekly stats from the home feed —
    // even though it is personalized, client-side rollups can still race or disagree with the server snapshot.
    if (user?.id) {
      const snap = profileHomeWeekly?.weeklySnapshot;
      if (snap) {
        return {
          sessionsCount: snap.sessions,
          totalLaps: snap.laps,
          trackTimeMs: snap.trackTimeSec * 1000,
          sessionDelta: snap.sessionsDelta,
          lapsDelta: snap.lapsDelta,
          trackTimeDelta: snap.trackTimeSecDelta * 1000,
        };
      }
      return {
        sessionsCount: 0,
        totalLaps: 0,
        trackTimeMs: 0,
        sessionDelta: 0,
        lapsDelta: 0,
        trackTimeDelta: 0,
      };
    }

    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startThisWeek = now - weekMs;
    const startPrevWeek = now - 2 * weekMs;

    const thisWeek = activity.filter(
      (i) => new Date(i.createdAt).getTime() >= startThisWeek,
    );
    const prevWeek = activity.filter((i) => {
      const t = new Date(i.createdAt).getTime();
      return t >= startPrevWeek && t < startThisWeek;
    });

    const thisSessions = thisWeek.length;
    const prevSessions = prevWeek.length;
    const thisLaps = thisWeek.reduce((sum, i) => sum + (i.lapCount ?? 0), 0);
    const prevLaps = prevWeek.reduce((sum, i) => sum + (i.lapCount ?? 0), 0);

    const avgLapMs = 90_000; // fallback ~1m30s
    const thisTrackTimeMs = thisWeek.reduce((total, s) => {
      const laps = s.lapCount ?? 0;
      const lapMs = s.bestLapMs ?? avgLapMs;
      return total + laps * lapMs;
    }, 0);
    const prevTrackTimeMs = prevWeek.reduce((total, s) => {
      const laps = s.lapCount ?? 0;
      const lapMs = s.bestLapMs ?? avgLapMs;
      return total + laps * lapMs;
    }, 0);

    const sessionDelta = deltaNumber(thisSessions, prevSessions);
    const lapsDelta = deltaNumber(thisLaps, prevLaps);
    const trackTimeDelta = deltaNumber(thisTrackTimeMs, prevTrackTimeMs);

    return {
      sessionsCount: thisSessions,
      totalLaps: thisLaps,
      trackTimeMs: thisTrackTimeMs,
      sessionDelta,
      lapsDelta,
      trackTimeDelta,
    };
  }, [activity, profileHomeWeekly?.weeklySnapshot, user?.id]);

  const weeklySnapshotLoading = Boolean(user?.id) && profileHomeWeeklyPending;

  // Calculate weekly goals progress from activity
  const goalsStats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startThisWeek = now - weekMs;

    const thisWeek = activity.filter(
      (i) => new Date(i.createdAt).getTime() >= startThisWeek
    );

    const races = thisWeek.filter((s) =>
      isRaceKind({
        sessionType: s.sessionType ?? null,
        manualSessionKind: s.manualSessionKind ?? null,
      })
    ).length;
    const podiums = thisWeek.filter(
      (s) =>
        isRaceKind({
          sessionType: s.sessionType ?? null,
          manualSessionKind: s.manualSessionKind ?? null,
        }) &&
        s.position != null &&
        s.position <= 3
    ).length;
    const laps = thisWeek.reduce((sum, s) => sum + (s.lapCount ?? 0), 0);
    return { races, podiums, laps };
  }, [activity]);

  const goalsForBar = useMemo(() => {
    if (profileWeeklyGoals) {
      const w = profileWeeklyGoals;
      return {
        races: w.races.current,
        podiums: w.podiums.current,
        laps: w.laps.current,
        racesTarget: w.races.target,
        podiumsTarget: w.podiums.target,
        lapsTarget: w.laps.target,
      };
    }
    return {
      races: goalsStats.races,
      podiums: goalsStats.podiums,
      laps: goalsStats.laps,
      racesTarget: 10,
      podiumsTarget: 5,
      lapsTarget: 100,
    };
  }, [profileWeeklyGoals, goalsStats]);

  const showApexTrendCard = Boolean(user?.id && profileTrendInsight?.apexTrendInsight);

  const showEmptyFeedOnboarding = useMemo(() => {
    return (
      Boolean(user?.id) &&
      !showApexTrendCard &&
      !activityLoading &&
      !feedError &&
      !error &&
      homeDiscussionsEnabled &&
      !discussionsLoading &&
      activity.length === 0 &&
      discussions.length === 0
    );
  }, [
    user?.id,
    showApexTrendCard,
    activityLoading,
    feedError,
    error,
    homeDiscussionsEnabled,
    discussionsLoading,
    activity.length,
    discussions.length,
  ]);

  return (
    <>
      <PageMeta
        title={HOME_TITLE}
        description={HOME_DESCRIPTION}
        path={HOME_PATH}
        noindex
      />
      <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <WeeklySnapshot
          loading={weeklySnapshotLoading}
          sessionsCount={weeklyStats.sessionsCount}
          totalLaps={weeklyStats.totalLaps}
          trackTimeMs={weeklyStats.trackTimeMs}
          sessionDelta={weeklyStats.sessionDelta}
          lapsDelta={weeklyStats.lapsDelta}
          trackTimeDelta={weeklyStats.trackTimeDelta}
        />

        {showApexTrendCard && profileTrendInsight?.apexTrendInsight && (
          <ApexAnalysisTrendCard trend={profileTrendInsight.apexTrendInsight} />
        )}

        {/* Goals */}
        <GoalsBar
          loading={weeklySnapshotLoading}
          races={goalsForBar.races}
          podiums={goalsForBar.podiums}
          laps={goalsForBar.laps}
          racesTarget={goalsForBar.racesTarget}
          podiumsTarget={goalsForBar.podiumsTarget}
          lapsTarget={goalsForBar.lapsTarget}
        />

        {/* Feed */}
        <div className="mt-6">
          {showUploadBanner && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3">
              <CheckCircle className="size-5 shrink-0 text-green-500" />
              <p className="flex-1 text-sm text-green-400">
                Your session was uploaded and processed successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowUploadBanner(false)}
                className="p-1 text-green-400/60 transition-colors hover:text-green-400"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {activityLoading ? (
            <div className="space-y-0">
              <p className="mb-3 text-sm text-muted-foreground">Loading activity...</p>
              <FeedSkeletonCard />
              <FeedSkeletonCard />
              <FeedSkeletonCard />
            </div>
          ) : (
            <>
              {feedError && (
                <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-400">
                  <div>
                    Can&apos;t reach Apex backend. Check it&apos;s running.
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-sm text-zinc-200 hover:text-white"
                    onClick={() => void refetchActivity()}
                  >
                    Retry
                  </button>
                </div>
              )}
              {error && !feedError && (
                <p className="mb-6 text-sm text-destructive">
                  Failed to load activity
                </p>
              )}
              {showEmptyFeedOnboarding && (
                <div className="py-4">
                  <OnboardingEmptyState />
                </div>
              )}
              {!error && !feedError && (
                <ActivityFeedList
                  sessions={activity as RawActivityItem[]}
                  currentUser={user ?? null}
                  onSessionPatch={(id, patch) => {
                    queryClient.setQueryData<InfiniteData<ActivityFeedPageResult>>(
                      homeActivityFeedQueryKey,
                      (prev) => patchActivityFeedInfiniteData(prev, id, patch as Record<string, unknown>)
                    );
                  }}
                />
              )}
              {!error && !feedError && hasNextPage && (
                <div className="flex justify-center py-6">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
          {homeDiscussionsEnabled &&
            (discussionsLoading ? (
              <p className="mt-6 border-t border-white/5 py-6 text-sm text-muted-foreground">
                Loading discussions…
              </p>
            ) : (
              <>
                {discussions.map((d) => (
                  <DiscussionCard
                    key={d.id}
                    id={d.id}
                    title={d.title}
                    excerpt={
                      d.excerpt ??
                      (() => {
                        const body = d.description ?? d.content ?? "";
                        return body
                          ? body.slice(0, 160) + (body.length > 160 ? "…" : "")
                          : "";
                      })()
                    }
                    author={d.author}
                    categoryKey={d.category ?? "general"}
                    timestamp={timeAgo(d.createdAt)}
                    replies={d.replies ?? d.commentCount ?? d.commentsCount ?? 0}
                    views={d.views ?? 0}
                    isPinned={d.isPinned}
                  />
                ))}
                {discussionsHasNextPage && (
                  <div className="flex justify-center py-6">
                    <button
                      type="button"
                      onClick={() => void fetchNextDiscussionsPage()}
                      disabled={isFetchingNextDiscussionsPage}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-50"
                    >
                      {isFetchingNextDiscussionsPage ? "Loading…" : "Load more discussions"}
                    </button>
                  </div>
                )}
              </>
            ))}
        </div>
      </div>
    </div>
    </>
  );
}
