import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import FeaturedChallenge from "@/components/FeaturedChallenge";
import ChallengeCard from "@/components/ChallengeCard";
import {
  getCompetitionSummary,
  getCompetitionsMeta,
  joinCompetition,
  type CompetitionSummary,
  type CompetitionsMeta,
} from "@/lib/api";
import { formatLapMs } from "@/lib/utils";

/** Set to true to hide all challenges (e.g. while backend still returns mock/seed data). Set to false when API returns real data only. */
const HIDE_CHALLENGES_LIST = true;

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
  const [items, setItems] = useState<CompetitionSummary[] | null>(null);
  const [meta, setMeta] = useState<CompetitionsMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "challenges" | "tournaments"
  >("all");

  async function onJoin(id: string) {
    try {
      setJoinError(null);
      setJoiningId(id);
      await joinCompetition(id);
      setItems((prev) =>
        prev ? prev.map((c) => (c.id === id ? { ...c, joined: true } : c)) : prev
      );
    } catch (e: unknown) {
      console.error(e);
      setJoinError(
        typeof (e as Error)?.message === "string"
          ? (e as Error).message
          : "Join failed"
      );
    } finally {
      setJoiningId(null);
    }
  }

  async function load() {
    try {
      setLoading(true);
      const data = await getCompetitionSummary();
      const list = Array.isArray(data) ? data : [];
      setItems(HIDE_CHALLENGES_LIST ? [] : list);
      setError(null);
      try {
        const m = await getCompetitionsMeta();
        setMeta(m);
      } catch (e) {
        console.error("Failed to load competitions meta", e);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = !items
    ? []
    : q.length === 0
      ? items
      : items.filter((c) => {
          const hay = `${c.title} ${c.sim} ${c.track} ${c.vehicle}`.toLowerCase();
          return hay.includes(q);
        });

  const featured =
    filtered.find((c) => c.status === "LIVE") ?? filtered[0] ?? null;
  const rest = featured ? filtered.filter((c) => c.id !== featured.id) : filtered;
  const filteredTournaments = rest;

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">Loading competitions…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (items && items.length === 0) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">
          No competitions available right now.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 sm:mb-3">
            Challenges & Tournaments
          </h1>
          <p className="text-muted-foreground/70 max-w-2xl text-xs sm:text-sm leading-relaxed">
            Compete in live challenges, qualify for tournaments, and climb the
            leaderboards.
          </p>
        </div>

        {/* Search */}
        <div className="mb-12 flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground/40" />
          <input
            type="text"
            placeholder="Search challenges, tracks, tournaments..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card/15 border border-white/4 rounded-lg text-foreground placeholder-muted-foreground/40 focus:outline-none focus:border-primary/40 text-sm transition-colors"
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
        <div className="flex gap-8 mb-10 border-b border-white/3 pb-4">
          <button
            onClick={() => setActiveTab("all")}
            className={`text-sm font-medium transition-colors relative ${
              activeTab === "all"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            All Competitions
            {activeTab === "all" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("challenges")}
            className={`text-sm font-medium transition-colors relative ${
              activeTab === "challenges"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            Challenges
            {activeTab === "challenges" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab("tournaments")}
            className={`text-sm font-medium transition-colors relative ${
              activeTab === "tournaments"
                ? "text-foreground"
                : "text-muted-foreground/60 hover:text-muted-foreground"
            }`}
          >
            Tournaments
            {activeTab === "tournaments" && (
              <div
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              />
            )}
          </button>
        </div>

        {/* Challenges Section */}
        {(activeTab === "all" || activeTab === "challenges") && (
          <div className="mb-16">
            <div className="mb-6">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest">
                ⚡ Weekly Challenges
              </h2>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Fast, repeatable competitions with instant feedback
              </p>
            </div>
            <div className="space-y-5 sm:space-y-6">
              {items && q.length > 0 && filtered.length === 0 ? (
                <p className="text-neutral-400 text-sm py-8">
                  No competitions match your search.
                </p>
              ) : (
                rest.map((c) => (
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
            <div className="mb-6 pt-8 border-t border-white/3">
              <h2 className="text-xs font-semibold text-foreground uppercase tracking-widest">
                🏆 Tournaments
              </h2>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Structured competitions with prizes and leaderboards
              </p>
            </div>
            <div className="space-y-5 sm:space-y-6">
              {items && q.length > 0 && filtered.length === 0 ? (
                <p className="text-neutral-400 text-sm py-8">
                  No competitions match your search.
                </p>
              ) : (
                filteredTournaments.map((c) => (
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
        <div className="mt-16 pt-12 border-t border-white/3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                This Week
              </p>
              <p className="text-2xl font-bold text-white">
                {meta?.activeChallenges ?? "—"}
              </p>
              <p className="text-xs text-white/60 mt-1">Active challenges</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                Your Rank
              </p>
              <p
                className="text-2xl font-bold"
                style={{ color: "rgb(240, 28, 28)" }}
              >
                {meta?.yourRank != null ? `#${meta.yourRank}` : "—"}
              </p>
              <p className="text-xs text-white/60 mt-1">Overall leaderboard</p>
            </div>
            <div>
              <p className="text-xs text-white/50 uppercase tracking-widest font-semibold mb-2">
                Joined
              </p>
              <p className="text-2xl font-bold text-white">
                {meta?.joinedThisSeason ?? "—"}
              </p>
              <p className="text-xs text-white/60 mt-1">
                Challenges this season
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
