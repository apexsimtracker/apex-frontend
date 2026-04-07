import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, X } from "lucide-react";
import ActivityCard from "@/components/ActivityCard";
import BundledActivityCard from "@/components/BundledActivityCard";
import DiscussionCard from "@/components/DiscussionCard";
import WeeklySnapshot from "@/components/WeeklySnapshot";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  isNetworkError,
  getDiscussionsPage,
  DISCUSSIONS_PAGE_DEFAULT_LIMIT,
  getActivityFeedPage,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  getProfileSummary,
  type ActivityFeedPageResult,
  type Discussion,
} from "@/lib/api";
import type { InfiniteData } from "@tanstack/react-query";
import { patchActivityFeedInfiniteData } from "@/lib/activityFeedCache";
import { groupSessions, getActivityKey, type SessionItem, type ActivityItem as GroupedActivityItem } from "@/lib/groupSessions";
import GoalsBar from "@/components/GoalsBar";
import { useAuth } from "@/contexts/AuthContext";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";

const HOME_PATH = "/";
const HOME_TITLE = `Home | ${COMPANY_NAME}`;
const HOME_DESCRIPTION = `Your sim racing hub on ${COMPANY_NAME}: activity feed, weekly goals, sessions, and community at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

type RawActivityItem = SessionItem & {
  type?: "session";
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  owner?: {
    displayName?: string | null;
    username?: string | null;
    avatarUrl?: string | null;
  };
};

function getActivityHeaderFromOwner(
  session: RawActivityItem,
  currentUser?: { id: string; avatarUrl?: string | null } | null
): {
  name: string;
  avatar: string | null;
} {
  const owner = session.owner;
  const sessionOwnerId =
    session.authorId ??
    ((owner && typeof owner === "object" && "id" in owner && typeof (owner as any).id === "string")
      ? ((owner as any).id as string)
      : null);
  const isCurrentUsersSession =
    Boolean(currentUser?.id) && Boolean(sessionOwnerId) && currentUser!.id === sessionOwnerId;
  const name =
    session.authorName?.trim() ||
    owner?.displayName?.trim() ||
    owner?.username?.trim() ||
    session.driverName ||
    "—";
  const currentUserAvatar =
    currentUser?.avatarUrl && currentUser.avatarUrl.trim().length > 0
      ? currentUser.avatarUrl
      : null;
  const avatar =
    (isCurrentUsersSession && currentUserAvatar
      ? currentUserAvatar
      : session.authorAvatarUrl && session.authorAvatarUrl.trim().length > 0
      ? session.authorAvatarUrl
      : owner?.avatarUrl && owner.avatarUrl.trim().length > 0
        ? owner.avatarUrl
        : null);
  return { name, avatar };
}

function getProfileOwnerId(session: RawActivityItem): string | null {
  if (typeof session.authorId === "string" && session.authorId.trim()) {
    return session.authorId.trim();
  }
  const owner = session.owner;
  const oid =
    owner && typeof owner === "object" && "id" in owner && typeof (owner as { id?: unknown }).id === "string"
      ? (owner as { id: string }).id
      : null;
  return oid && oid.trim() ? oid.trim() : null;
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

function deltaNumber(curr: number, prev: number) {
  return curr - prev;
}

function FeedSkeletonCard() {
  return (
    <div className="rounded-lg border border-white/6 bg-card/20 overflow-hidden mb-6">
      <div className="px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3">
        <SkeletonBlock height={36} width={36} rounded="full" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <SkeletonBlock height={14} width={80} />
          <SkeletonBlock height={12} width={56} />
        </div>
      </div>
      <div className="px-4 sm:px-5 pt-1.5 pb-4 sm:pb-5">
        <SkeletonBlock height={12} width={64} className="mb-2" />
        <SkeletonBlock height={20} width="75%" className="mb-3" />
        <SkeletonBlock height={14} width={96} className="mb-4" />
        <div className="flex gap-4">
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
          <SkeletonBlock height={64} className="flex-1" rounded="lg" />
        </div>
        <SkeletonBlock height={16} width={112} className="mt-4" />
      </div>
      <div className="px-4 sm:px-5 py-2.5 flex items-center gap-4 border-t border-white/5">
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

  const {
    data: activityPages,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["activity", "feed", "all", ACTIVITY_FEED_DEFAULT_LIMIT],
    queryFn: ({ pageParam }) =>
      getActivityFeedPage({
        type: "all",
        page: pageParam as number,
        limit: ACTIVITY_FEED_DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });

  const activity = useMemo(
    () =>
      (activityPages?.pages.flatMap((p) => p.items) ?? []) as RawActivityItem[],
    [activityPages]
  );

  const { data: profileSummary, isPending: profileSummaryPending } = useQuery({
    queryKey: ["profile", "summary", user?.id ?? ""],
    queryFn: getProfileSummary,
    enabled: Boolean(user?.id),
  });
  const profileWeeklyGoals = profileSummary?.weeklyGoals ?? null;

  const {
    data: discussionPages,
    isLoading: discussionsLoading,
    fetchNextPage: fetchNextDiscussionsPage,
    hasNextPage: discussionsHasNextPage,
    isFetchingNextPage: isFetchingNextDiscussionsPage,
  } = useInfiniteQuery({
    queryKey: ["discussions", "home", DISCUSSIONS_PAGE_DEFAULT_LIMIT],
    queryFn: ({ pageParam }) =>
      getDiscussionsPage({
        page: pageParam as number,
        limit: DISCUSSIONS_PAGE_DEFAULT_LIMIT,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
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

  const feedLoading = activityLoading || discussionsLoading;

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

  useEffect(() => {
    function handleActivityUpdated() {
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", "summary"] });
    }
    if (typeof window !== "undefined") {
      window.addEventListener("apex:activity-updated", handleActivityUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("apex:activity-updated", handleActivityUpdated);
      }
    };
  }, [queryClient]);

  // Group sessions into bundled activities
  const groupedActivity = useMemo<GroupedActivityItem[]>(() => {
    return groupSessions(activity);
  }, [activity]);

  const weeklyStats = useMemo(() => {
    // Signed-in: only server weeklySnapshot (user + ISO week). Do not use the global feed here —
    // the feed is everyone’s sessions, so it briefly showed non-zero then flipped to real user stats.
    if (user?.id) {
      const snap = profileSummary?.weeklySnapshot;
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
  }, [activity, profileSummary?.weeklySnapshot, user?.id]);

  const weeklySnapshotLoading = Boolean(user?.id) && profileSummaryPending;

  // Calculate weekly goals progress from activity
  const goalsStats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startThisWeek = now - weekMs;

    const thisWeek = activity.filter(
      (i) => new Date(i.createdAt).getTime() >= startThisWeek
    );

    const races = thisWeek.filter(
      (s) => s.sessionType === "RACE" || s.sessionType === "QUALIFY"
    ).length;
    const podiums = thisWeek.filter(
      (s) => s.position != null && s.position <= 3 && s.sessionType === "RACE"
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

  return (
    <>
      <PageMeta title={HOME_TITLE} description={HOME_DESCRIPTION} path={HOME_PATH} />
      <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <WeeklySnapshot
          loading={weeklySnapshotLoading}
          sessionsCount={weeklyStats.sessionsCount}
          totalLaps={weeklyStats.totalLaps}
          trackTimeMs={weeklyStats.trackTimeMs}
          sessionDelta={weeklyStats.sessionDelta}
          lapsDelta={weeklyStats.lapsDelta}
          trackTimeDelta={weeklyStats.trackTimeDelta}
        />

        {/* Goals */}
        <GoalsBar
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
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
              <p className="flex-1 text-sm text-green-400">
                Your session was uploaded and processed successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowUploadBanner(false)}
                className="p-1 text-green-400/60 hover:text-green-400 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {feedLoading ? (
            <div className="space-y-0">
              <p className="text-sm text-muted-foreground mb-3">Loading activity...</p>
              <FeedSkeletonCard />
              <FeedSkeletonCard />
              <FeedSkeletonCard />
            </div>
          ) : (
            <>
              {feedError && (
                <div className="mb-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-400">
                  <div>Can't reach Apex backend. Check it's running.</div>
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
                <p className="text-sm text-destructive mb-6">
                  Failed to load activity
                </p>
              )}
              {!error && !feedError && groupedActivity.length === 0 && discussions.length === 0 && (
                <p className="text-sm text-muted-foreground py-8">No activity yet.</p>
              )}
              {!error && !feedError &&
                groupedActivity.map((item) => {
                  if (item.type === "bundle") {
                    return (
                      <BundledActivityCard
                        key={getActivityKey(item)}
                        sessions={item.sessions}
                        overflowCount={item.overflowCount}
                        onSessionPatch={(id, patch) => {
                          queryClient.setQueryData<InfiniteData<ActivityFeedPageResult>>(
                            ["activity", "feed", "all", ACTIVITY_FEED_DEFAULT_LIMIT],
                            (prev) => patchActivityFeedInfiniteData(prev, id, patch as Record<string, unknown>)
                          );
                        }}
                      />
                    );
                  }
                  const session = item.session;
                  const header = getActivityHeaderFromOwner(session as RawActivityItem, user ?? null);
                  const profileOwnerId = getProfileOwnerId(session as RawActivityItem);
                  return (
                    <ActivityCard
                      key={getActivityKey(item)}
                      id={session.id}
                      profileUserId={profileOwnerId}
                      userName={header.name}
                      userAvatar={header.avatar}
                      game="—"
                      car={session.car ?? "—"}
                      vehicleDisplay={session.vehicleDisplay}
                      track={session.track ?? "—"}
                      position={session.position ?? null}
                      totalRacers={session.totalDrivers ?? null}
                      sessionType={session.sessionType}
                      sim={session.sim}
                      source={session.source}
                      bestLapMs={session.bestLapMs}
                      lapCount={session.lapCount}
                      consistencyScore={session.consistencyScore}
                      likeCount={session.likeCount ?? 0}
                      commentCount={session.commentCount ?? 0}
                      likedByMe={session.likedByMe ?? false}
                      score={0}
                      timestamp={timeAgo(session.createdAt)}
                      likes={session.likeCount ?? 0}
                      comments={session.commentCount ?? 0}
                      onSessionPatch={(id, patch) => {
                        queryClient.setQueryData<InfiniteData<ActivityFeedPageResult>>(
                          ["activity", "feed", "all", ACTIVITY_FEED_DEFAULT_LIMIT],
                          (prev) => patchActivityFeedInfiniteData(prev, id, patch as Record<string, unknown>)
                        );
                      }}
                    />
                  );
                })}
              {!error && !feedError && hasNextPage && (
                <div className="flex justify-center py-6">
                  <button
                    type="button"
                    onClick={() => void fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08] disabled:opacity-50 disabled:pointer-events-none transition-colors"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
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
                className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/90 hover:bg-white/[0.08] disabled:opacity-50 disabled:pointer-events-none transition-colors"
              >
                {isFetchingNextDiscussionsPage ? "Loading…" : "Load more discussions"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
