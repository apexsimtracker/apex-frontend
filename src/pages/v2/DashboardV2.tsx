import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { InfiniteData } from "@tanstack/react-query";
import { CheckCircle, X } from "lucide-react";
import ActivityFeedListV2 from "@/components/v2/dashboard/ActivityFeedListV2";
import ApexAnalysisTrendCardV2 from "@/components/v2/dashboard/ApexAnalysisTrendCardV2";
import OnboardingEmptyStateV2 from "@/components/v2/dashboard/OnboardingEmptyStateV2";
import PageMeta from "@/components/PageMeta";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import {
  patchActivityFeedInfiniteData,
  flattenFeedItemSessions,
} from "@/lib/activityFeedCache";
import {
  isNetworkError,
  getActivityHomeFeedPage,
  ACTIVITY_FEED_DEFAULT_LIMIT,
  ACTIVITY_FEED_INITIAL_MAX_SESSIONS,
  getProfileHomeWeekly,
  getProfileTrendInsight,
  type ActivityFeedPageResult,
  type ActivityFeedItem,
} from "@/lib/api";
import { ownedProfileUserKey, profileKeys } from "@/lib/profileQueryKeys";
import { isRaceKind } from "@/lib/sessionKind";
import { COMPANY_NAME } from "@/lib/siteMeta";
import type { SessionItem } from "@/lib/sessionTypes";
import DashboardStatGridV2, {
  formatWeekLabel,
} from "@/pages/v2/dashboard/DashboardStatGridV2";

const DASHBOARD_V2_PATH = "/v2";
const DASHBOARD_V2_TITLE = `Home | ${COMPANY_NAME}`;
const DASHBOARD_V2_DESCRIPTION = `Your signed-in ${COMPANY_NAME} feed: activity, weekly goals, sessions, leaderboards, challenges, and community.`;

type HomeActivityFeedPageParam = {
  groupOffset: number;
  maxSessions?: number;
};

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

function getAccountDisplayName(
  user: NonNullable<ReturnType<typeof useAuth>["user"]>,
): string {
  const raw = user.displayName?.trim();
  if (raw) return raw;
  return user.email?.trim() || "Driver";
}

function FeedSkeletonCardV2() {
  const blockClassName = "bg-v2-surface-container-high/80";
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container-low shadow-sm">
      <div className="space-y-5 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonBlock
              height={36}
              width={36}
              rounded="full"
              className={blockClassName}
            />
            <div className="space-y-2">
              <SkeletonBlock
                height={12}
                width={96}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={10}
                width={52}
                className={blockClassName}
                rounded="sm"
              />
            </div>
          </div>
          <SkeletonBlock
            height={28}
            width={56}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-2">
            <SkeletonBlock
              height={16}
              width={40}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={16}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={10}
            width={80}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={28}
            width="72%"
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2 border-t border-v2-outline-variant/10 pt-4">
          <SkeletonBlock
            height={10}
            width={48}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={32}
            width={112}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-v2-outline-variant/10 pt-4">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock
                height={9}
                width={40}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={14}
                width="80%"
                className={blockClassName}
                rounded="sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-v2-outline-variant/10 pt-3">
          <div className="flex gap-5">
            <SkeletonBlock
              height={18}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={18}
              width={36}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={18}
            width={18}
            className={blockClassName}
            rounded="sm"
          />
        </div>
      </div>
    </div>
  );
}

function GoalCircularProgress({
  current,
  target,
  size = 56,
  strokeWidth = 4,
}: {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const safeTarget = target > 0 ? target : 1;
  const progress = Math.min(current / safeTarget, 1);
  const offset = circumference - progress * circumference;
  const percent = Math.round(progress * 100);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#262626"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-v2-primary"
        />
      </svg>
      <span className="absolute text-[10px] font-bold text-v2-on-surface">
        {percent}%
      </span>
    </div>
  );
}

type WeeklyGoalItem = {
  id: string;
  current: number;
  target: number;
  label: string;
};

