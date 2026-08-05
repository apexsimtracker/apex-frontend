import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, MessageCircle } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
  formatCompactCount,
  cn,
} from "@/lib/utils";
import {
  resolveDiscussionAvatarSrc,
  getDiscussionAuthorId,
} from "@/lib/api/config";
import type { Discussion } from "@/lib/api/community";
import { warmDiscussionDetailNavigation } from "@/lib/community/discussionDetailPrefetch";
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
  imageUrl?: string | null;
  createdAt?: string;
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
  imageUrl,
  createdAt,
  className,
}: DiscussionCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userKey = user?.id?.trim() || "anon";
  const authorDisplay = getDiscussionAuthorDisplay(author);
  const authorId = getDiscussionAuthorId(author);
  const avatarSrc = resolveDiscussionAvatarSrc(author, user);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [avatarSrc, user?.id, user?.avatarUrl]);

  const showAvatar = Boolean(avatarSrc?.trim()) && !avatarLoadFailed;
  const initials = getDiscussionAuthorInitials(authorDisplay);

  const warmDetail = () => {
    warmDiscussionDetailNavigation(
      queryClient,
      {
        id,
        title,
        excerpt,
        author: (author ?? {
          id: "",
          displayName: null,
          avatarUrl: null,
        }) as Discussion["author"],
        category: categoryKey,
        likeCount: likes,
        commentsCount: replies,
        views,
        isPinned,
        wasEdited,
        imageUrl,
        createdAt,
      },
      userKey,
    );
  };

  return (
    <Link
      to={`/discussion/${id}`}
      className="block"
      onPointerEnter={warmDetail}
      onFocus={warmDetail}
      onPointerDown={warmDetail}
    >
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
                alt=""
                className="size-8 shrink-0 rounded-full object-cover"
                onError={() => setAvatarLoadFailed(true)}
              />
            ) : (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-apex-surface-container-high font-apex-body text-xs font-bold text-apex-on-surface">
                {initials}
              </span>
            )}
            <span className="truncate font-apex-body text-sm font-semibold text-apex-on-surface group-hover:underline">
              {authorDisplay}
            </span>
          </button>
          <DiscussionCategoryBadge
            categoryKey={categoryKey}
            isPinned={isPinned}
          />
        </div>

        <h3 className="mb-1 font-apex-display text-base font-bold text-apex-on-surface">
          {title}
          {wasEdited ? (
            <span className="ml-2 font-apex-body text-xs font-normal text-apex-on-surface-variant">
              (edited)
            </span>
          ) : null}
        </h3>
        <p className="mb-3 line-clamp-2 font-apex-body text-sm text-apex-on-surface-variant">
          {excerpt}
        </p>

        <div className="flex items-center gap-4 font-apex-body text-xs text-apex-on-surface-variant">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" aria-hidden />
            {formatCompactCount(likes)}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" aria-hidden />
            {formatCompactCount(replies)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye className="size-3.5" aria-hidden />
            {formatCompactCount(views)}
          </span>
        </div>
      </article>
    </Link>
  );
}
