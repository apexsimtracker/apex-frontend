import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboards, type LeaderboardRow } from "@/lib/api";
import { formatLapMs } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";

const LEADERBOARDS_PATH = "/leaderboards";
const leaderboardsTitle = `Leaderboards | ${COMPANY_NAME}`;
const leaderboardsDescription = `Global sim racing leaderboards on ${COMPANY_NAME}: wins, races, podiums, fastest laps, and more.`;

const TAB_METRICS = {
  wins: "wins",
  races: "races",
  podiums: "podiums",
  fastestlaps: "fastestLap",
  avgfinish: "avgFinish",
} as const;

type TabKey = keyof typeof TAB_METRICS;

const LB_LIMIT = 10;

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
    if (v == null) return "—";
    const n = Number(v);
    if (!Number.isFinite(n)) return "—";
    return `${Math.round(n)} (${n.toFixed(1)})`;
  }
  const v = row.value;
  return v != null && Number.isFinite(Number(v)) ? String(Math.floor(Number(v))) : "—";
}

export default function Leaderboards() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("wins");

  const metric = TAB_METRICS[activeTab];

  const {
    data: rows = [],
    isPending: loading,
    isFetching,
    error,
    isError,
  } = useQuery({
    queryKey: ["leaderboards", metric, LB_LIMIT],
    queryFn: async () => {
      const data = await getLeaderboards(metric, LB_LIMIT);
      return Array.isArray(data) ? data : [];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const updating = isFetching && !loading;
  const err = error instanceof Error ? error.message : isError ? "Failed to load leaderboard." : null;

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <>
      <PageMeta title={leaderboardsTitle} description={leaderboardsDescription} path={LEADERBOARDS_PATH} />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-10 sm:mb-16">
          <h1 className="mb-2 text-3xl font-bold text-foreground sm:mb-3 sm:text-4xl">
            Leaderboards
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
            Compete and climb the rankings.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="border-white/3 mb-8 flex gap-4 overflow-x-auto border-b pb-2 sm:mb-12 sm:gap-8">
          <button
            onClick={() => setActiveTab("wins")}
            className={`whitespace-nowrap pb-2 transition-all ${
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
            <p className="text-sm font-semibold">Most Wins</p>
          </button>

          <button
            onClick={() => setActiveTab("races")}
            className={`whitespace-nowrap pb-2 transition-all ${
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
            <p className="text-sm font-semibold">Most Races</p>
          </button>

          <button
            onClick={() => setActiveTab("podiums")}
            className={`whitespace-nowrap pb-2 transition-all ${
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
            <p className="text-sm font-semibold">Podiums</p>
          </button>

          <button
            onClick={() => setActiveTab("fastestlaps")}
            className={`whitespace-nowrap pb-2 transition-all ${
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
            <p className="text-sm font-semibold">Fastest Laps</p>
          </button>

          <button
            onClick={() => setActiveTab("avgfinish")}
            className={`whitespace-nowrap pb-2 transition-all ${
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
            <p className="text-sm font-semibold">Avg Finish</p>
          </button>
        </div>

        {/* Leaderboard */}
        <div>
          {updating && (
            <p className="mb-2 py-1 text-xs text-muted-foreground/70">Updating…</p>
          )}

          {loading && (
            <p className="py-8 text-sm text-muted-foreground">Loading…</p>
          )}

          {!loading && isError && (
            <p className="py-8 text-sm text-muted-foreground">{err}</p>
          )}

          {!loading && !isError && rows.length === 0 && (
            <p className="py-8 text-sm text-muted-foreground">
              No rankings yet.
            </p>
          )}

          {!loading && !isError && rows.length > 0 && (
            <div className="space-y-0">
              {rows.map((row) => {
                const rank = row.rank ?? 0;
                const name = row.displayName ?? "";
                const value = formatValue(row, metric ?? "wins");
                const uid = row.userId?.trim();

                return (
                  <button
                    key={`${rank}-${name}`}
                    onClick={() => {
                      if (uid) navigate(`/user/${encodeURIComponent(uid)}`);
                    }}
                    className={`hover:bg-white/2 border-white/3 w-full border-b px-3 text-left transition-all sm:px-4 ${
                      rank <= 3 ? "py-3 sm:py-4" : "py-2.5 sm:py-3"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {/* Rank */}
                      <div className="flex w-5 shrink-0 items-center justify-center sm:w-6">
                        <span
                          className={`font-bold tabular-nums ${
                            rank <= 3
                              ? "text-xs text-white sm:text-sm"
                              : "text-xs text-white/60"
                          }`}
                        >
                          {getMedalEmoji(rank)}
                        </span>
                      </div>

                      {/* Driver Name */}
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-xs transition-colors sm:text-sm ${
                            rank <= 3
                              ? "font-semibold text-white"
                              : "font-medium text-white/70"
                          }`}
                        >
                          {name || "—"}
                        </p>
                      </div>

                      {/* Value */}
                      <div className="flex min-w-12 shrink-0 items-center justify-end sm:min-w-14">
                        <p
                          className={`font-bold tabular-nums ${
                            rank <= 3
                              ? "text-base text-white sm:text-lg"
                              : "text-xs text-white/60 sm:text-sm"
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
    </>
  );
}
