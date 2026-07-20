import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Eye,
  MoreHorizontal,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCompactCount, timeAgo, cn } from "@/lib/utils";
import {
  appDropdownContentClassName,
  appDropdownDangerItemClassName,
  appDropdownItemClassName,
} from "@/components/app-ui/appButtonClasses";
import DiscussionCategoryBadge from "@/pages/discussion/DiscussionCategoryBadge";
import type { Discussion } from "@/lib/api";

type DiscussionPostCardProps = {
  discussion: Discussion;
  authorDisplay: string;
  authorId: string | null;
  description: string;
  avatarSrc: string | null | undefined;
  showPostAvatar: boolean;
  initials: string;
  isOwner: boolean;
  alreadyEdited: boolean;
  showEditedBadge: boolean;
  onPostAvatarError: () => void;
  onLikeClick: () => void;
  likePending: boolean;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onOriginalClick: () => void;
};

export default function DiscussionPostCard({
  discussion,
  authorDisplay,
  authorId,
  description,
  avatarSrc,
  showPostAvatar,
  initials,
  isOwner,
  alreadyEdited,
  showEditedBadge,
  onPostAvatarError,
  onLikeClick,
  likePending,
  onEditClick,
  onDeleteClick,
  onOriginalClick,
}: DiscussionPostCardProps) {
  const navigate = useNavigate();

  const commentCount =
    discussion.commentCount ??
    discussion.commentsCount ??
    discussion.replies ??
    0;

  const categoryKey = discussion.category ?? "general";

  return (
    <article className="relative overflow-hidden rounded-xl border border-apex-outline-variant/25 border-l-[3px] border-l-apex-primary bg-apex-surface-container-low p-5 sm:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-apex-primary/80 via-apex-primary/20 to-transparent"
        aria-hidden
      />

      {isOwner && (
        <div className="absolute right-3 top-4 z-10 sm:right-4 sm:top-5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-apex-on-surface-variant hover:bg-apex-surface-container-high hover:text-apex-on-surface"
                aria-label="Post options"
              >
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className={cn(appDropdownContentClassName, "min-w-[10rem]")}
            >
              {!alreadyEdited && (
                <DropdownMenuItem
                  className={appDropdownItemClassName}
                  onClick={onEditClick}
                >
                  <Pencil className="mr-2 size-4" />
                  Edit post
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className={appDropdownDangerItemClassName}
                onClick={onDeleteClick}
              >
                <Trash2 className="mr-2 size-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className={cn("mb-4 flex items-center gap-2", isOwner && "pr-10")}>
        <button
          type="button"
          onClick={() => {
            if (authorId)
              navigate(`/user/${encodeURIComponent(authorId)}`);
          }}
          className="group flex min-w-0 flex-1 items-center gap-2 text-left transition-opacity hover:opacity-80"
        >
          {showPostAvatar ? (
            <img
              src={avatarSrc!}
              alt={authorDisplay}
              className="size-8 shrink-0 rounded-full object-cover"
              onError={onPostAvatarError}
            />
          ) : (
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-apex-surface-container-high font-apex-body text-[10px] font-medium text-apex-on-surface-variant"
              aria-label={`Avatar for ${authorDisplay}`}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-apex-body text-xs font-bold text-apex-on-surface transition-colors group-hover:text-apex-primary">
              {authorDisplay}
            </p>
            <p className="font-apex-body text-[11px] text-apex-on-surface-variant">
              {timeAgo(discussion.createdAt)}
            </p>
          </div>
        </button>
        <DiscussionCategoryBadge
          isPinned={discussion.isPinned}
          categoryKey={categoryKey}
          className="ml-auto"
        />
      </div>

      {(discussion.isPinned || showEditedBadge) && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {discussion.isPinned && (
            <span className="inline-flex items-center gap-1 font-apex-body text-[10px] font-semibold uppercase tracking-wide text-apex-primary">
              <Pin className="size-3 shrink-0" aria-hidden />
              Pinned
            </span>
          )}
          {showEditedBadge && (
            <button
              type="button"
              onClick={onOriginalClick}
              className="font-apex-body text-[10px] font-medium uppercase tracking-wide text-apex-on-surface-variant underline underline-offset-2 transition-colors hover:text-apex-on-surface"
            >
              Edited
            </button>
          )}
        </div>
      )}

      <h1 className="mb-4 font-apex-headline text-3xl font-bold tracking-tight text-apex-on-surface">
        {discussion.title}
      </h1>
      <p className="mb-5 whitespace-pre-wrap font-apex-body text-sm leading-relaxed text-apex-on-surface-variant sm:text-base">
        {description}
      </p>

      <div className="flex flex-wrap items-center gap-4 border-t border-apex-outline-variant/10 pt-4 font-apex-body text-[11px] text-apex-on-surface-variant">
        <button
          type="button"
          onClick={onLikeClick}
          disabled={likePending}
          aria-pressed={Boolean(discussion.likedByMe)}
          aria-label={discussion.likedByMe ? "Unlike post" : "Like post"}
          className={cn(
            "group inline-flex items-center gap-1 tabular-nums transition-colors disabled:opacity-60",
            discussion.likedByMe
              ? "text-apex-primary hover:text-apex-on-surface"
              : "text-apex-on-surface-variant hover:text-apex-on-surface",
          )}
        >
          <Heart
            className={cn(
              "size-3.5 shrink-0 transition-colors",
              discussion.likedByMe
                ? "fill-current text-apex-primary group-hover:text-apex-on-surface"
                : "group-hover:text-apex-on-surface",
            )}
          />
          <span
            className="transition-colors group-hover:text-apex-on-surface"
            title={String(discussion.likeCount ?? 0)}
          >
            {formatCompactCount(discussion.likeCount ?? 0)}
          </span>
        </button>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <MessageCircle className="size-3.5 shrink-0" aria-hidden />
          <span title={String(commentCount)}>
            {formatCompactCount(commentCount)}
          </span>
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Eye className="size-3.5 shrink-0" aria-hidden />
          <span title={String(discussion.views ?? 0)}>
            {formatCompactCount(discussion.views ?? 0)}
          </span>
        </span>
      </div>
    </article>
  );
}
