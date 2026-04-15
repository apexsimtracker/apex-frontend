import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, MessageCircle, Pin } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DiscussionCategoryIcon } from "@/components/DiscussionCategoryIcon";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
  formatCompactCount,
} from "@/lib/utils";
import {
  getDiscussionCategoryLabel,
  resolveDiscussionAvatarSrc,
  getDiscussionAuthorId,
} from "@/lib/api";

interface DiscussionCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: { id: string; displayName?: string | null; avatarUrl?: string | null } | unknown;
  /** Backend category: setup | guides | general */
  categoryKey: string;
  timestamp: string;
  replies: number;
  views: number;
  isPinned?: boolean;
}

export default function DiscussionCard({
  id,
  title,
  excerpt,
  author,
  categoryKey,
  timestamp,
  replies,
  views,
  isPinned,
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
  const categoryLabel = getDiscussionCategoryLabel(categoryKey);

  return (
    <Link to={`/discussion/${id}`}>
      <div className="border-white/6 mb-6 cursor-pointer overflow-hidden rounded-lg border bg-card/20 shadow-none backdrop-blur-lg transition-all duration-300 hover:shadow-sm active:bg-card/30 active:shadow-md">
        {/* Header */}
        <div className="border-white/3 border-b px-4 py-3 sm:px-5 sm:py-3.5">
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (authorId) navigate(`/user/${encodeURIComponent(authorId)}`);
              }}
              className="group flex flex-1 items-center gap-2 text-left transition-opacity hover:opacity-80 sm:gap-3"
            >
              {showAvatar ? (
                <img
                  src={avatarSrc!}
                  alt={authorDisplay}
                  className="group-hover:ring-1.5 size-8 shrink-0 rounded-full object-cover transition-all group-hover:ring-primary sm:size-9"
                  onError={() => setAvatarLoadFailed(true)}
                />
              ) : (
                <div
                  className="group-hover:ring-1.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70 transition-all group-hover:ring-primary sm:size-9"
                  aria-label={`Avatar for ${authorDisplay}`}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-white transition-colors group-hover:text-primary sm:text-sm">
                  {authorDisplay}
                </p>
                <p className="mt-0.5 text-xs text-white/50">{timestamp}</p>
              </div>
            </button>
            {isPinned && (
              <div
                className="flex shrink-0 items-center text-xs sm:text-sm"
                style={{ color: "rgb(240, 28, 28)" }}
              >
                <Pin className="size-4" aria-hidden />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          {/* Category */}
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <span className="bg-white/2 ml-0 inline-flex items-center gap-1.5 rounded-md py-1 pr-2 text-xs font-medium text-white/60">
              <DiscussionCategoryIcon
                categoryKey={categoryKey}
                className="size-3.5 text-white/70"
              />
              {categoryLabel}
            </span>
            {isPinned && (
              <span
                className="inline-block rounded-md bg-[rgba(240,28,28,0.06)] px-2 py-1 text-xs font-medium text-[rgb(240,28,28)]"
              >
                Pinned
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="mb-2 line-clamp-2 text-xs font-semibold leading-snug text-white transition-colors group-hover:text-primary sm:text-sm">
            {title}
          </h3>

          {/* Excerpt */}
          <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-white/60">
            {excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center gap-4 text-xs text-white/50">
            <div className="flex items-center gap-1">
              <MessageCircle className="size-3" />
              <span className="font-medium tabular-nums" title={String(replies ?? 0)}>
                {formatCompactCount(replies ?? 0)}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="size-3" />
              <span className="font-medium tabular-nums" title={String(views ?? 0)}>
                {formatCompactCount(views ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
