import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, Heart, MessageCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
  formatCompactCount,
  cn,
} from "@/lib/utils";
import { resolveDiscussionAvatarSrc, getDiscussionAuthorId } from "@/lib/api";
import DiscussionCategoryBadge from "@/pages/discussion/DiscussionCategoryBadge";

interface DiscussionCardProps {
  id: string;
  title: string;
  excerpt: string;
  author:
    | { id: string; displayName?: string | null; avatarUrl?: string | null }
    | unknown;
  /** Backend category: setup | guides | general */
  categoryKey: string;
  likes: number;
  replies: number;
  views: number;
  isPinned?: boolean;
  wasEdited?: boolean;
  className?: string;
}

export default function DiscussionCard({
  id,
  title,
  excerpt,
  author,
  categoryKey,
  likes,
  replies,
  views,
  isPinned,
  wasEdited,
  className,
}: DiscussionCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const authorDisplay = getDiscussionAuthorDisplay(author);
  const authorId = getDiscussionAuthorId(author);
  const avatarSrc = resolveDiscussionAvatarSrc(author, user);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSrc, user?.id, user?.avatarUrl]);

  const showAvatar = Boolean(avatarSrc?.trim()) && !avatarLoadFailed;
  const initials = getDiscussionAuthorInitials(authorDisplay);

  return (
    <Link to={`/discussion/${id}`} className="block">
      <article
        className={cn(
          "cursor-pointer rounded-xl border-l-2 border-l-apex-primary/50 bg-apex-surface-container-low p-4 transition-colors hover:bg-apex-surface-container",
          className,
        )}
      >
        <div className="mb-2 flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (authorId)
                navigate(`/user/${encodeURIComponent(authorId)}`);
            }}
            className="group flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity hover:opacity-80"
          >
            {showAvatar ? (
              <img
                src={avatarSrc!}
                alt={authorDisplay}
                className="size-6 shrink-0 rounded-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <div
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-apex-surface-container-high font-apex-body text-[10px] font-medium text-apex-on-surface-variant"
                aria-label={`Avatar for ${authorDisplay}`}
              >
                {initials}
              </div>
            )}
            <p className="truncate font-apex-body text-xs font-bold text-apex-on-surface">
              {authorDisplay}
            </p>
          </button>
          <DiscussionCategoryBadge
            isPinned={isPinned}
            categoryKey={categoryKey}
            className="ml-auto"
          />
        </div>

        <h3 className="mb-1 line-clamp-2 font-apex-headline text-base font-bold text-apex-on-surface">
          {title}
        </h3>

        <p className="mb-3 line-clamp-2 font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
          {excerpt}
        </p>

        <div className="flex items-center gap-3 font-apex-body text-[11px] text-apex-on-surface-variant">
          <span className="flex items-center gap-1">
            <Heart className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums" title={String(likes ?? 0)}>
              {formatCompactCount(likes ?? 0)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums" title={String(replies ?? 0)}>
              {formatCompactCount(replies ?? 0)}
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Eye className="size-3.5 shrink-0" aria-hidden />
            <span className="tabular-nums" title={String(views ?? 0)}>
              {formatCompactCount(views ?? 0)}
            </span>
          </span>
          {wasEdited ? (
            <span className="ml-auto font-apex-body text-[10px] uppercase tracking-wide text-apex-on-surface-variant/70">
              Edited
            </span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
