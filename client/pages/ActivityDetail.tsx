import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  TrendingUp,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import { formatLapMs } from "@/lib/utils";

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

// Helper to convert username to URL slug
const userNameToSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "-");
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
  const car = pickFirstString(
    s.carName,
    any.carName,
    any.car_name,
    s.car,
    any.car,
    any.vehicle,
    any.vehicleName
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
  const [activity, setActivity] = useState<ActivityView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const path = "/api/activity/" + id;
        const data = (await apiGet(path)) as SessionDetail;
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log("[ActivityDetail] /api/activity/:id raw", data);
        }

        if (!cancelled) {
          const mapped = sessionToView ? sessionToView(data) : (data as any);
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log("[ActivityDetail] mapped view", mapped);
          }
          setActivity(mapped);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Failed to load session");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-destructive">{error ?? "Session not found."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        {/* Main Activity Card */}
        <div className="bg-card rounded-2xl border border overflow-hidden mb-8">
          {/* Header with user info */}
          <div className="px-6 py-4 border-b border">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 flex-1">
                {activity.userAvatar && activity.userAvatar.trim().length > 0 ? (
                  <img
                    src={activity.userAvatar}
                    alt={activity.userName}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted border border-white/10 flex items-center justify-center text-xs font-semibold text-muted-foreground">
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
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
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
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="View session detail"
              >
                •••
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            {/* Track and Game info */}
            <div className="mb-6">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                {activity.game}
              </p>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                {activity.track}
              </h1>
            </div>

            {/* Race Result Section */}
            <div
              className={`rounded-xl p-6 mb-6 border ${
                activity.position === 1
                  ? "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800/30"
                  : activity.position === 2
                    ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/20 dark:to-gray-900/10 border-gray-200 dark:border-gray-800/30"
                    : activity.position === 3
                      ? "bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/10 border-orange-200 dark:border-orange-800/30"
                      : "bg-secondary border"
              }`}
            >
              <div className="flex items-center gap-4 mb-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-black text-2xl ${
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
                  {activity.position > 3 && activity.position}
                </div>
                <div>
                  <p
                    className={`text-xs font-medium uppercase tracking-wide mb-1 ${
                      activity.position === 1
                        ? "text-gold"
                        : "text-muted-foreground"
                    }`}
                  >
                    Podium Finish
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {activity.position}
                    <span className="text-base ml-1">
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
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Fastest Lap
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {activity.fastestLap}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Race Time
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {activity.raceTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Total KM Driven
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activity.totalKm}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Avg Lap Time
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {activity.avgLapTime}
                </p>
              </div>
              <div className="bg-secondary rounded-lg p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Apex Score
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-foreground">
                    {activity.apexScore}
                  </p>
                  <TrendingUp className="w-5 h-5 text-green-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 border-t border flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() => id && navigate(`/sessions/${id}`)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors group"
              >
                <Heart className="w-4 h-4 group-hover:fill-primary" />
                <span className="text-xs font-medium">{activity.likes}</span>
              </button>
              <button
                type="button"
                onClick={() => id && navigate(`/sessions/${id}`)}
                className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs font-medium">{activity.comments}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.share && id) {
                  navigator.share({
                    title: `${activity.track} – ${activity.userName}`,
                    url: window.location.href,
                  }).catch(() => {});
                }
              }}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Share"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lap History Section */}
        <div className="bg-card rounded-2xl border border p-6 mb-8">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Lap History</h2>
          </div>

          {/* Lap Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border">
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Lap
                  </th>
                  <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Time
                  </th>
                  <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Sector 1
                  </th>
                  <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Sector 2
                  </th>
                  <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
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
                    className={`border-b border hover:bg-secondary transition-colors`}
                    style={
                      lap.isFastest
                        ? { backgroundColor: "rgba(240, 28, 28, 0.05)" }
                        : {}
                    }
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        {lap.lap}
                        {lap.isFastest && " 🏁"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`font-bold`}
                        style={
                          lap.isFastest ? { color: "rgb(240, 28, 28)" } : {}
                        }
                      >
                        {lap.time}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {lap.s1}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {lap.s2}
                    </td>
                    <td className="py-3 px-4 text-right text-muted-foreground">
                      {lap.s3}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Light Analysis Section */}
        <div className="bg-card rounded-2xl border border p-6">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Analysis & Highlights
          </h2>

          <div className="space-y-4">
            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                ✅ Strong Start
              </p>
              <p className="text-sm text-muted-foreground">
                Great launch control on lap 1. You were quick to build a
                comfortable lead.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                🎯 Consistent Pace
              </p>
              <p className="text-sm text-muted-foreground">
                Your lap times stayed within 0.5 seconds throughout the race,
                showing excellent consistency.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                ⚡ Fastest Lap Performance
              </p>
              <p className="text-sm text-muted-foreground">
                Best lap came on lap 3. You gained 0.3s in Sector 2 compared to
                your average.
              </p>
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <p className="text-sm font-semibold text-foreground mb-1">
                🔧 Tire Management
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
