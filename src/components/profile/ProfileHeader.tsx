import { useState } from "react";
import { Loader2, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSimEnum } from "@/lib/enumFormat";
import ProfileChallengeBadgesModal from "@/components/profile/ProfileChallengeBadgesModal";
import { ProfileChallengeBadgesSkeleton } from "@/components/profile/ProfileChallengeBadgesSkeleton";

export type ProfileHeaderBadge = {
  challengeId: string;
  challengeTitle: string;
  sim: string;
  place: number;
  tier: string;
  awardedAt: string;
};

type ProfileHeaderProps = {
  displayName: string;
  avatarSrc: string | null;
  bioText: string;
  followersCount?: number | null;
  followingCount?: number | null;
  isCurrentUser?: boolean;
  followLoading?: boolean;
  followActionLabel: string;
  followStatusLabel: string;
  onToggleFollow?: () => void;
  onOpenFollowers?: () => void;
  onOpenFollowing?: () => void;
  onPrefetchFollowers?: () => void;
  onPrefetchFollowing?: () => void;
  onEditProfile?: () => void;
  streakDays: number;
  isPro?: boolean;
  profileUserId: string;
  challengeBadges?: ProfileHeaderBadge[];
  challengeBadgeCount?: number;
  challengeBadgesLoading?: boolean;
};

const PODIUM_EMOJI = ["🥇", "🥈", "🥉"] as const;