function DashboardGoalsSectionV2({
  loading,
  goals,
}: {
  loading: boolean;
  goals: WeeklyGoalItem[];
}) {
  if (loading) {
    return (
      <section className="space-y-2">
        <SkeletonBlock
          height={20}
          width={120}
          className="bg-v2-surface-container-high"
          rounded="sm"
        />
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-xl bg-v2-surface-container-low p-3"
            >
              <SkeletonBlock
                height={56}
                width={56}
                rounded="full"
                className="bg-v2-surface-container-high"
              />
              <SkeletonBlock
                height={10}
                width={56}
                className="bg-v2-surface-container-high"
                rounded="sm"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Weekly goals
      </h2>
      <div className="grid grid-cols-3 gap-2">
        {goals.map((goal) => (
          <div
            key={goal.id}
            className="flex flex-col items-center gap-2 rounded-xl bg-v2-surface-container-low p-3"
          >
            <GoalCircularProgress current={goal.current} target={goal.target} />
            <span className="text-center text-[9px] font-medium text-v2-on-surface-variant">
              {goal.current}/{goal.target} {goal.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardV2() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showUploadBanner, setShowUploadBanner] = useState(false);
  const [homeTrendEnabled, setHomeTrendEnabled] = useState(false);

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
    [user?.id],
  );

  const {
    data: activityPages,
    isLoading: activityLoading,
    error: activityError,
    refetch: refetchActivity,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<
    ActivityFeedPageResult,
    Error,
    InfiniteData<ActivityFeedPageResult>,
    typeof homeActivityFeedQueryKey,
    HomeActivityFeedPageParam
  >({
    queryKey: homeActivityFeedQueryKey,
    queryFn: ({ pageParam }) => {
      const param = pageParam as HomeActivityFeedPageParam;
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
    } satisfies HomeActivityFeedPageParam,
    getNextPageParam: (lastPage): HomeActivityFeedPageParam | undefined =>
      lastPage.hasMore
        ? { groupOffset: lastPage.nextGroupOffset ?? 0 }
        : undefined,
    placeholderData: (previousData) => previousData,
    enabled: Boolean(user),
  });

  const activity = useMemo(
    () =>
      (activityPages?.pages.flatMap((p) => p.items) ??
        []) as ActivityFeedItem[],
    [activityPages],
  );

  const feedSessions = useMemo(
    () => flattenFeedItemSessions(activity) as RawActivityItem[],
    [activity],
  );

  const profileSummaryKey = ownedProfileUserKey(user);
  const { data: profileHomeWeekly, isPending: profileHomeWeeklyPending } =
    useQuery({
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
    if (searchParams.get("uploaded") !== "1") return;
    setShowUploadBanner(true);
    setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!showUploadBanner) return;
    const timer = setTimeout(() => {
      setShowUploadBanner(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [showUploadBanner]);

  const weeklyStats = useMemo(() => {
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

    const thisWeek = feedSessions.filter(
      (i) => new Date(i.createdAt).getTime() >= startThisWeek,
    );
    const prevWeek = feedSessions.filter((i) => {
      const t = new Date(i.createdAt).getTime();
      return t >= startPrevWeek && t < startThisWeek;
    });

    const thisSessions = thisWeek.length;
    const prevSessions = prevWeek.length;
    const thisLaps = thisWeek.reduce((sum, i) => sum + (i.lapCount ?? 0), 0);
    const prevLaps = prevWeek.reduce((sum, i) => sum + (i.lapCount ?? 0), 0);

    const avgLapMs = 90_000;
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
  }, [feedSessions, profileHomeWeekly?.weeklySnapshot, user?.id]);

  const weeklySnapshotLoading = Boolean(user?.id) && profileHomeWeeklyPending;

  const goalsStats = useMemo(() => {
    const now = Date.now();
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const startThisWeek = now - weekMs;

    const thisWeek = feedSessions.filter(
      (i) => new Date(i.createdAt).getTime() >= startThisWeek,
    );

    const races = thisWeek.filter((s) =>
      isRaceKind({
        sessionType: s.sessionType ?? null,
        manualSessionKind: s.manualSessionKind ?? null,
      }),
    ).length;
    const podiums = thisWeek.filter(
      (s) =>
        isRaceKind({
          sessionType: s.sessionType ?? null,
          manualSessionKind: s.manualSessionKind ?? null,
        }) &&
        s.position != null &&
        s.position <= 3,
    ).length;
    const laps = thisWeek.reduce((sum, s) => sum + (s.lapCount ?? 0), 0);
    return { races, podiums, laps };
  }, [feedSessions]);

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

  const weeklyGoals: WeeklyGoalItem[] = useMemo(
    () => [
      {
        id: "races",
        current: goalsForBar.races,
        target: goalsForBar.racesTarget,
        label: "Races",
      },
      {
        id: "podiums",
        current: goalsForBar.podiums,
        target: goalsForBar.podiumsTarget,
        label: "Podiums",
      },
      {
        id: "laps",
        current: goalsForBar.laps,
        target: goalsForBar.lapsTarget,
        label: "Laps",
      },
    ],
    [goalsForBar],
  );

  const showApexTrendCard = Boolean(
    user?.id && profileTrendInsight?.apexTrendInsight,
  );

  const showEmptyFeedOnboarding = useMemo(() => {
    return (
      Boolean(user?.id) &&
      !showApexTrendCard &&
      !activityLoading &&
      !feedError &&
      !error &&
      activity.length === 0
    );
  }, [
    user?.id,
    showApexTrendCard,
    activityLoading,
    feedError,
    error,
    activity.length,
  ]);

  const displayName = user ? getAccountDisplayName(user) : "Driver";
  const weekLabel = profileHomeWeekly?.weeklySnapshot?.weekStart
    ? formatWeekLabel(profileHomeWeekly.weeklySnapshot.weekStart)
    : null;

  return (
    <>
      <PageMeta
        title={DASHBOARD_V2_TITLE}
        description={DASHBOARD_V2_DESCRIPTION}
        path={DASHBOARD_V2_PATH}
        noindex
      />
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-5 px-6 py-8">
        <DashboardStatGridV2
          loading={weeklySnapshotLoading}
          displayName={displayName}
          weekLabel={weekLabel}
          sessionsCount={weeklyStats.sessionsCount}
          totalLaps={weeklyStats.totalLaps}
          trackTimeMs={weeklyStats.trackTimeMs}
          sessionDelta={weeklyStats.sessionDelta}
          lapsDelta={weeklyStats.lapsDelta}
          trackTimeDelta={weeklyStats.trackTimeDelta}
        />

        <DashboardGoalsSectionV2
          loading={weeklySnapshotLoading}
          goals={weeklyGoals}
        />

        {showApexTrendCard && profileTrendInsight?.apexTrendInsight && (
          <ApexAnalysisTrendCardV2
            trend={profileTrendInsight.apexTrendInsight}
          />
        )}

        <section className="space-y-3">
          <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
            Latest session
          </h2>

          {showUploadBanner && (
            <div className="mb-4 flex items-center gap-3 rounded-lg border border-v2-success/30 bg-v2-success/10 px-4 py-3">
              <CheckCircle className="size-5 shrink-0 text-v2-success" />
              <p className="flex-1 text-sm text-v2-success">
                Your session was uploaded and processed successfully.
              </p>
              <button
                type="button"
                onClick={() => setShowUploadBanner(false)}
                className="p-1 text-v2-success/60 transition-colors hover:text-v2-success"
                aria-label="Dismiss"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {activityLoading ? (
            <div className="space-y-6">
              <p className="font-v2-body text-sm text-v2-on-surface-variant">
                Loading activity...
              </p>
              <FeedSkeletonCardV2 />
              <FeedSkeletonCardV2 />
              <FeedSkeletonCardV2 />
            </div>
          ) : (
            <>
              {feedError && (
                <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-3 font-v2-body text-sm text-v2-on-surface-variant">
                  <div>
                    Can&apos;t reach Apex backend. Check it&apos;s running.
                  </div>
                  <button
                    type="button"
                    className="mt-2 text-sm text-v2-on-surface transition-colors hover:text-v2-primary"
                    onClick={() => void refetchActivity()}
                  >
                    Retry
                  </button>
                </div>
              )}
              {error && !feedError && (
                <p className="font-v2-body text-sm text-v2-error">
                  Failed to load activity
                </p>
              )}
              {showEmptyFeedOnboarding && (
                <div className="py-4">
                  <OnboardingEmptyStateV2 />
                </div>
              )}
              {!error && !feedError && activity.length > 0 && (
                <ActivityFeedListV2
                  items={activity}
                  currentUser={user ?? null}
                  onSessionPatch={(id, patch) => {
                    queryClient.setQueryData<
                      InfiniteData<ActivityFeedPageResult>
                    >(homeActivityFeedQueryKey, (prev) =>
                      patchActivityFeedInfiniteData(
                        prev,
                        id,
                        patch as Record<string, unknown>,
                      ),
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
                    className="rounded-lg border border-v2-outline-variant/15 bg-v2-surface-container px-4 py-2 font-v2-body text-sm text-v2-on-surface transition-colors hover:bg-v2-surface-container-high disabled:pointer-events-none disabled:opacity-50"
                  >
                    {isFetchingNextPage ? "Loading…" : "Load more"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
