import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type {
  FollowRelationship,
  ProfileSummary,
  RaceHistoryPageResult,
} from "../lib/api";
import { resolveApiUrl } from "@/lib/api";
import { ProfileHeroCard } from "@/components/profile/ProfileHeroCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileKeyStats } from "@/components/profile/ProfileKeyStats";
import { ProfileWeeklyStats } from "@/components/profile/ProfileWeeklyStats";
import { ProfileMostPlayed } from "@/components/profile/ProfileMostPlayed";
import { ProfileRaceHistory } from "@/components/profile/ProfileRaceHistory";
import { ProfileStatsByGame } from "@/components/profile/ProfileStatsByGame";

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
  onPrefetchFollowers?: () => void;
  onPrefetchFollowing?: () => void;
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
    fetching?: boolean;
    onPageChange: (page: number) => void;
  };
  /** Set when GET .../race-history returned 403 for this viewer. */
  raceHistoryForbiddenCode?: string;
  /** From GET /api/users/:id — challenge podium badges. */
  isPro?: boolean;
  challengeBadges?: {
    challengeId: string;
    challengeTitle: string;
    sim: string;
    place: number;
    tier: string;
    awardedAt: string;
  }[];
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
  onPrefetchFollowers,
  onPrefetchFollowing,
  onEditProfile,
  raceHistoryPagination,
  raceHistoryForbiddenCode,
  isPro = false,
  challengeBadges,
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
  const displayName = raw && !isPlaceholder ? raw : user.email?.trim() || "—";
  const avatarSrc = resolveApiUrl(avatarUrl);
  const bioText =
    bio?.trim() || user.bio?.trim() || user.tagline?.trim() || "No bio yet.";

  const raceHistory = raceHistoryPagination?.items ?? profile.raceHistory ?? [];
  const raceHistoryTotal = raceHistoryPagination?.total ?? raceHistory.length;
  const raceHistoryPage = raceHistoryPagination?.page ?? 1;
  const raceHistoryPageSize = raceHistoryPagination?.limit ?? 6;
  const raceHistoryTotalPages = raceHistoryPagination?.totalPages ?? 1;
  const raceHistoryLoading = raceHistoryPagination?.loading ?? false;
  const raceHistoryFetching = raceHistoryPagination?.fetching ?? false;
  const raceHistoryRange =
    raceHistoryTotal === 0
      ? null
      : {
          start: (raceHistoryPage - 1) * raceHistoryPageSize + 1,
          end: Math.min(
            raceHistoryPage * raceHistoryPageSize,
            raceHistoryTotal,
          ),
        };

  const raceHistoryEmptyMessage = (() => {
    if (raceHistoryForbiddenCode === "PROFILE_PRIVATE") {
      return "This profile is private.";
    }
    if (raceHistoryForbiddenCode === "SESSION_VISIBILITY_PRIVATE") {
      return "This driver’s race history and sessions are only visible to them.";
    }
    if (raceHistoryForbiddenCode === "SESSION_VISIBILITY_FOLLOWERS_ONLY") {
      return "Race history is limited to followers. Follow this account (and get approved if required) to see sessions.";
    }
    if (isCurrentUser) {
      return "Your race history will appear here after your first race session.";
    }
    return "No race sessions yet.";
  })();

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

  const followStatusLabel = (() => {
    if (isFollowing) return "Unfollowing…";
    if (followRelationship === "pending") return "Canceling…";
    if (targetPrivateProfile) return "Sending…";
    return "Following…";
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

        <ProfileHeroCard>
          <ProfileHeader
            displayName={displayName}
            avatarSrc={avatarSrc}
            bioText={bioText}
            followersCount={followersCount}
            followingCount={followingCount}
            isCurrentUser={isCurrentUser}
            followLoading={followLoading}
            followActionLabel={followActionLabel}
            followStatusLabel={followStatusLabel}
            onToggleFollow={onToggleFollow}
            onOpenFollowers={onOpenFollowers}
            onOpenFollowing={onOpenFollowing}
            onPrefetchFollowers={onPrefetchFollowers}
            onPrefetchFollowing={onPrefetchFollowing}
            onEditProfile={onEditProfile}
            streakDays={profile.user.streakDays ?? 0}
            isPro={isPro}
            challengeBadges={challengeBadges}
          />
          <ProfileKeyStats
            profileLocked={profileLocked}
            races={profile.totals?.races ?? 0}
            wins={profile.totals?.wins}
            podiums={profile.totals?.podiums}
            poles={profile.totals?.poles}
            fastestLaps={profile.totals?.fastestLaps ?? 0}
            avgFinish={profile.totals?.avgFinish}
          />
        </ProfileHeroCard>

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
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <ProfileWeeklyStats
                weeklyTotal={weeklyTotal}
                weeklyValues={weeklyValues}
                maxWeekly={maxWeekly}
                hoveredDay={hoveredDay}
                setHoveredDay={setHoveredDay}
                buckets={weekly}
                totalRaces={profile.weekly?.totalRaces ?? 0}
                wins={profile.weekly?.wins}
                avgFinish={profile.weekly?.avgFinish}
                totalKm={profile.weekly?.totalKm}
              />

              <ProfileMostPlayed rows={(profile.mostPlayed ?? []) as any} />
            </div>

            <div className="mt-12 rounded-lg border border-white/10 bg-card/40 p-8 backdrop-blur-xl dark:border-white/10">
              <ProfileRaceHistory
                raceHistory={raceHistory as any}
                raceHistoryLoading={raceHistoryLoading}
                emptyMessage={raceHistoryEmptyMessage}
                onOpenSession={(sid) => navigate(`/sessions/${sid}`)}
                range={raceHistoryRange}
                pagination={
                  raceHistoryPagination
                    ? {
                        page: raceHistoryPage,
                        totalPages: raceHistoryTotalPages,
                        disabled: raceHistoryFetching,
                        onPageChange: raceHistoryPagination.onPageChange,
                        total: raceHistoryTotal,
                      }
                    : undefined
                }
              />

              <ProfileStatsByGame rows={(profile.statsByGame ?? []) as any} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
