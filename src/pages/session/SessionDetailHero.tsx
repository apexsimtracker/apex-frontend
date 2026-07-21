import { useState } from "react";
import { Share2, Pencil, Trash2, Repeat, Heart, MessageCircle } from "lucide-react";
import { formatTrackName } from "@/lib/tracks";
import { getDisciplineLogoSrc } from "@/components/profile/profileDisciplineAssets";
import { cn, formatCompactCount } from "@/lib/utils";

type SessionDetailHeroProps = {
  trackName: string | null;
  trackImageUrl?: string | null;
  sim?: string | null;
  canEditSession: boolean;
  canManualExtras: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likePending?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onLogAgain: () => void;
};

export default function SessionDetailHero({
  trackName,
  trackImageUrl,
  sim,
  canEditSession,
  canManualExtras,
  likeCount,
  commentCount,
  likedByMe,
  likePending = false,
  onLike,
  onComment,
  onShare,
  onEdit,
  onDelete,
  onLogAgain,
}: SessionDetailHeroProps) {
  const title = formatTrackName(trackName) || "Unknown track";
  const [imageFailed, setImageFailed] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const showImage = Boolean(trackImageUrl?.trim()) && !imageFailed;
  const simLogoSrc = sim ? getDisciplineLogoSrc(sim) : null;
  const showLogo = !showImage && Boolean(simLogoSrc) && !logoFailed;

  return (
    <header className="relative min-h-[220px] w-full overflow-hidden rounded-xl bg-apex-surface-container-low sm:min-h-[256px]">
      {showImage ? (
        <img
          alt=""
          className="absolute inset-0 size-full object-cover opacity-90"
          src={trackImageUrl!}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-apex-surface-container via-apex-surface-container-low to-apex-background"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--apex-primary)/0.10),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(var(--apex-primary)/0.05),transparent_50%)]" />
        </div>
      )}
      {showLogo && (
        <div
          className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center"
          aria-hidden
        >
          <img
            alt=""
            src={simLogoSrc!}
            onError={() => setLogoFailed(true)}
            className="h-16 w-auto max-w-[60%] object-contain opacity-90 drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:h-20"
          />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-apex-background via-apex-background/50 to-transparent" />

      <div className="relative z-10 flex items-center justify-between gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={likePending}
            onClick={onLike}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95",
              likedByMe && "text-apex-error",
              likePending && "cursor-not-allowed opacity-50",
            )}
            aria-label={likedByMe ? "Unlike session" : "Like session"}
          >
            <Heart
              className={cn("size-5", likedByMe && "fill-current")}
              aria-hidden
            />
            <span className="font-apex-body text-xs font-medium tabular-nums">
              {formatCompactCount(likeCount)}
            </span>
          </button>
          <button
            type="button"
            onClick={onComment}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95"
            aria-label="Comments"
          >
            <MessageCircle className="size-5" aria-hidden />
            <span className="font-apex-body text-xs font-medium tabular-nums">
              {formatCompactCount(commentCount)}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {canManualExtras && (
            <>
              <button
                type="button"
                onClick={onLogAgain}
                className="flex items-center justify-center rounded-full p-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95"
                aria-label="Log again"
              >
                <Repeat className="size-5" aria-hidden />
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center justify-center rounded-full p-2 text-apex-error transition-colors hover:bg-apex-error/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95"
                aria-label="Delete session"
              >
                <Trash2 className="size-5" aria-hidden />
              </button>
            </>
          )}
          {canEditSession && (
            <button
              type="button"
              onClick={onEdit}
              className="flex items-center justify-center rounded-full p-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95"
              aria-label="Edit session"
            >
              <Pencil className="size-5" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={onShare}
            className="flex items-center justify-center rounded-full p-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95"
            aria-label="Share session"
          >
            <Share2 className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-4 z-10 sm:left-6">
        <h1 className="font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface sm:text-4xl">
          {title}
        </h1>
      </div>
    </header>
  );
}
