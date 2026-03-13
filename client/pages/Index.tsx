import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, X } from "lucide-react";
import ActivityCard from "@/components/ActivityCard";
import BundledActivityCard from "@/components/BundledActivityCard";
import DiscussionCard from "@/components/DiscussionCard";
import WeeklySnapshot from "@/components/WeeklySnapshot";
import OnboardingEmptyState from "@/components/OnboardingEmptyState";
import { SkeletonBlock } from "@/components/ui/skeleton";
import { apiGet, isNetworkError, getDiscussions, type Discussion } from "@/lib/api";
import { groupSessions, getActivityKey, type SessionItem, type ActivityItem as GroupedActivityItem } from "@/lib/groupSessions";
import GoalsBar from "@/components/GoalsBar";
import { useAuth } from "@/contexts/AuthContext";

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

function getActivityHeaderFromOwner(session: RawActivityItem): {
  name: string;
  avatar: string;
} {
  const owner = session.owner;
  const name =
    session.authorName?.trim() ||
    owner?.displayName?.trim() ||
    owner?.username?.trim() ||
    session.driverName ||
    "User";
  const avatar =
    (session.authorAvatarUrl && session.authorAvatarUrl.trim().length > 0
      ? session.authorAvatarUrl
      : owner?.avatarUrl && owner.avatarUrl.trim().length > 0
        ? owner.avatarUrl
        : undefined) || DEFAULT_AVATAR;
  return { name, avatar };
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

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop";

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
  const { user } = useAuth();
  const [activity, setActivity] = useState<RawActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [discussionsLoading, setDiscussionsLoading] = useState(true);
  const [showUploadBanner, setShowUploadBanner] = useState(false);

  const feedLoading = loading || discussionsLoading;

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

  const loadFeed = useCallback(() => {
    setLoading(true);
    setError(null);
    setFeedError(null);
    type ActivityResponse = RawActivityItem[] | { sessions?: RawActivityItem[]; activity?: RawActivityItem[] };
    apiGet<ActivityResponse>("/api/activity")
      .then((data) => {
        const list = Array.isArray(data)
          ? data
          : (data as { sessions?: RawActivityItem[] }).sessions ??
            (data as { activity?: RawActivityItem[] }).activity ??
            [];
        const sessions = Array.isArray(list) ? list : [];
        setActivity(sessions);
        setError(null);
        setFeedError(null);
      })
      .catch((err) => {
        if (isNetworkError(err)) {
          setFeedError("Can't reach Apex backend. Check it's running.");
        } else {
          setError(
            err instanceof Error ? err.message : "Failed to load activity",
          );
        }
        setActivity([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    function handleActivityUpdated() {
      loadFeed();
    }
    if (typeof window !== "undefined") {
      window.addEventListener("apex:activity-updated", handleActivityUpdated);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("apex:activity-updated", handleActivityUpdated);
      }
    };
  }, [loadFeed]);

  useEffect(() => {
    setDiscussionsLoading(true);
    getDiscussions()
      .then((list) => setDiscussions(Array.isArray(list) ? list : []))
      .catch(() => setDiscussions([]))
      .finally(() => setDiscussionsLoading(false));
  }, []);

  // Group sessions into bundled activities
  const groupedActivity = useMemo<GroupedActivityItem[]>(() => {
    return groupSessions(activity);
  }, [activity]);

  const weeklyStats = useMemo(() => {
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
  }, [activity]);

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

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <WeeklySnapshot
          sessionsCount={weeklyStats.sessionsCount}
          totalLaps={weeklyStats.totalLaps}
          trackTimeMs={weeklyStats.trackTimeMs}
          sessionDelta={weeklyStats.sessionDelta}
          lapsDelta={weeklyStats.lapsDelta}
          trackTimeDelta={weeklyStats.trackTimeDelta}
        />

        {/* Goals */}
        <GoalsBar
          races={goalsStats.races}
          podiums={goalsStats.podiums}
          laps={goalsStats.laps}
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
                    onClick={() => void loadFeed()}
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
                          setActivity((prev) =>
                            prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
                          );
                        }}
                      />
                    );
                  }
                  const session = item.session;
                  const header = getActivityHeaderFromOwner(session as RawActivityItem);
                  return (
                    <Link
                      key={getActivityKey(item)}
                      to={`/sessions/${session.id}`}
                      className="block"
                    >
                      <ActivityCard
                        id={session.id}
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
                          setActivity((prev) =>
                            prev.map((x) => (x.id === id ? { ...x, ...patch } : x))
                          );
                        }}
                      />
                    </Link>
                  );
                })}
            </>
          )}
          {discussions.map((d) => (
            <DiscussionCard
              key={d.id}
              id={d.id}
              title={d.title}
              excerpt={d.excerpt ?? (d.description ? (d.description.slice(0, 160) + (d.description.length > 160 ? "…" : "")) : "")}
              author={d.author}
              category={d.category}
              timestamp={timeAgo(d.createdAt)}
              replies={d.replies ?? d.commentCount ?? 0}
              views={d.views ?? 0}
              isPinned={d.isPinned}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
