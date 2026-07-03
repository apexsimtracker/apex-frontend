import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getLeaderboards, type LeaderboardRow } from "@/lib/api";
import { formatLapMs, cn } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import UserAvatar from "@/components/UserAvatar";
import { COMPANY_NAME } from "@/lib/siteMeta";

const LEADERBOARDS_V2_PATH = "/v2/leaderboards";
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

const TAB_CONFIG: Record<TabKey, { label: string; suffix: string }> = {
  wins: { label: "Most Wins", suffix: "WINS" },
  races: { label: "Most Races", suffix: "RACES" },
  podiums: { label: "Podiums", suffix: "PODIUMS" },
  fastestlaps: { label: "Fastest Laps", suffix: "LAP" },
  avgfinish: { label: "Avg Finish", suffix: "AVG" },
};

const LB_LIMIT = 10;

function formatValue(row: LeaderboardRow, metric: string): string {
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
  return v != null && Number.isFinite(Number(v))
    ? String(Math.floor(Number(v)))
    : "—";
}

function rankBadgeClassName(rank: number): string {
  if (rank === 1) return "bg-[#ffd700] text-black";
  if (rank === 2) return "bg-silver text-black";
  if (rank === 3) return "bg-bronze text-black";
  return "bg-[#3a3a3a] text-white";
}

export default function LeaderboardsV2() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("wins");

  const metric = TAB_METRICS[activeTab];
  const metricSuffix = TAB_CONFIG[activeTab].suffix;

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
  const err =
    error instanceof Error
      ? error.message
      : isError
        ? "Failed to load leaderboard."
        : null;

  return (
    <>
      <PageMeta
        title={leaderboardsTitle}
        description={leaderboardsDescription}
        path={LEADERBOARDS_V2_PATH}
      />
      <div className="mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col overflow-y-auto px-6 pb-4 pt-5">
        <section className="mb-5">
          <h1 className="font-v2-headline text-3xl font-bold tracking-tight text-v2-on-surface">
            Leaderboards
          </h1>
          <p className="mt-1 font-v2-body text-[10px] font-semibold uppercase tracking-widest text-v2-on-surface-variant">
            Compete and climb the rankings
          </p>
        </section>

        <section className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {(Object.keys(TAB_CONFIG) as TabKey[]).map((tabKey) => {
            const isActive = activeTab === tabKey;
            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={cn(
                  "shrink-0 rounded-md px-4 py-2 font-v2-body text-xs font-bold transition-colors",
                  isActive
                    ? "bg-v2-primary text-white"
                    : "bg-v2-surface-container-low text-v2-on-surface-variant hover:text-v2-on-surface",
                )}
              >
                {TAB_CONFIG[tabKey].label}
              </button>
            );
          })}
        </section>

        <section className="rounded-xl bg-v2-surface-container-low p-2">
          {updating && (
            <p className="px-2 py-1 font-v2-body text-xs text-v2-on-surface-variant">
              Updating…
            </p>
          )}

          {loading && (
            <p className="px-2 py-8 font-v2-body text-sm text-v2-on-surface-variant">
              Loading…
            </p>
          )}

          {!loading && isError && (
            <p className="px-2 py-8 font-v2-body text-sm text-v2-on-surface-variant">
              {err}
            </p>
          )}

          {!loading && !isError && rows.length === 0 && (
            <p className="px-2 py-8 font-v2-body text-sm text-v2-on-surface-variant">
              No rankings yet.
            </p>
          )}

          {!loading && !isError && rows.length > 0
            ? rows.map((row, index) => {
                const rank = row.rank ?? index + 1;
                const name = row.displayName ?? "";
                const value = formatValue(row, metric ?? "wins");
                const uid = row.userId?.trim();
                const isTopThree = rank <= 3;

                return (
                  <button
                    key={`${rank}-${name}-${index}`}
                    type="button"
                    onClick={() => {
                      if (uid) {
                        navigate(`/v2/user/${encodeURIComponent(uid)}`);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 border-b border-v2-outline-variant/10 px-2 py-3 text-left transition-colors last:border-b-0 hover:bg-v2-surface-container-high/50",
                      !uid && "cursor-default",
                    )}
                  >
                    <div
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full font-v2-headline text-xs font-bold",
                        rankBadgeClassName(rank),
                      )}
                    >
                      {rank}
                    </div>

                    <UserAvatar
                      name={name || "Driver"}
                      size="md"
                      className="ring-v2-outline-variant/30"
                    />

                    <p
                      className={cn(
                        "min-w-0 flex-1 truncate font-v2-body text-sm",
                        isTopThree
                          ? "font-bold text-v2-on-surface"
                          : "font-medium text-v2-on-surface",
                      )}
                    >
                      {name || "—"}
                    </p>

                    <p className="shrink-0 font-v2-headline font-bold text-v2-primary">
                      {value}
                      <span className="ml-1 font-v2-body text-[10px] font-medium text-v2-on-surface-variant">
                        {metricSuffix}
                      </span>
                    </p>
                  </button>
                );
              })
            : null}
        </section>
      </div>
    </>
  );
}
