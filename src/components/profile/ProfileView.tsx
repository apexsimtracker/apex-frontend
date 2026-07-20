import { Link, useNavigate } from "react-router-dom";

import { ArrowLeft } from "lucide-react";
import type {
  FollowRelationship,
  ProfileSummary,
  RaceHistoryPageResult,
} from "@/lib/api";
import { resolveApiUrl } from "@/lib/api";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileKeyStats } from "@/components/profile/ProfileKeyStats";
import { ProfileWeeklyActivity } from "@/components/profile/ProfileWeeklyActivity";
import { ProfileMainDisciplines } from "@/components/profile/ProfileMainDisciplines";
import { ProfileRaceHistory } from "@/components/profile/ProfileRaceHistory";
import { ProfileStatsByGame } from "@/components/profile/ProfileStatsByGame";
import { cn } from "@/lib/utils";

type ProfileViewProps = {
  profile: ProfileSummary;
  onBack?: () => void;
  avatarUrl?: string | null;
  bio?: string | null;
  followersCount?: number | null;
  followingCount?: number | null;
  isCurrentUser?: boolean;
  isFollowing?: boolean;
  profileLocked?: boolean;
  followRelationship?: FollowRelationship;
  targetPrivateProfile?: boolean;
  followLoading?: boolean;
  onToggleFollow?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onPrefetchFollowers?: () => void;
  onPrefetchFollowing?: () => void;
  onEditProfile?: () => void;
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
  raceHistoryForbiddenCode?: string;
  isPro?: boolean;
  profileUserId: string;
  challengeBadges?: {
    challengeId: string;
    challengeTitle: string;
    sim: string;
    place: number;
    tier: string;
    awardedAt: string;
  }[];
  challengeBadgeCount?: number;
  challengeBadgesLoading?: boolean;
  rootClassName?: string;
  containerClassName?: string;
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
  profileUserId,
  challengeBadges,
  challengeBadgeCount,
  challengeBadgesLoading,
  rootClassName,
  containerClassName,
}: ProfileViewProps) {
  const navigate = useNavigate();

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
      return "This driver's race history and sessions are only visible to them.";
    }
    if (raceHistoryForbiddenCode === "SESSION_VISIBILITY_FOLLOWERS_ONLY") {
      return "Race history is limited to followers. Follow this account (and get approved if required) to see sessions.";
    }
    if (isCurrentUser) {
      return "Your race history will appear here after your first race session.";
    }
    return "No race sessions yet.";
  })();

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
    <div className={cn("min-h-0 bg-transparent", rootClassName)}>
      <div className={cn("w-full space-y-6", containerClassName)}>
        {onBack && (
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 font-apex-body text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
        )}

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
          profileUserId={profileUserId}
          challengeBadges={challengeBadges}
          challengeBadgeCount={challengeBadgeCount}
          challengeBadgesLoading={challengeBadgesLoading}
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

        {!profileLocked &&
          profile.insight &&
          profile.insight.title &&
          profile.insight.body && (
            <Link
              to={`/sessions/${profile.insight.sessionId}`}
              className="block rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container-low p-4 transition-colors hover:bg-apex-surface-container"
            >
              <div className="font-apex-body text-xs uppercase tracking-wide text-apex-on-surface-variant">
                {profile.insight.title.toUpperCase()}
              </div>
              <div className="mt-1 font-apex-body text-sm text-apex-on-surface">
                {profile.insight.body}
              </div>
            </Link>
          )}

        {!profileLocked && (
          <>
            <ProfileWeeklyActivity
              weeklySnapshot={profile.weeklySnapshot}
              weeklyGoals={profile.weeklyGoals}
              totalRaces={profile.weekly?.totalRaces ?? 0}
              buckets={
                profile.weekly?.buckets ?? {
                  Mon: 0,
                  Tue: 0,
                  Wed: 0,
                  Thu: 0,
                  Fri: 0,
                  Sat: 0,
                  Sun: 0,
                }
              }
            />

            <ProfileMainDisciplines
              rows={
                (profile.mostPlayed ?? []) as Parameters<
                  typeof ProfileMainDisciplines
                >[0]["rows"]
              }
            />

            <ProfileRaceHistory
              raceHistory={
                raceHistory as Parameters<
                  typeof ProfileRaceHistory
                >[0]["raceHistory"]
              }
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

            <ProfileStatsByGame
              rows={
                (profile.statsByGame ?? []) as Parameters<
                  typeof ProfileStatsByGame
                >[0]["rows"]
              }
            />
          </>
        )}
      </div>
    </div>
  );
}
