import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle, Loader2, User } from "lucide-react";
import type {
  FollowRelationship,
  ProfileSummary,
  RaceHistoryPageResult,
} from "../lib/api";
import { RaceHistoryPagination } from "./RaceHistoryPagination";
import {
  formatLapMs,
  formatCarName,
  formatAvgFinishOneDecimal,
  formatTrackName,
} from "../lib/utils";
import SimBadge from "./SimBadge";
import { SimLogo } from "./SimLogo";
import { getSimDisplayName } from "../lib/sim";
import { resolveApiUrl } from "@/lib/api";

type ProfileViewProps = {
  profile: ProfileSummary;
  onBack?: () => void;
  /** Profile picture URL; when empty or not set, a blank placeholder is shown (customizable via this prop). */
  avatarUrl?: string | null;
  /** Optional explicit bio for display; if absent, falls back to profile.user.bio/tagline. */
  bio?: string | null;
  followersCount?: number | null;
  followingCount?: number | null;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  /** When true, hide stats grids and race history (private profile, viewer not allowed). */
  profileLocked?: boolean;
  /** From GET /api/users/:id — drives Follow vs Request labels for other users. */
  followRelationship?: FollowRelationship;
  targetPrivateProfile?: boolean;
  followLoading?: boolean;
  onToggleFollow?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  /** When set and isCurrentUser, shows an Edit Profile button that calls this. */
  onEditProfile?: () => void;
  /** Paginated race history (GET /api/profile/.../race-history). When set, replaces profile.raceHistory for the table. */
  raceHistoryPagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
    items: RaceHistoryPageResult["items"];
    loading: boolean;
    onPageChange: (page: number) => void;
  };
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
  profileLocked = false,
  followRelationship = "none",
  targetPrivateProfile = false,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
  onEditProfile,
  raceHistoryPagination,
}: ProfileViewProps) {
  const navigate = useNavigate();
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const user = profile.user as {
    displayName?: string;
    name?: string;
    email?: string;
    bio?: string;
    tagline?: string;
  };
  const raw = (user.displayName ?? user.name)?.trim();
  const isPlaceholder = raw && /^Local\s+(Driver|user)$/i.test(raw);
  const displayName = (raw && !isPlaceholder) ? raw : (user.email?.trim() || "—");
  const safeValue = (v: number | null | undefined) =>
    v === null || v === undefined ? "—" : v;

  const avatarSrc = resolveApiUrl(avatarUrl);
  const showAvatarImg = Boolean(avatarSrc && String(avatarSrc).trim());

  const raceHistory = raceHistoryPagination?.items ?? profile.raceHistory ?? [];
  const raceHistoryTotal = raceHistoryPagination?.total ?? raceHistory.length;
  const raceHistoryPage = raceHistoryPagination?.page ?? 1;
  const raceHistoryPageSize = raceHistoryPagination?.limit ?? 6;
  const raceHistoryTotalPages = raceHistoryPagination?.totalPages ?? 1;
  const raceHistoryLoading = raceHistoryPagination?.loading ?? false;
  const raceHistoryRange =
    raceHistoryTotal === 0
      ? null
      : {
          start: (raceHistoryPage - 1) * raceHistoryPageSize + 1,
          end: Math.min(raceHistoryPage * raceHistoryPageSize, raceHistoryTotal),
        };

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

  const followActionLabel = (() => {
    if (isCurrentUser || !onToggleFollow) return "Follow";
    if (isFollowing) return "Unfollow";
    if (followRelationship === "pending") return "Cancel request";
    if (targetPrivateProfile) return "Request to follow";
    return "Follow";
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pb-16 sm:pt-4 lg:px-8">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground sm:mb-8"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
        )}

        {/* Profile Header - HERO */}
        <div className="border-white/6 mb-8 rounded-lg border bg-card/20 p-5 backdrop-blur-lg sm:mb-10 sm:p-8">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:mb-7 sm:flex-row sm:items-start sm:gap-6">
            <div className="flex flex-1 flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
              {showAvatarImg ? (
                <img
                  src={String(avatarSrc).trim()}
                  alt="Profile"
                  className="size-16 shrink-0 rounded-full object-cover ring-1 ring-white/5 sm:size-20"
                />
              ) : (
                <div
                  className="flex size-16 shrink-0 items-center justify-center rounded-full border border-white/10 bg-muted text-muted-foreground sm:size-20"
                  aria-label="Profile picture placeholder"
                >
                  <User className="size-8 sm:size-10" />
                </div>
              )}
              <div className="flex-1 text-center sm:text-left">
                <h1 className="mb-0.5 text-xl font-bold text-foreground sm:mb-1 sm:text-2xl">
                  {displayName}
                </h1>
                <div className="mb-1 flex flex-wrap items-center justify-center gap-4 text-xs sm:justify-start">
                  {typeof followersCount === "number" && typeof followingCount === "number" && (
                    <>
                      <button
                        type="button"
                        onClick={onOpenFollowers}
                        className="flex items-center gap-1 text-muted-foreground/70 transition-colors hover:text-foreground"
                      >
                        <span className="font-semibold text-foreground">
                          {followersCount}
                        </span>
                        <span className="text-muted-foreground/60">Followers</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenFollowing}
                        className="flex items-center gap-1 text-muted-foreground/70 transition-colors hover:text-foreground"
                      >
                        <span className="font-semibold text-foreground">
                          {followingCount}
                        </span>
                        <span className="text-muted-foreground/60">Following</span>
                      </button>
                    </>
                  )}
                  {!isCurrentUser && onToggleFollow && (
                    <button
                      type="button"
                      onClick={onToggleFollow}
                      disabled={followLoading}
                      aria-busy={followLoading}
                      className="inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-80"
                    >
                      {followLoading ? (
                        <>
                          <Loader2
                            className="size-3.5 shrink-0 animate-spin"
                            aria-hidden
                          />
                          <span>
                            {isFollowing
                              ? "Unfollowing…"
                              : followRelationship === "pending"
                                ? "Canceling…"
                                : targetPrivateProfile
                                  ? "Sending…"
                                  : "Following…"}
                          </span>
                          <span className="sr-only">
                            Updating follow status, please wait
                          </span>
                        </>
                      ) : (
                        followActionLabel
                      )}
                    </button>
                  )}
                  {isCurrentUser && onEditProfile && (
                    <button
                      type="button"
                      onClick={onEditProfile}
                      className="font-medium text-muted-foreground/70 underline underline-offset-2 transition-colors hover:text-foreground"
                    >
                      Edit Profile
                    </button>
                  )}
                </div>
                {profile.user.streakDays > 0 && (
                  <div className="mt-1 text-xs text-neutral-400">
                    {profile.user.streakDays === 1
                      ? "1 day driving streak"
                      : `${profile.user.streakDays} days driving streak`}
                  </div>
                )}
                <p className="mb-2 mt-1 text-sm leading-relaxed text-muted-foreground/80 sm:mb-3">
                  {bio?.trim() ||
                    user.bio?.trim() ||
                    user.tagline?.trim() ||
                    "No bio yet."}
                </p>
              </div>
            </div>
            <div className="space-y-3 text-center sm:min-w-max sm:text-right">
              <p className="mb-1 text-xs font-semibold text-foreground">
                {profile.user.level != null
                  ? `Level ${profile.user.level}`
                  : "—"}
              </p>
              <p className="mb-1.5 text-xs text-muted-foreground/60">
                {profile.user.levelProgressPct != null
                  ? `${profile.user.levelProgressPct}% to next`
                  : "—"}
              </p>
              <div className="mx-auto h-0.5 w-24 overflow-hidden rounded-full bg-secondary/30 sm:mx-0 sm:w-32">
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
          {profileLocked ? (
            <div className="rounded-lg border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-center text-sm text-muted-foreground">
              Stats are hidden because this profile is private. Follow this account to see sessions and
              results when your request is approved.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 sm:gap-5">
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  Races
                </p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {profile.totals?.races ?? 0}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  Wins
                </p>
                <p className="text-sm font-semibold text-yellow-200 sm:text-base">
                  {safeValue(profile.totals?.wins)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  Podiums
                </p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {safeValue(profile.totals?.podiums)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  Poles
                </p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {safeValue(profile.totals?.poles)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  FL
                </p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {profile.totals?.fastestLaps ?? 0}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="mb-1 text-xs uppercase text-muted-foreground/50">
                  Avg
                </p>
                <p className="text-sm font-semibold text-foreground sm:text-base">
                  {formatAvgFinishOneDecimal(profile.totals?.avgFinish)}
                </p>
              </div>
            </div>
          )}
        </div>

        {!profileLocked &&
          profile.insight &&
          profile.insight.title &&
          profile.insight.body && (
            <Link
              to={`/sessions/${profile.insight.sessionId}`}
              className="mt-6 block rounded-2xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
            >
              <div className="text-xs tracking-wide text-neutral-400">
                {profile.insight.title.toUpperCase()}
              </div>
              <div className="mt-1 text-sm text-neutral-200">
                {profile.insight.body}
              </div>
            </Link>
          )}

        {!profileLocked && (
          <>
        {/* Placeholder Content */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg md:col-span-2">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
              Weekly Stats
            </h2>

            {/* Weekly Chart */}
            <div className="mb-8">
              {weeklyTotal === 0 ? (
                <div className="flex h-[220px] flex-col items-center justify-center text-center text-neutral-400">
                  <div className="text-sm">No sessions this week yet.</div>
                  <div className="mt-1 text-xs text-neutral-500">
                    Run a session to start building your weekly pattern.
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex h-[160px] items-end justify-between gap-2">
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
                        className="flex flex-1 flex-col items-center gap-2"
                      >
                        <div className="relative flex h-[160px] w-full items-end justify-center">
                          <div
                            className="group relative w-full cursor-pointer rounded-lg transition-all duration-300"
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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Total Races
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {profile.weekly?.totalRaces ?? 0}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Wins
                </p>
                <p className="text-2xl font-bold text-yellow-200">
                  {safeValue(profile.weekly?.wins)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Avg Finish
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formatAvgFinishOneDecimal(profile.weekly?.avgFinish)}
                </p>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  Total KM
                </p>
                <p className="text-2xl font-bold text-black dark:text-white">
                  {safeValue(profile.weekly?.totalKm)}
                </p>
              </div>
            </div>
          </div>

          <div className="border-white/6 rounded-lg border bg-card/20 p-6 backdrop-blur-lg">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-foreground">
              Most Played
            </h2>
            {(profile.mostPlayed?.length ?? 0) === 0 ? (
              <div className="flex h-[220px] flex-col items-center justify-center text-center text-neutral-400">
                <div className="text-sm">No sessions recorded yet.</div>
                <div className="mt-1 text-xs text-neutral-500">
                  Your most-played sims will appear here.
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {(profile.mostPlayed ?? []).map((sim) => (
                  <div key={sim.sim}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="mb-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <p className="font-semibold text-foreground">
                            {getSimDisplayName(sim.sim)}
                          </p>
                          <SimBadge sim={sim.sim} />
                        </div>

                      </div>
                      <div className="flex size-10 flex-1 items-center justify-end">
                        <SimLogo sim={sim.sim} />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      {sim.km != null ? `${sim.km} km` : "—"}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary/40">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, sim.pctOfTotal)}%`,
                          backgroundColor: "rgb(240, 28, 28)",
                        }}
                      ></div>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
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
        <div className="mt-12 rounded-lg border border-white/10 bg-card/40 p-8 backdrop-blur-xl dark:border-white/10">
          <h2 className="mb-8 text-2xl font-bold text-foreground">
            Race History
          </h2>

          {/* Desktop Table View */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full">
              <thead>
                <tr className="border">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    SIM
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Car
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Track
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Position
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Quali Pos
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Best Lap
                  </th>
                </tr>
              </thead>
              <tbody>
                {raceHistoryLoading && raceHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-muted-foreground"
                    >
                      Loading race history…
                    </td>
                  </tr>
                ) : raceHistory.length === 0 ? (
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
                  raceHistory.map((race) => (
                    <tr
                      key={race.id}
                      onClick={() => navigate(`/sessions/${race.id}`)}
                      className="cursor-pointer border transition-colors hover:bg-secondary"
                    >
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {new Date(race.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <SimBadge sim={race.sim} size="md" />
                          {race.source === "MANUAL_ACTIVITY" && (
                            <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                              Manual
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatCarName(race.car)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {formatTrackName(race.track)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${race.position === 1
                            ? "bg-yellow-50 text-gold dark:bg-yellow-950/20"
                            : race.position === 2
                              ? "bg-gray-100 text-silver dark:bg-gray-800/40"
                              : race.position === 3
                                ? "bg-orange-50 text-bronze dark:bg-orange-950/20"
                                : "bg-secondary text-foreground"
                            }`}
                        >
                          {race.position ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-sm font-bold text-foreground">
                          {race.source === "MANUAL_ACTIVITY"
                            ? "—"
                            : (race.qualiPos ?? "—")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        {formatLapMs(race.bestLapMs)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {raceHistoryLoading && raceHistory.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading race history…
              </div>
            ) : raceHistory.length === 0 ? (
              <div className="py-10 text-center text-sm text-neutral-400">
                Your race history will appear here after your first race
                session.
              </div>
            ) : (
              raceHistory.map((race) => (
                <div
                  key={race.id}
                  onClick={() => navigate(`/sessions/${race.id}`)}
                  className="border/40 cursor-pointer rounded-lg border p-4 transition-colors hover:bg-secondary/20"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <SimBadge sim={race.sim} size="md" />
                        {race.source === "MANUAL_ACTIVITY" && (
                          <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                            Manual
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(race.date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${race.position === 1
                        ? "bg-yellow-50 text-gold dark:bg-yellow-950/20"
                        : race.position === 2
                          ? "bg-gray-100 text-silver dark:bg-gray-800/40"
                          : race.position === 3
                            ? "bg-orange-50 text-bronze dark:bg-orange-950/20"
                            : "bg-secondary text-foreground"
                        }`}
                    >
                      P{race.position ?? "—"}
                    </span>
                  </div>
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-foreground">
                      {formatTrackName(race.track)}
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
                        {race.source === "MANUAL_ACTIVITY" ? (
                          "—"
                        ) : (
                          <CheckCircle className="inline-block size-5 text-green-600 dark:text-green-500" aria-label="Completed" />
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {raceHistoryPagination && raceHistoryTotal > 0 && (
            <div className="mt-6 space-y-3">
              {raceHistoryRange && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing {raceHistoryRange.start}–{raceHistoryRange.end} of{" "}
                  {raceHistoryTotal}
                </p>
              )}
              <RaceHistoryPagination
                page={raceHistoryPage}
                totalPages={raceHistoryTotalPages}
                onPageChange={raceHistoryPagination.onPageChange}
                disabled={raceHistoryLoading}
              />
            </div>
          )}

          {/* Game Stats Summary */}
          <div className="border/20 mt-10 border-t pt-10">
            <h3 className="mb-6 text-xl font-bold text-foreground">
              Stats by Game
            </h3>
            {(profile.statsByGame?.length ?? 0) === 0 ? (
              <div className="text-sm text-neutral-400">
                Stats by game will appear after you record sessions.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {(profile.statsByGame ?? []).map((game) => (
                  <div
                    key={game.sim}
                    className="rounded-2xl bg-secondary/20 p-5"
                  >
                    <div className="mb-3 flex items-center gap-2">
                      <h4 className="text-base font-bold text-foreground">
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
                      <div className="mt-2 border pt-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Win %</span>
                          <span className="font-semibold text-foreground">
                            {game.winPct != null && Number.isFinite(game.winPct)
                              ? `${game.winPct.toFixed(1)}%`
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
                              ? `${game.podiumPct.toFixed(1)}%`
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
          </>
        )}
      </div>
    </div>
  );
}