function awardedAtSortMs(iso: string): number {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function ProfileHeader({
  displayName,
  avatarSrc,
  bioText,
  followersCount,
  followingCount,
  isCurrentUser,
  followLoading,
  followActionLabel,
  followStatusLabel,
  onToggleFollow,
  onOpenFollowers,
  onOpenFollowing,
  onPrefetchFollowers,
  onPrefetchFollowing,
  onEditProfile,
  streakDays,
  isPro = false,
  profileUserId,
  challengeBadges,
  challengeBadgeCount,
  challengeBadgesLoading = false,
}: ProfileHeaderProps) {
  const [badgesModalOpen, setBadgesModalOpen] = useState(false);
  const showAvatarImg = Boolean(avatarSrc && String(avatarSrc).trim());

  const sortedBadges = (challengeBadges ?? []).slice().sort((a, b) => {
    const tb = awardedAtSortMs(b.awardedAt);
    const ta = awardedAtSortMs(a.awardedAt);
    if (tb !== ta) return tb - ta;
    return a.challengeId.localeCompare(b.challengeId);
  });

  const badgeTotal = challengeBadgeCount ?? sortedBadges.length;

  const streakLabel =
    streakDays > 0
      ? streakDays === 1
        ? "1 day driving streak"
        : `${streakDays} days driving streak`
      : null;

  return (
    <section className="flex flex-col py-2">
      {/* Always top-align on mobile: a long name/bio would otherwise push the
          avatar to the vertical middle of a tall text block. */}
      <div
        className={`flex items-start gap-4 ${isCurrentUser ? "sm:items-center" : ""}`}
      >
        <div className="relative shrink-0">
          {isPro ? (
            <div className="size-20 rounded-lg border-2 border-apex-primary p-0.5">
              {showAvatarImg ? (
                <img
                  src={String(avatarSrc).trim()}
                  alt="Profile"
                  className="size-full rounded-md object-cover"
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center rounded-md bg-apex-surface-container-highest text-apex-on-surface-variant"
                  aria-label="Profile picture placeholder"
                >
                  <User className="size-8" />
                </div>
              )}
            </div>
          ) : showAvatarImg ? (
            <img
              src={String(avatarSrc).trim()}
              alt="Profile"
              className="size-20 rounded-lg object-cover ring-1 ring-apex-outline-variant/30"
            />
          ) : (
            <div
              className="flex size-20 items-center justify-center rounded-lg bg-apex-surface-container-highest text-apex-on-surface-variant ring-1 ring-apex-outline-variant/30"
              aria-label="Profile picture placeholder"
            >
              <User className="size-8" />
            </div>
          )}
          {isPro && (
            <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-apex-primary px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-white">
              PRO
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-apex-headline text-2xl font-bold tracking-tight text-apex-on-surface">
              {displayName}
            </h1>
            {isCurrentUser && onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="whitespace-nowrap rounded-full border border-apex-primary/40 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-apex-primary transition-colors hover:bg-apex-primary/10"
              >
                Edit Profile
              </button>
            )}
          </div>

          {streakLabel && (
            <p className="font-apex-body text-xs text-apex-on-surface-variant">
              {streakLabel}
            </p>
          )}

          {typeof followersCount === "number" &&
            typeof followingCount === "number" && (
              <div className="mt-1 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={onOpenFollowers}
                  onMouseEnter={onPrefetchFollowers}
                  onFocus={onPrefetchFollowers}
                  className="font-apex-body text-[10px] font-medium uppercase text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
                >
                  {followersCount.toLocaleString()} Followers
                </button>
                <button
                  type="button"
                  onClick={onOpenFollowing}
                  onMouseEnter={onPrefetchFollowing}
                  onFocus={onPrefetchFollowing}
                  className="font-apex-body text-[10px] font-medium uppercase text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
                >
                  {followingCount.toLocaleString()} Following
                </button>
              </div>
            )}

          <p className="mt-2 font-apex-body text-sm leading-relaxed text-apex-on-surface-variant">
            {bioText}
          </p>

          {!isCurrentUser && onToggleFollow && (
            <button
              type="button"
              onClick={onToggleFollow}
              disabled={followLoading}
              aria-busy={followLoading}
              className="mt-2 inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full border border-apex-outline-variant/30 bg-apex-surface-container-low px-3 py-1 text-xs font-medium text-apex-on-surface transition-colors hover:bg-apex-surface-container disabled:cursor-wait disabled:opacity-80"
            >
              {followLoading ? (
                <>
                  <Loader2
                    className="size-3.5 shrink-0 animate-spin"
                    aria-hidden
                  />
                  <span>{followStatusLabel}</span>
                  <span className="sr-only">
                    Updating follow status, please wait
                  </span>
                </>
              ) : (
                followActionLabel
              )}
            </button>
          )}
        </div>
      </div>

      {challengeBadgesLoading ? (
        <ProfileChallengeBadgesSkeleton />
      ) : badgeTotal > 0 ? (
        <div className="mt-4">
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <p className="font-apex-body text-xs font-semibold uppercase tracking-widest text-apex-on-surface-variant">
              Podium badges
            </p>
            <button
              type="button"
              onClick={() => setBadgesModalOpen(true)}
              className="font-apex-body text-xs font-medium text-apex-primary transition-colors hover:text-apex-primary/80"
            >
              {badgeTotal > 3
                ? `View all (${badgeTotal})`
                : "View history"}
            </button>
          </div>
          <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap items-center gap-1.5">
              {sortedBadges.slice(0, 6).map((badge) => {
                const emoji =
                  badge.place >= 1 && badge.place <= 3
                    ? PODIUM_EMOJI[badge.place - 1]
                    : "🏅";
                const ariaLabel = `P${badge.place} — ${badge.tier} — ${badge.challengeTitle}`;
                const awarded = new Date(badge.awardedAt);
                const awardedLabel = Number.isNaN(awarded.getTime())
                  ? badge.awardedAt
                  : awarded.toLocaleDateString();
                return (
                  <Tooltip key={`${badge.challengeId}-${badge.awardedAt}`}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label={ariaLabel}
                        className="cursor-default rounded-full px-1 text-xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/30"
                      >
                        <span aria-hidden>{emoji}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm font-semibold text-foreground">
                        P{badge.place} · {badge.tier}
                      </p>
                      <p className="text-sm text-foreground/90">
                        {badge.challengeTitle}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatSimEnum(badge.sim)} · {awardedLabel}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
          <ProfileChallengeBadgesModal
            open={badgesModalOpen}
            onOpenChange={setBadgesModalOpen}
            userId={profileUserId}
            totalCount={badgeTotal}
          />
        </div>
      ) : null}
    </section>
  );
}
