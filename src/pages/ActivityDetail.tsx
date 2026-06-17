import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle,
  Flag,
  Heart,
  MessageCircle,
  Share2,
  Target,
  TrendingUp,
  Wrench,
  Zap,
} from "lucide-react";
import { apiGet, resolveApiUrl } from "@/lib/api";
import { formatLapMs } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, publicSessionUrl } from "@/lib/siteMeta";

function pickFirstString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t && t !== "—") return t;
    }
  }
  return null;
}

// Session detail from backend (GET /api/activity/:id). Add endpoint if missing.
export type SessionDetail = {
  id: string;
  driverName: string;
  track: string | null;
  car: string | null;
  position: number | null;
  totalDrivers: number | null;
  bestLapMs?: number | null; // milliseconds (canonical)
  lapCount?: number;
  createdAt: string | Date;
  // Optional: include when backend supports them
  userAvatar?: string | null;
  game?: string | null;
  trackName?: string | null;
  carName?: string | null;
  raceTime?: string | null;
  totalKm?: number | null;
  avgLapTime?: string | number | null;
  apexScore?: number | null;
  likes?: number | null;
  comments?: number | null;
};

// Helper to get ordinal suffix
const getOrdinalSuffix = (num: number) => {
  if (num % 100 >= 11 && num % 100 <= 13) return "th";
  switch (num % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

// UI shape used by the template (mapped from SessionDetail)
type ActivityView = {
  userName: string;
  userAvatar: string | null;
  game: string;
  track: string;
  position: number;
  totalRacers: number;
  fastestLap: string;
  raceTime: string;
  totalKm: number;
  avgLapTime: string;
  apexScore: number;
  timestamp: string;
  likes: number;
  comments: number;
};

function sessionToView(s: SessionDetail): ActivityView {
  const avgLap = s.avgLapTime != null ? String(s.avgLapTime) : "—";
  const any = s as any;
  const game = pickFirstString(
    s.game,
    any.game,
    any.sim,
    any.simName,
    any.sim_name,
    any.sourceSim
  );
  const track = pickFirstString(
    s.trackName,
    any.trackName,
    any.track_name,
    s.track,
    any.track,
    any.circuit,
    any.circuitName
  );
  return {
    userName: s.driverName,
    userAvatar: s.userAvatar ?? null,
    game: game ?? "—",
    track: track ?? "—",
    position: s.position ?? 0,
    totalRacers: s.totalDrivers ?? 0,
    fastestLap: formatLapMs(s.bestLapMs),
    raceTime: s.raceTime ?? "—",
    totalKm: s.totalKm ?? 0,
    avgLapTime: avgLap,
    apexScore: s.apexScore ?? 0,
    timestamp: timeAgo(s.createdAt),
    likes: s.likes ?? 0,
    comments: s.comments ?? 0,
  };
}

export default function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: activity,
    isPending: loading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["activity", "detail", id ?? ""],
    queryFn: async () => {
      const path = "/api/activity/" + id;
      const data = (await apiGet(path)) as SessionDetail;
      return sessionToView(data);
    },
    enabled: Boolean(id),
  });

  const error = isError
    ? queryError instanceof Error
      ? queryError.message
      : "Failed to load session"
    : null;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Activity | ${COMPANY_NAME}`}
          description={`Sim racing session on ${COMPANY_NAME}.`}
          path={`/activity/${id ?? ""}`}
        />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Activity not found | ${COMPANY_NAME}`}
          description={error ?? "This session could not be loaded."}
          path={`/activity/${id ?? ""}`}
          noindex
        />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-destructive">{error ?? "Session not found."}</p>
        </div>
      </div>
    );
  }

  const activityDesc = `${activity.userName} · ${activity.track} · ${activity.game}${
    activity.position ? ` · P${activity.position}` : ""
  } on ${COMPANY_NAME}.`;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${activity.track} · ${activity.userName} | ${COMPANY_NAME}`}
        description={activityDesc}
        path={`/activity/${id}`}
        image={resolveApiUrl(activity.userAvatar)}
        ogType="article"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Main Activity Card */}
        <div className="mb-8 overflow-hidden rounded-2xl border bg-card">
          {/* Header with user info */}
          <div className="border px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-3">
                {resolveApiUrl(activity.userAvatar) ? (
                  <img
                    src={resolveApiUrl(activity.userAvatar)!}
                    alt={activity.userName}
                    className="size-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-full border border-white/10 bg-muted text-xs font-semibold text-muted-foreground">
                    {(activity.userName || "?")
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("") || "?"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-foreground transition-colors group-hover:text-primary">
                    {activity.userName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {activity.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => id && navigate(`/sessions/${id}`)}
                className="text-muted-foreground transition-colors hover:text-primary"
                aria-label="View session detail"
              >
                •••
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Track and Game info */}
            <div className="mb-6">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {activity.game}
              </p>
              <h1 className="mb-4 text-3xl font-bold text-foreground">
                {activity.track}
              </h1>
            </div>

            {/* Race Result Section */}
            <div
              className={`mb-6 rounded-xl border p-6 ${
                activity.position === 1
                  ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:border-yellow-800/30 dark:from-yellow-950/20 dark:to-yellow-900/10"
                  : activity.position === 2
                    ? "border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 dark:border-gray-800/30 dark:from-gray-950/20 dark:to-gray-900/10"
                    : activity.position === 3
                      ? "border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 dark:border-orange-800/30 dark:from-orange-950/20 dark:to-orange-900/10"
                      : "border bg-secondary"
              }`}
            >
              <div className="mb-4 flex items-center gap-4">
                <div
                  className={`flex size-16 items-center justify-center rounded-full text-2xl font-bold text-black ${
                    activity.position === 1
                      ? "bg-gold"
                      : activity.position === 2
                        ? "bg-silver"
                        : activity.position === 3
                          ? "bg-bronze"
                          : "bg-muted"
                  }`}
                >
                  {activity.position === 1 && "🥇"}
                  {activity.position === 2 && "🥈"}
                  {activity.position === 3 && "🥉"}
                  {activity.position != null && activity.position > 3 && activity.position}
                </div>
                <div>
                  <p
                    className={`mb-1 text-xs font-medium uppercase tracking-wide ${
                      activity.position === 1
                        ? "text-gold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Podium Finish
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {activity.position}
                    <span className="ml-1 text-base">
                      {getOrdinalSuffix(activity.position)} Place
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    out of {activity.totalRacers} racers
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Fastest Lap
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {activity.fastestLap}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                    Race Time
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {activity.raceTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-secondary p-4">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Total KM Driven
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activity.totalKm}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Avg Lap Time
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activity.avgLapTime}
                </p>
              </div>
              <div className="rounded-lg bg-secondary p-4">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Apex Score
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {activity.apexScore}
                  </p>
                  <TrendingUp className="size-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between border px-6 py-4">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => id && navigate(`/sessions/${id}`)}
                className="group flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <Heart className="size-4 group-hover:fill-primary" />
                <span className="text-xs font-medium">{activity.likes}</span>
              </button>
              <button
                type="button"
                onClick={() => id && navigate(`/sessions/${id}`)}
                className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="size-4" />
                <span className="text-xs font-medium">{activity.comments}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share && id) {
                  navigator.share({
                    title: `${activity.track} – ${activity.userName}`,
                    url: publicSessionUrl(id),
                  }).catch(() => {});
                }
              }}
              className="text-muted-foreground transition-colors hover:text-primary"
              aria-label="Share"
            >
              <Share2 className="size-4" />
            </button>
          </div>
        </div>

        {/* Lap History Section */}
        <div className="mb-8 rounded-2xl border bg-card p-6">
          <div className="mb-6 flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Lap History</h2>
          </div>

          {/* Lap Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Lap
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Time
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Sector 1
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Sector 2
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Sector 3
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    lap: 1,
                    time: "1:15.234",
                    s1: "32.123",
                    s2: "21.456",
                    s3: "21.655",
                  },
                  {
                    lap: 2,
                    time: "1:14.456",
                    s1: "31.890",
                    s2: "21.234",
                    s3: "21.332",
                  },
                  {
                    lap: 3,
                    time: "1:14.234",
                    s1: "31.678",
                    s2: "21.123",
                    s3: "21.433",
                    isFastest: true,
                  },
                  {
                    lap: 4,
                    time: "1:14.789",
                    s1: "31.945",
                    s2: "21.456",
                    s3: "21.388",
                  },
                  {
                    lap: 5,
                    time: "1:14.567",
                    s1: "31.812",
                    s2: "21.234",
                    s3: "21.521",
                  },
                ].map((lap) => (
                  <tr
                    key={lap.lap}
                    className={`border transition-colors hover:bg-secondary`}
                    style={
                      lap.isFastest
                        ? { backgroundColor: "rgba(240, 28, 28, 0.05)" }
                        : {}
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                        {lap.lap}
                        {lap.isFastest && (
                          <Flag className="size-4 shrink-0 text-primary" aria-hidden />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-bold`}
                        style={
                          lap.isFastest ? { color: "rgb(240, 28, 28)" } : {}
                        }
                      >
                        {lap.time}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {lap.s1}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {lap.s2}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {lap.s3}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Light Analysis Section */}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Analysis & Highlights
          </h2>

          <div className="space-y-4">
            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <CheckCircle className="size-4 shrink-0 text-green-600 dark:text-green-500" aria-hidden />
                Strong Start
              </p>
              <p className="text-sm text-muted-foreground">
                Great launch control on lap 1. You were quick to build a
                comfortable lead.
              </p>
            </div>

            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Target className="size-4 shrink-0 text-foreground" aria-hidden />
                Consistent Pace
              </p>
              <p className="text-sm text-muted-foreground">
                Your lap times stayed within 0.5 seconds throughout the race,
                showing excellent consistency.
              </p>
            </div>

            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Zap className="size-4 shrink-0 text-amber-500" aria-hidden />
                Fastest Lap Performance
              </p>
              <p className="text-sm text-muted-foreground">
                Best lap came on lap 3. You gained 0.3s in Sector 2 compared to
                your average.
              </p>
            </div>

            <div className="rounded-lg bg-secondary p-4">
              <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
                <Wrench className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                Tire Management
              </p>
              <p className="text-sm text-muted-foreground">
                Excellent tire management. Your pace remained strong until the
                final laps.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
