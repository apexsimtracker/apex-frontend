import { Share2, Heart, MessageCircle } from "lucide-react";
import { cn, formatCompactCount } from "@/lib/utils";

export type SessionSocialSize = "md" | "sm";

const actionButtonClassName: Record<SessionSocialSize, string> = {
  md: "flex items-center gap-1.5 rounded-full px-2.5 py-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95",
  sm: "flex items-center gap-1 rounded-full px-2 py-1.5 text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container-high hover:text-apex-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95",
};

const iconClassName: Record<SessionSocialSize, string> = {
  md: "size-5",
  sm: "size-4",
};

const countClassName: Record<SessionSocialSize, string> = {
  md: "font-apex-body text-xs font-medium tabular-nums",
  sm: "font-apex-body text-[11px] font-medium tabular-nums",
};

const shareButtonClassName: Record<SessionSocialSize, string> = {
  md: "flex items-center justify-center rounded-full p-2 text-apex-on-surface transition-colors hover:bg-apex-surface-container-high focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95",
  sm: "flex items-center justify-center rounded-full p-1.5 text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container-high hover:text-apex-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary/50 active:scale-95",
};

export function SessionLikeButton({
  likeCount,
  likedByMe,
  likePending = false,
  onLike,
  size = "md",
}: {
  likeCount: number;
  likedByMe: boolean;
  likePending?: boolean;
  onLike: () => void;
  size?: SessionSocialSize;
}) {
  return (
    <button
      type="button"
      disabled={likePending}
      onClick={onLike}
      className={cn(
        actionButtonClassName[size],
        likedByMe && "text-apex-error",
        likePending && "cursor-not-allowed opacity-50",
      )}
      aria-label={likedByMe ? "Unlike session" : "Like session"}
    >
      <Heart
        className={cn(iconClassName[size], likedByMe && "fill-current")}
        aria-hidden
      />
      <span className={countClassName[size]}>
        {formatCompactCount(likeCount)}
      </span>
    </button>
  );
}

export function SessionCommentButton({
  commentCount,
  onComment,
  size = "md",
}: {
  commentCount: number;
  onComment: () => void;
  size?: SessionSocialSize;
}) {
  return (
    <button
      type="button"
      onClick={onComment}
      className={actionButtonClassName[size]}
      aria-label="Comments"
    >
      <MessageCircle className={iconClassName[size]} aria-hidden />
      <span className={countClassName[size]}>
        {formatCompactCount(commentCount)}
      </span>
    </button>
  );
}

export function SessionShareButton({
  onShare,
  size = "md",
}: {
  onShare: () => void;
  size?: SessionSocialSize;
}) {
  return (
    <button
      type="button"
      onClick={onShare}
      className={shareButtonClassName[size]}
      aria-label="Share session"
    >
      <Share2 className={iconClassName[size]} aria-hidden />
    </button>
  );
}

export type SessionSocialActionBarProps = {
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  likePending?: boolean;
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  className?: string;
  size?: SessionSocialSize;
};

/** Inline like / comment / share row for dashboard session cards. */
export default function SessionSocialActionBar({
  likeCount,
  commentCount,
  likedByMe,
  likePending = false,
  onLike,
  onComment,
  onShare,
  className,
  size = "md",
}: SessionSocialActionBarProps) {
  return (
    <div
      className={cn("flex items-center justify-between gap-2", className)}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center gap-0.5">
        <SessionLikeButton
          likeCount={likeCount}
          likedByMe={likedByMe}
          likePending={likePending}
          onLike={onLike}
          size={size}
        />
        <SessionCommentButton
          commentCount={commentCount}
          onComment={onComment}
          size={size}
        />
      </div>
      <SessionShareButton onShare={onShare} size={size} />
    </div>
  );
}
