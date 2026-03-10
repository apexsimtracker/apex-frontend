import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User } from "lucide-react";
import type { ProfileSummary } from "../lib/api";
import { formatLapMs, formatCarName } from "../lib/utils";
import SimBadge from "./SimBadge";
import { getSimDisplayName } from "../lib/sim";

type ProfileViewProps = {
  profile: ProfileSummary;
  onBack?: () => void;
  /** Profile picture URL; when empty or not set, a blank placeholder is shown (customizable via this prop). */
  avatarUrl?: string | null;
  /** Optional explicit bio for display; if absent, falls back to profile.user.bio/tagline. */
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  followLoading?: boolean;
  onToggleFollow?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  /** When set and isCurrentUser, shows an Edit Profile button that calls this. */
  onEditProfile?: () => void;
};

export function ProfileView({
  profile,
  onBack,
  avatarUrl,
  bio,
  followersCount,
  followingCount,
  isCurrentUser,
  isFollowing,
  followLoading,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
  onEditProfile,
}: ProfileViewProps) {
  const navigate = useNavigate();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [displayedRaces, setDisplayedRaces] = useState(6);

  const handleLoadMore = () => {
    setDisplayedRaces((prev) =>
      Math.min(prev + 6, profile.raceHistory.length)
    );
  };

  const handleHideRaces = () => {
    setDisplayedRaces(6);
  };

  const user = profile.user as {
    displayName?: string;
    name?: string;
    email?: string;
    bio?: string;
    tagline?: string;
  };
  const raw = (user.displayName ?? user.name)?.trim();
  const isPlaceholder = raw && /^Local\s+(Driver|user)$/i.test(raw);
  const displayName = (raw && !isPlaceholder) ? raw : (user.email?.trim() || "User");
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  const showAvatarImg = Boolean(avatarUrl && String(avatarUrl).trim());
  if (import.meta.env.DEV) {
    console.log("[ProfileView] avatarUrl prop:", avatarUrl ?? "(missing)", "→ rendered avatar src:", showAvatarImg ? avatarUrl : "(placeholder)");
  }

  const raceHistory = profile.raceHistory ?? [];
  const displayedHistory = raceHistory.slice(0, displayedRaces);

  const emptyBuckets = {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
  const weekly = profile.weekly?.buckets ?? emptyBuckets;
  const weeklyValues = [
    weekly.Mon ?? 0,
    weekly.Tue ?? 0,
    weekly.Wed ?? 0,
    weekly.Thu ?? 0,
    weekly.Fri ?? 0,
    weekly.Sat ?? 0,
    weekly.Sun ?? 0,
  ];
  const weeklyTotal = weeklyValues.reduce((a, b) => a + b, 0);
  const maxWeekly = Math.max(...weeklyValues, 1);

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12 sm:pt-4 sm:pb-16">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 sm:mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
        )}

        {/* Profile Header - HERO */}
        <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-5 sm:p-8 mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-7 justify-between">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1">
              {showAvatarImg ? (
                <img
                  src={String(avatarUrl).trim()}
                  alt="Profile"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-1 ring-white/5 flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted border border-white/10 flex items-center justify-center flex-shrink-0 text-muted-foreground"
                  aria-label="Profile picture placeholder"
                >
                  <User className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
              )}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-0.5 sm:mb-1">
                  {displayName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 justify-center sm:justify-start text-xs mb-1">
                  {typeof followersCount === "number" && typeof followingCount === "number" && (
                    <>
                      <button
                        type="button"
                        onClick={onOpenFollowers}
                        className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        <span className="font-semibold text-foreground">
                          {followersCount}
                        </span>
                        <span className="text-muted-foreground/60">Followers</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenFollowing}
                        className="flex items-center gap-1 text-muted-foreground/70 hover:text-foreground transition-colors"
                      >
                        <span className="font-semibold text-foreground">
                          {followingCount}
                        </span>
                        <span className="text-muted-foreground/60">Following</span>
                      </button>
                    </>
                  )}
                  {isCurrentUser && onEditProfile && (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="text-muted-foreground/70 hover:text-foreground transition-colors font-medium underline underline-offset-2"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                {profile.user.streakDays > 0 && (
                  <div className="text-xs text-neutral-400 mt-1">
                    {profile.user.streakDays === 1
                      ? "1 day driving streak"
                      : `${profile.user.streakDays} days driving streak`}
                  </div>
                )}
                <p className="text-muted-foreground/80 text-sm leading-relaxed mt-1 mb-2 sm:mb-3">
                  {bio?.trim() ||
                  user.bio?.trim() ||
                  user.tagline?.trim() ||
                  "No bio yet."}
                </p>
              </div>
            </div>
              <div className="text-center sm:text-right sm:min-w-max space-y-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                {profile.user.level != null
                  ? `Level ${profile.user.level}`
                  : "—"}
              </p>
              <p className="text-xs text-muted-foreground/60 mb-1.5">
                {profile.user.levelProgressPct != null
                  ? `${profile.user.levelProgressPct}% to next`
                  : "—"}
              </p>
              <div className="w-24 sm:w-32 h-0.5 mx-auto sm:mx-0 bg-secondary/30 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${profile.user.levelProgressPct ?? 0}%`,
                    backgroundColor: "rgb(240, 28, 28)",
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Key Stats - Subtle Minimal Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-5">
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                Races
              </p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {profile.totals?.races ?? 0}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                Wins
              </p>
              <p className="text-sm sm:text-base font-semibold text-yellow-200">
                {safeValue(profile.totals?.wins)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                Podiums
              </p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {safeValue(profile.totals?.podiums)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                Poles
              </p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {safeValue(profile.totals?.poles)}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                FL
              </p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {profile.totals?.fastestLaps ?? 0}
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground/50 uppercase mb-1">
                Avg
              </p>
              <p className="text-sm sm:text-base font-semibold text-foreground">
                {safeValue(profile.totals?.avgFinish)}
              </p>
            </div>
          </div>
        </div>

        {profile.insight &&
          profile.insight.title &&
          profile.insight.body && (
            <Link
              to={`/sessions/${profile.insight.sessionId}`}
              className="mt-6 block rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors"
            >
              <div className="text-xs tracking-wide text-neutral-400">
                {profile.insight.title.toUpperCase()}
              </div>
              <div className="mt-1 text-sm text-neutral-200">
                {profile.insight.body}
              </div>
            </Link>
          )}

        {/* Placeholder Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6 md:col-span-2">
            <h2 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-widest">
              Weekly Stats
            </h2>

            {/* Weekly Chart */}
            <div className="mb-8">
              {weeklyTotal === 0 ? (
                <div className="h-[220px] flex flex-col items-center justify-center text-center text-neutral-400">
                  <div className="text-sm">No sessions this week yet.</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Run a session to start building your weekly pattern.
                  </div>
                </div>
              ) : (
                <div className="flex items-end justify-between gap-2 h-[160px] mb-4">
                  {(
                    [
                      "Mon",
                      "Tue",
                      "Wed",
                      "Thu",
                      "Fri",
                      "Sat",
                      "Sun",
                    ] as const
                  ).map((day, i) => {
                    const value = weeklyValues[i] ?? 0;
                    const heightPct = (value / maxWeekly) * 100;
                    return (
                      <div
                        key={day}
                        className="flex-1 flex flex-col items-center gap-2"
                      >
                        <div className="w-full h-[160px] flex items-end justify-center relative">
                          <div
                            className="w-full rounded-lg transition-all duration-300 cursor-pointer relative group"
                            style={{
                              height: `${heightPct}%`,
                              background:
                                "linear-gradient(to top, rgb(240, 28, 28), rgba(240, 28, 28, 0.6))",
                            }}
                            onMouseEnter={() => setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                          >
                            {hoveredDay === day && (
                              <div
                                className="absolute inset-0 flex flex-col items-center justify-center rounded-lg p-2"
                                style={{
                                  backgroundColor:
                                    "rgba(240, 28, 28, 0.2)",
                                }}
                              >
                                <p className="text-xs font-bold text-white">
                                  {day}
                                </p>
                                <p className="text-xs text-white">
                                  {value} races
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground">
                          {day}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Weekly Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Total Races
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.weekly?.totalRaces ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Wins
                </p>
                <p className="text-2xl font-bold text-yellow-200">
                  {safeValue(profile.weekly?.wins)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Avg Finish
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {safeValue(profile.weekly?.avgFinish)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                  Total KM
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {safeValue(profile.weekly?.totalKm)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 p-6">
            <h2 className="text-sm font-semibold text-foreground mb-6 uppercase tracking-widest">
              Most-Played
            </h2>
            {(profile.mostPlayed?.length ?? 0) === 0 ? (
              <div className="h-[220px] flex flex-col items-center justify-center text-center text-neutral-400">
                <div className="text-sm">No sessions recorded yet.</div>
                <div className="mt-1 text-xs text-neutral-500">
                  Your most-played sims will appear here.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(profile.mostPlayed ?? []).map((sim) => (
                  <div key={sim.sim}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground">
                            {getSimDisplayName(sim.sim)}
                          </p>
                          <SimBadge sim={sim.sim} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {sim.km != null ? `${sim.km} km` : "—"}
                        </p>
                      </div>
                      <span className="text-lg">🏎️</span>
                    </div>
                    <div className="h-2 bg-secondary/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, sim.pctOfTotal)}%`,
                          backgroundColor: "rgb(240, 28, 28)",
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {sim.pctOfTotal.toFixed(0)}% of total • {sim.sessions}{" "}
                      sessions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Race History Section */}
        <div className="mt-12 bg-card/40 backdrop-blur-xl rounded-lg border border-white/10 dark:border-white/10 p-8">
          <h2 className="text-2xl font-bold text-foreground mb-8">
            Race History
          </h2>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border">
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Date
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    SIM
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Car
                  </th>
                  <th className="text-left text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Track
                  </th>
                  <th className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Position
                  </th>
                  <th className="text-center text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Quali Pos
                  </th>
                  <th className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wide py-3 px-4">
                    Best Lap
                  </th>
                </tr>
              </thead>
              <tbody>
                {raceHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-neutral-400"
                    >
                      Your race history will appear here after your first race
                      session.
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((race) => (
                    <tr
                      key={race.id}
                      onClick={() => navigate(`/sessions/${race.id}`)}
                      className="border-b border hover:bg-secondary transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(race.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <SimBadge sim={race.sim} size="md" />
                          {race.source === "MANUAL_ACTIVITY" && (
                            <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded border bg-white/5 text-white/60 border-white/10">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {formatCarName(race.car)}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {race.track}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                            race.position === 1
                              ? "bg-yellow-50 dark:bg-yellow-950/20 text-gold"
                              : race.position === 2
                                ? "bg-gray-100 dark:bg-gray-800/40 text-silver"
                                : race.position === 3
                                  ? "bg-orange-50 dark:bg-orange-950/20 text-bronze"
                                  : "bg-secondary text-foreground"
                          }`}
                        >
                          {race.position ?? "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm font-bold text-foreground">
                          {race.source === "MANUAL_ACTIVITY"
                            ? "—"
                            : (race.qualiPos ?? "—")}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-foreground">
                        {formatLapMs(race.bestLapMs)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {raceHistory.length === 0 ? (
              <div className="py-10 text-center text-neutral-400 text-sm">
                Your race history will appear here after your first race
                session.
              </div>
            ) : (
              displayedHistory.map((race) => (
                <div
                  key={race.id}
                  onClick={() => navigate(`/sessions/${race.id}`)}
                  className="border border/40 rounded-lg p-4 hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <SimBadge sim={race.sim} size="md" />
                        {race.source === "MANUAL_ACTIVITY" && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded border bg-white/5 text-white/60 border-white/10">
                            Manual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(race.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                        race.position === 1
                          ? "bg-yellow-50 dark:bg-yellow-950/20 text-gold"
                          : race.position === 2
                            ? "bg-gray-100 dark:bg-gray-800/40 text-silver"
                            : race.position === 3
                              ? "bg-orange-50 dark:bg-orange-950/20 text-bronze"
                              : "bg-secondary text-foreground"
                      }`}
                    >
                      P{race.position ?? "—"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {race.track}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatCarName(race.car)}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground">Quali</p>
                      <p className="font-bold text-foreground">
                        {race.source === "MANUAL_ACTIVITY"
                          ? "—"
                          : (race.qualiPos ?? "—")}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Best Lap</p>
                      <p className="font-bold text-foreground">
                        {race.bestLapMs != null
                          ? formatLapMs(race.bestLapMs)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {race.source === "MANUAL_ACTIVITY" ? "Manual" : "Status"}
                      </p>
                      <p className="font-bold text-foreground">
                        {race.source === "MANUAL_ACTIVITY" ? "—" : "✓"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Load More / Hide */}
          <div className="mt-6 text-center">
            {displayedRaces < raceHistory.length ? (
              <button
                onClick={handleLoadMore}
                className="px-6 py-2 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                Load more races
              </button>
            ) : (
              <button
                onClick={handleHideRaces}
                className="px-6 py-2 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                style={{ backgroundColor: "rgb(240, 28, 28)" }}
              >
                Hide races
              </button>
            )}
          </div>

          {/* Game Stats Summary */}
          <div className="mt-10 pt-10 border-t border/20">
            <h3 className="text-xl font-bold text-foreground mb-6">
              Stats by Game
            </h3>
            {(profile.statsByGame?.length ?? 0) === 0 ? (
              <div className="text-sm text-neutral-400">
                Stats by game will appear after you record sessions.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(profile.statsByGame ?? []).map((game) => (
                  <div
                    key={game.sim}
                    className="bg-secondary/20 rounded-2xl p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="font-bold text-foreground text-base">
                        {getSimDisplayName(game.sim)}
                      </h4>
                      <SimBadge sim={game.sim} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Races</span>
                        <span className="font-semibold text-foreground">
                          {game.races}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Wins</span>
                        <span className="font-semibold text-yellow-200">
                          {safeValue(game.wins)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Podiums</span>
                        <span className="font-semibold text-foreground">
                          {safeValue(game.podiums)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Pole Positions
                        </span>
                        <span className="font-semibold text-foreground">
                          {safeValue(game.poles)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Fastest Laps
                        </span>
                        <span className="font-semibold text-purple-500">
                          {game.fastestLaps}
                        </span>
                      </div>
                      <div className="border-t border pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Win %</span>
                          <span className="font-semibold text-foreground">
                            {game.winPct != null && Number.isFinite(game.winPct)
                              ? `${game.winPct}%`
                              : "—"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Podium %
                          </span>
                          <span className="font-semibold text-foreground">
                            {game.podiumPct != null &&
                            Number.isFinite(game.podiumPct)
                              ? `${game.podiumPct}%`
                              : "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
