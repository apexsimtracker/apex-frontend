import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaderboards, type LeaderboardRow } from "@/lib/api";
import { formatLapMs } from "@/lib/utils";

const TAB_METRICS = {
  wins: "wins",
  races: "races",
  podiums: "podiums",
  fastestlaps: "fastestLap",
  avgfinish: "avgFinish",
} as const;

type TabKey = keyof typeof TAB_METRICS;

function displayNameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function formatValue(
  row: LeaderboardRow,
  metric: string
): string {
  if (metric === "fastestLap") {
    const ms = row.bestLapMs ?? row.value ?? null;
    return formatLapMs(ms != null ? Number(ms) : null);
  }
  if (metric === "avgFinish") {
    const v = row.value;
    return v != null && Number.isFinite(Number(v))
      ? Number(v).toFixed(1)
      : "—";
  }
  const v = row.value;
  return v != null && Number.isFinite(Number(v)) ? String(Math.floor(Number(v))) : "—";
}

// In-memory cache keyed by metric (persists across tab switches)
const leaderboardCache: Record<string, LeaderboardRow[]> = {};

export default function Leaderboards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("wins");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const activeMetricRef = useRef<string>(TAB_METRICS.wins);

  const metric = TAB_METRICS[activeTab];

  // Sync from cache when tab changes, then refetch in background (stale-while-revalidate)
  useEffect(() => {
    if (!metric) return;
    activeMetricRef.current = metric;
    const cached = leaderboardCache[metric];

    if (cached?.length) {
      setRows(cached);
      setLoading(false);
      setError(null);
      setBackgroundError(null);
      setUpdating(true);
      getLeaderboards(metric, 10)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          leaderboardCache[metric] = arr;
          if (activeMetricRef.current === metric) setRows(arr);
        })
        .catch((e) => {
          if (activeMetricRef.current === metric)
            setBackgroundError(e instanceof Error ? e.message : "Failed to update.");
        })
        .finally(() => {
          if (activeMetricRef.current === metric) setUpdating(false);
        });
    } else {
      setLoading(true);
      setError(null);
      setBackgroundError(null);
      getLeaderboards(metric, 10)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          leaderboardCache[metric] = arr;
          if (activeMetricRef.current === metric) setRows(arr);
        })
        .catch((e) => {
          if (activeMetricRef.current === metric) {
            setError(e instanceof Error ? e.message : "Failed to load leaderboard.");
            setRows([]);
          }
        })
        .finally(() => {
          if (activeMetricRef.current === metric) setLoading(false);
        });
    }
  }, [activeTab, metric]);

  // Auto-refresh current metric when window regains focus
  useEffect(() => {
    const onFocus = () => {
      const m = activeMetricRef.current;
      if (!m) return;
      getLeaderboards(m, 10)
        .then((data) => {
          const arr = Array.isArray(data) ? data : [];
          leaderboardCache[m] = arr;
          if (activeMetricRef.current === m) {
            setRows(arr);
            setBackgroundError(null);
          }
        })
        .catch((e) => {
          if (activeMetricRef.current === m)
            setBackgroundError(e instanceof Error ? e.message : "Failed to update.");
        });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-10 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3">
            Leaderboards
          </h1>
          <p className="text-muted-foreground/70 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Compete and climb the rankings.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-4 sm:gap-8 mb-8 sm:mb-12 overflow-x-auto pb-2 border-b border-white/3">
          <button
            onClick={() => setActiveTab("wins")}
            className={`pb-2 transition-all whitespace-nowrap ${
              activeTab === "wins"
                ? "border-b-2 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === "wins"
                ? { borderBottomColor: "rgb(240, 28, 28)" }
                : {}
            }
          >
            <p className="font-semibold text-sm">Most Wins</p>
          </button>

          <button
            onClick={() => setActiveTab("races")}
            className={`pb-2 transition-all whitespace-nowrap ${
              activeTab === "races"
                ? "border-b-2 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === "races"
                ? { borderBottomColor: "rgb(240, 28, 28)" }
                : {}
            }
          >
            <p className="font-semibold text-sm">Most Races</p>
          </button>

          <button
            onClick={() => setActiveTab("podiums")}
            className={`pb-2 transition-all whitespace-nowrap ${
              activeTab === "podiums"
                ? "border-b-2 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === "podiums"
                ? { borderBottomColor: "rgb(240, 28, 28)" }
                : {}
            }
          >
            <p className="font-semibold text-sm">Podiums</p>
          </button>

          <button
            onClick={() => setActiveTab("fastestlaps")}
            className={`pb-2 transition-all whitespace-nowrap ${
              activeTab === "fastestlaps"
                ? "border-b-2 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === "fastestlaps"
                ? { borderBottomColor: "rgb(240, 28, 28)" }
                : {}
            }
          >
            <p className="font-semibold text-sm">Fastest Laps</p>
          </button>

          <button
            onClick={() => setActiveTab("avgfinish")}
            className={`pb-2 transition-all whitespace-nowrap ${
              activeTab === "avgfinish"
                ? "border-b-2 text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={
              activeTab === "avgfinish"
                ? { borderBottomColor: "rgb(240, 28, 28)" }
                : {}
            }
          >
            <p className="font-semibold text-sm">Avg Finish</p>
          </button>
        </div>

        {/* Leaderboard */}
        <div>
          {updating && (
            <p className="text-muted-foreground/70 text-xs py-1 mb-2">Updating…</p>
          )}
          {backgroundError && (
            <p className="text-muted-foreground/70 text-xs py-1 mb-2">{backgroundError}</p>
          )}

          {loading && (
            <p className="text-muted-foreground text-sm py-8">Loading…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-muted-foreground py-8">{error}</p>
          )}

          {!loading && !error && (!rows || rows.length === 0) && (
            <p className="text-muted-foreground text-sm py-8">
              No rankings yet.
            </p>
          )}

          {!loading && !error && rows && rows.length > 0 && (
            <div className="space-y-0">
              {rows.map((row) => {
                const rank = row.rank ?? 0;
                const name = row.displayName ?? "";
                const slug = displayNameToSlug(name);
                const value = formatValue(row, metric ?? "wins");

                return (
                  <button
                    key={`${rank}-${name}`}
                    onClick={() => navigate(`/user/${slug}`)}
                    className={`w-full transition-all hover:bg-white/2 text-left border-b border-white/3 px-3 sm:px-4 ${
                      rank <= 3 ? "py-3 sm:py-4" : "py-2.5 sm:py-3"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Rank */}
                      <div className="w-5 sm:w-6 flex items-center justify-center flex-shrink-0">
                        <span
                          className={`font-bold tabular-nums ${
                            rank <= 3
                              ? "text-xs sm:text-sm text-white"
                              : "text-xs text-white/60"
                          }`}
                        >
                          {getMedalEmoji(rank)}
                        </span>
                      </div>

                      {/* Driver Name */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate transition-colors text-xs sm:text-sm ${
                            rank <= 3
                              ? "font-semibold text-white"
                              : "font-medium text-white/70"
                          }`}
                        >
                          {name || "—"}
                        </p>
                      </div>

                      {/* Value */}
                      <div className="flex items-center justify-end flex-shrink-0 min-w-12 sm:min-w-14">
                        <p
                          className={`font-bold tabular-nums ${
                            rank <= 3
                              ? "text-base sm:text-lg text-white"
                              : "text-xs sm:text-sm text-white/60"
                          }`}
                        >
                          {value}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
