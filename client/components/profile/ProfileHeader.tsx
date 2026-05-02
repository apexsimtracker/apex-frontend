import { Loader2, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSimEnum } from "@/lib/enumFormat";

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
  onEditProfile?: () => void;
  streakDays: number;
  challengeBadges?: ProfileHeaderBadge[];
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
  onEditProfile,
  streakDays,
  challengeBadges,
}: ProfileHeaderProps) {
  const showAvatarImg = Boolean(avatarSrc && String(avatarSrc).trim());

  const sortedBadges = (challengeBadges ?? [])
    .slice()
    .sort((a, b) => {
      const tb = awardedAtSortMs(b.awardedAt);
      const ta = awardedAtSortMs(a.awardedAt);
      if (tb !== ta) return tb - ta;
      return a.challengeId.localeCompare(b.challengeId);
    });

  return (
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
                    <span className="font-semibold text-foreground">{followersCount}</span>
                    <span className="text-muted-foreground/60">Followers</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenFollowing}
                    className="flex items-center gap-1 text-muted-foreground/70 transition-colors hover:text-foreground"
                  >
                    <span className="font-semibold text-foreground">{followingCount}</span>
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
                      <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden />
                      <span>{followStatusLabel}</span>
                      <span className="sr-only">Updating follow status, please wait</span>
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

            {streakDays > 0 && (
              <div className="mt-1 text-xs text-neutral-400">
                {streakDays === 1 ? "1 day driving streak" : `${streakDays} days driving streak`}
              </div>
            )}

            <p className="mb-2 mt-1 text-sm leading-relaxed text-muted-foreground/80 sm:mb-3">
              {bioText}
            </p>
          </div>
        </div>

        {sortedBadges.length > 0 && (
          <div className="text-center sm:min-w-max sm:text-right">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
              Podium badges
            </p>
            <TooltipProvider delayDuration={150}>
              <div className="flex flex-wrap items-center justify-center gap-1.5 sm:justify-end">
                {sortedBadges.map((badge) => {
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
                          className="cursor-default rounded-full px-1 text-xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 sm:text-2xl"
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
          </div>
        )}
      </div>
  );
}

