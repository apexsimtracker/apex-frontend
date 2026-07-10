import { Loader2, User } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatSimEnum } from "@/lib/enumFormat";

export type ProfileHeaderBadgeV2 = {
  challengeId: string;
  challengeTitle: string;
  sim: string;
  place: number;
  tier: string;
  awardedAt: string;
};

type ProfileHeaderV2Props = {
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
  challengeBadges?: ProfileHeaderBadgeV2[];
};

const PODIUM_EMOJI = ["🥇", "🥈", "🥉"] as const;

function awardedAtSortMs(iso: string): number {
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

export function ProfileHeaderV2({
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
  challengeBadges,
}: ProfileHeaderV2Props) {
  const showAvatarImg = Boolean(avatarSrc && String(avatarSrc).trim());

  const sortedBadges = (challengeBadges ?? []).slice().sort((a, b) => {
    const tb = awardedAtSortMs(b.awardedAt);
    const ta = awardedAtSortMs(a.awardedAt);
    if (tb !== ta) return tb - ta;
    return a.challengeId.localeCompare(b.challengeId);
  });

  const streakLabel =
    streakDays > 0
      ? streakDays === 1
        ? "1 day driving streak"
        : `${streakDays} days driving streak`
      : null;

  return (
    <section className="flex flex-col py-2">
      <div
        className={`flex gap-4 ${isCurrentUser ? "items-center" : "items-start"}`}
      >
        <div className="relative shrink-0">
          {isPro ? (
            <div className="size-20 rounded-lg border-2 border-v2-primary p-0.5">
              {showAvatarImg ? (
                <img
                  src={String(avatarSrc).trim()}
                  alt="Profile"
                  className="size-full rounded-md object-cover"
                />
              ) : (
                <div
                  className="flex size-full items-center justify-center rounded-md bg-v2-surface-container-highest text-v2-on-surface-variant"
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
              className="size-20 rounded-lg object-cover ring-1 ring-v2-outline-variant/30"
            />
          ) : (
            <div
              className="flex size-20 items-center justify-center rounded-lg bg-v2-surface-container-highest text-v2-on-surface-variant ring-1 ring-v2-outline-variant/30"
              aria-label="Profile picture placeholder"
            >
              <User className="size-8" />
            </div>
          )}
          {isPro && (
            <div className="absolute bottom-0 left-1/2 z-10 -translate-x-1/2 translate-y-1/2 rounded-full bg-v2-primary px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest text-white">
              PRO
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-v2-headline text-2xl font-bold tracking-tight text-v2-on-surface">
              {displayName}
            </h1>
            {isCurrentUser && onEditProfile && (
              <button
                type="button"
                onClick={onEditProfile}
                className="whitespace-nowrap rounded-full border border-v2-primary/40 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-v2-primary transition-colors hover:bg-v2-primary/10"
              >
                Edit Profile
              </button>
            )}
          </div>

          {streakLabel && (
            <p className="font-v2-body text-xs text-v2-on-surface-variant">
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
                  className="font-v2-body text-[10px] font-medium uppercase text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
                >
                  {followersCount.toLocaleString()} Followers
                </button>
                <button
                  type="button"
                  onClick={onOpenFollowing}
                  onMouseEnter={onPrefetchFollowing}
                  onFocus={onPrefetchFollowing}
                  className="font-v2-body text-[10px] font-medium uppercase text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
                >
                  {followingCount.toLocaleString()} Following
                </button>
              </div>
            )}

          <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            {bioText}
          </p>

          {!isCurrentUser && onToggleFollow && (
            <button
              type="button"
              onClick={onToggleFollow}
              disabled={followLoading}
              aria-busy={followLoading}
              className="mt-2 inline-flex min-w-[7.5rem] items-center justify-center gap-1.5 rounded-full border border-v2-outline-variant/30 bg-v2-surface-container-low px-3 py-1 text-xs font-medium text-v2-on-surface transition-colors hover:bg-v2-surface-container disabled:cursor-wait disabled:opacity-80"
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

      {sortedBadges.length > 0 && (
        <div className="mt-4">
          <p className="mb-1.5 font-v2-body text-xs font-semibold uppercase tracking-widest text-v2-on-surface-variant">
            Podium badges
          </p>
          <TooltipProvider delayDuration={150}>
            <div className="flex flex-wrap items-center gap-1.5">
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
                        className="cursor-default rounded-full px-1 text-xl leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-v2-primary/30"
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
    </section>
  );
}
