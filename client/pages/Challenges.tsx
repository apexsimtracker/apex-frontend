import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Trophy, Zap } from "lucide-react";
import FeaturedChallenge from "@/components/FeaturedChallenge";
import ChallengeCard from "@/components/ChallengeCard";
import {
  getCompetitionSummary,
  getCompetitions,
  getCompetitionsMeta,
  joinCompetition,
  mapCompetitionsToPublicSummaries,
  type CompetitionSummary,
} from "@/lib/api";
import { formatLapMs } from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME, SITE_ORIGIN } from "@/lib/siteMeta";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthRedirectState } from "@/auth/authRedirect";

const CHALLENGES_PATH = "/challenges";
const challengesTitle = `Challenges | ${COMPANY_NAME}`;
const challengesDescription = `Sim racing challenges and tournaments on ${COMPANY_NAME}: compete, qualify, and climb leaderboards at ${SITE_ORIGIN.replace(/^https:\/\//, "")}.`;

function statusLabel(status: CompetitionSummary["status"]): "Live" | "Upcoming" | "Finished" {
  switch (status) {
    case "LIVE":
      return "Live";
    case "UPCOMING":
      return "Upcoming";
    case "FINISHED":
      return "Finished";
    default:
      return "Finished";
  }
}

const formatRemaining = (sec: number) => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m remaining`;
};

function competitionToCardProps(c: CompetitionSummary) {
  const timeRemaining =
    c.timeRemainingSec != null && c.status === "LIVE"
      ? formatRemaining(c.timeRemainingSec)
      : undefined;
  return {
    id: c.id,
    title: c.title,
    track: c.track,
    car: c.vehicle,
    game: c.sim,
    status: statusLabel(c.status),
    participants: c.participants,
    targetTime: c.targetTimeMs != null ? formatLapMs(c.targetTimeMs) : "—",
    fastestLap: c.fastestLapMs != null ? formatLapMs(c.fastestLapMs) : "—",
    yourLap: c.yourBestLapMs != null ? formatLapMs(c.yourBestLapMs) : "—",
    yourPosition: c.yourPosition ?? undefined,
    timeRemaining,
  };
}

export default function Challenges() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [joinError, setJoinError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "challenges" | "tournaments"
  >("all");

  const {
    data: items = null,
    isPending: loading,
    error: summaryError,
    isError: summaryFailed,
  } = useQuery({
    queryKey: ["competitions", "summary", user?.id ?? "anonymous"],
    queryFn: async () => {
      if (user) {
        const data = await getCompetitionSummary();
        return Array.isArray(data) ? data : [];
      }
      const raw = await getCompetitions();
      return mapCompetitionsToPublicSummaries(Array.isArray(raw) ? raw : []);
    },
  });

  /** Rank / joined counts require auth; listing is public via GET /api/competitions when logged out. */
  const { data: meta = null } = useQuery({
    queryKey: ["competitions", "meta", user?.id],
    queryFn: () => getCompetitionsMeta(),
    retry: false,
    enabled: Boolean(user),
  });

  const error = summaryFailed
    ? summaryError instanceof Error
      ? summaryError.message
      : String(summaryError)
    : null;

  const joinMutation = useMutation({
    mutationFn: (competitionId: string) => joinCompetition(competitionId),
    onSuccess: (_, competitionId) => {
      queryClient.setQueryData<CompetitionSummary[]>(["competitions", "summary"], (prev) =>
        prev ? prev.map((c) => (c.id === competitionId ? { ...c, joined: true } : c)) : prev
      );
      void queryClient.invalidateQueries({ queryKey: ["competitions", "meta"] });
    },
    onError: (e: unknown) => {
      console.error(e);
      setJoinError(
        typeof (e as Error)?.message === "string"
          ? (e as Error).message
          : "Join failed"
      );
    },
  });

  function onJoin(competitionId: string) {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to join challenges and track your results.",
        from: `${location.pathname}${location.search}`,
      };
      navigate("/login", { state });
      return;
    }
    setJoinError(null);
    joinMutation.mutate(competitionId);
  }

  const joiningId = joinMutation.isPending ? joinMutation.variables ?? null : null;

  const q = query.trim().toLowerCase();
  const filtered = !items
    ? []
    : q.length === 0
      ? items
      : items.filter((c) => {
          const hay = `${c.title} ${c.sim} ${c.track} ${c.vehicle}`.toLowerCase();
          return hay.includes(q);
        });

  const isTournament = (c: CompetitionSummary) =>
    (c as { kind?: string }).kind === "tournament";

  const weeklyPool = filtered.filter((c) => !isTournament(c));
  const tournamentPool = filtered.filter(isTournament);

  const featured =
    weeklyPool.find((c) => c.status === "LIVE") ?? weeklyPool[0] ?? null;
  const restWeekly = featured
    ? weeklyPool.filter((c) => c.id !== featured.id)
    : weeklyPool;

  const yourRank =
    meta?.yourRank != null && Number.isFinite(meta.yourRank)
      ? meta.yourRank
      : null;

  if (loading) {
    return (
      <>
        <PageMeta title={challengesTitle} description={challengesDescription} path={CHALLENGES_PATH} />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-muted-foreground">Loading competitions…</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta title={challengesTitle} description={challengesDescription} path={CHALLENGES_PATH} />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </>
    );
  }

  if (items && items.length === 0) {
    return (
      <>
        <PageMeta title={challengesTitle} description={challengesDescription} path={CHALLENGES_PATH} />
        <div className="flex min-h-screen items-center justify-center bg-background p-6">
          <p className="text-muted-foreground">
            No competitions available right now.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta title={challengesTitle} description={challengesDescription} path={CHALLENGES_PATH} />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-2 text-3xl font-bold text-foreground sm:mb-3 sm:text-4xl">
            Challenges & Tournaments
          </h1>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/70 sm:text-sm">
            Compete in live challenges, qualify for tournaments, and climb the
            leaderboards.
          </p>
        </div>

        {/* Search */}
        <div className="relative mb-12 flex-1">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search challenges, tracks, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-white/4 w-full rounded-lg border bg-card/15 py-2.5 pl-10 pr-4 text-sm text-foreground transition-colors placeholder:text-muted-foreground/40 focus:border-primary/40 focus:outline-none"
          />
        </div>

        {joinError && (
          <div className="mb-4 text-sm text-neutral-400">{joinError}</div>
        )}

        {/* Featured Challenge */}
        {featured && (
          <FeaturedChallenge
            {...competitionToCardProps(featured)}
            joined={featured.joined}
            onJoin={onJoin}
            joiningId={joiningId}
          />
        )}

        {/* Tabs */}
        <div className="border-white/3 mb-10 flex gap-8 border-b pb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`relative text-sm font-medium transition-colors ${
              activeTab === "all"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            All Competitions
            {activeTab === "all" && (
              <div
                className="absolute inset-x-0 bottom-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`relative text-sm font-medium transition-colors ${
              activeTab === "challenges"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            Challenges
            {activeTab === "challenges" && (
              <div
                className="absolute inset-x-0 bottom-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`relative text-sm font-medium transition-colors ${
              activeTab === "tournaments"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            Tournaments
            {activeTab === "tournaments" && (
              <div
                className="absolute inset-x-0 bottom-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
        </div>

        {/* Challenges Section */}
        {(activeTab === "all" || activeTab === "challenges") && (
          <div className="mb-16">
            <div className="mb-6">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground">
                <Zap className="size-4 shrink-0 text-foreground" aria-hidden />
                Weekly Challenges
              </h2>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Fast, repeatable competitions with instant feedback
              </p>
            </div>
            <div className="space-y-5 sm:space-y-6">
              {items && q.length > 0 && filtered.length === 0 ? (
                <p className="py-8 text-sm text-neutral-400">
                  No competitions match your search.
                </p>
              ) : (
                restWeekly.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    {...competitionToCardProps(c)}
                    joined={c.joined}
                    onJoin={onJoin}
                    joiningId={joiningId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Tournaments Section */}
        {(activeTab === "all" || activeTab === "tournaments") && (
          <div className="mb-16">
            <div className="border-white/3 mb-6 border-t pt-8">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-foreground">
                <Trophy className="size-4 shrink-0 text-foreground" aria-hidden />
                Tournaments
              </h2>
              <p className="mt-1 text-xs text-muted-foreground/50">
                Structured competitions with prizes and leaderboards
              </p>
            </div>
            <div className="space-y-5 sm:space-y-6">
              {items && q.length > 0 && filtered.length === 0 ? (
                <p className="py-8 text-sm text-neutral-400">
                  No competitions match your search.
                </p>
              ) : (
                tournamentPool.map((c) => (
                  <ChallengeCard
                    key={c.id}
                    {...competitionToCardProps(c)}
                    joined={c.joined}
                    onJoin={onJoin}
                    joiningId={joiningId}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="border-white/3 mt-16 border-t pt-12">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                This Week
              </p>
              <p className="text-2xl font-bold text-white">
                {meta?.activeChallenges ?? "—"}
              </p>
              <p className="mt-1 text-xs text-white/60">Active challenges</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                Your Rank
              </p>
              <p
                className={
                  yourRank != null
                    ? "text-2xl font-bold"
                    : "text-2xl font-bold text-white"
                }
                style={
                  yourRank != null
                    ? { color: "rgb(240, 28, 28)" }
                    : undefined
                }
              >
                {yourRank != null ? `#${yourRank}` : "Unranked"}
              </p>
              <p className="mt-1 text-xs text-white/60">Overall leaderboard</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
                Joined
              </p>
              <p className="text-2xl font-bold text-white">
                {meta?.joinedThisSeason ?? "—"}
              </p>
              <p className="mt-1 text-xs text-white/60">
                Challenges this season
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
