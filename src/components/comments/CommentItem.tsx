import { useNavigate } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn, getDiscussionAuthorDisplay, timeAgo } from "@/lib/utils";
import DiscussionCommentAuthorAvatar from "@/pages/discussion/DiscussionCommentAuthorAvatar";
import DiscussionCommentBody from "@/pages/discussion/DiscussionCommentBody";
import { resolveApiUrl } from "@/lib/api/config";
import type { ThreadComment } from "./commentTypes";
import CommentEditHistoryModal from "./CommentEditHistoryModal";
import { canEditThreadComment, deletedCommentCopy } from "./commentUi";

function authorInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

type CommentItemProps = {
  comment: ThreadComment;
  variant: "discussion" | "session";
  isReply?: boolean;
  currentUserId?: string | null;
  isAdmin?: boolean;
  signedIn: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  composer?: ReactNode;
};

export default function CommentItem({
  comment,
  variant,
  isReply = false,
  currentUserId,
  isAdmin = false,
  signedIn,
  onReply,
  onEdit,
  onDelete,
  composer,
}: CommentItemProps) {
  const navigate = useNavigate();
  const [historyOpen, setHistoryOpen] = useState(false);
  const authorId = comment.author?.id ?? comment.userId ?? "";
  const rawName = getDiscussionAuthorDisplay(comment.author);
  const displayName =
    !rawName || rawName === "—" ? "Community member" : rawName;
  const isMine = Boolean(
    currentUserId &&
    (authorId === currentUserId || comment.userId === currentUserId),
  );
  const canEdit = canEditThreadComment(comment, isMine);
  const canDelete = (isMine || isAdmin) && !comment.deletedAt;
  const avatarSrc = resolveApiUrl(comment.author?.avatarUrl);

  const goToAuthor = () => {
    if (authorId) navigate(`/user/${encodeURIComponent(authorId)}`);
  };

  return (
    <article
      className={cn(
        "relative",
        isReply
          ? "rounded-lg border-l-2 border-l-apex-outline-variant/40 bg-apex-surface-container-low/40 p-3 sm:p-4"
          : variant === "discussion"
            ? "rounded-xl border-l-2 border-l-apex-primary/50 bg-apex-surface-container-low p-4 sm:p-5"
            : "rounded-lg border border-apex-outline-variant/10 bg-apex-surface-container-low/60 p-3",
      )}
    >
      {canEdit || canDelete ? (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1 sm:right-4 sm:top-4">
          {canEdit && onEdit ? (
            <button
              type="button"
              onClick={onEdit}
              title={isReply ? "Edit reply" : "Edit comment"}
              aria-label={isReply ? "Edit reply" : "Edit comment"}
              className="inline-flex size-8 items-center justify-center rounded-md text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container-high hover:text-apex-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-primary"
            >
              <Pencil className="size-3.5" aria-hidden />
            </button>
          ) : null}
          {canDelete && onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              title={isReply ? "Delete reply" : "Delete comment"}
              aria-label={isReply ? "Delete reply" : "Delete comment"}
              className="inline-flex size-8 items-center justify-center rounded-md text-apex-on-surface-variant transition-colors hover:bg-apex-error/10 hover:text-apex-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-apex-error"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4",
          (canEdit || canDelete) && "pr-16",
        )}
      >
        {variant === "discussion" ? (
          <DiscussionCommentAuthorAvatar author={comment.author} />
        ) : (
          <button
            type="button"
            className="shrink-0"
            onClick={goToAuthor}
            aria-label={`View ${displayName}'s profile`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="size-9 rounded-full border border-apex-outline-variant/20 object-cover"
              />
            ) : (
              <div className="flex size-9 items-center justify-center rounded-full border border-apex-outline-variant/20 bg-apex-surface-container-high text-[11px] font-semibold text-apex-on-surface-variant">
                {authorInitials(displayName)}
              </div>
            )}
          </button>
        )}
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {variant === "session" ? (
              <button
                type="button"
                onClick={goToAuthor}
                className="truncate font-apex-body text-sm font-semibold text-apex-on-surface transition-colors hover:text-apex-primary"
              >
                {displayName}
              </button>
            ) : (
              <p className="font-apex-body text-sm font-bold leading-none text-apex-on-surface">
                {displayName}
              </p>
            )}
            {variant === "session" && isMine ? (
              <span className="rounded-apex-sm bg-apex-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-apex-primary">
                You
              </span>
            ) : null}
            {comment.isSessionOwner ? (
              <span className="rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-apex-on-surface-variant">
                Owner
              </span>
            ) : null}
          </div>
          <p className="mt-1.5 font-apex-body text-xs text-apex-on-surface-variant">
            {timeAgo(comment.createdAt)}
            {comment.wasEdited && comment.originalBody ? (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="font-medium text-apex-primary underline underline-offset-2 hover:text-apex-primary/80"
                >
                  Edited
                </button>
              </>
            ) : comment.wasEdited ? (
              " · Edited"
            ) : (
              ""
            )}
          </p>
        </div>
      </div>

      {comment.deletedAt ? (
        <p className="font-apex-body text-sm italic text-apex-on-surface-variant">
          {deletedCommentCopy(isReply, displayName)}
        </p>
      ) : variant === "discussion" ? (
        <DiscussionCommentBody body={comment.body} />
      ) : (
        <p className="whitespace-pre-wrap font-apex-body text-sm leading-relaxed text-apex-on-surface">
          {comment.body}
        </p>
      )}

      {signedIn && onReply ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onReply}
            className="font-apex-body text-xs font-medium text-apex-primary transition-colors hover:text-apex-primary/80"
          >
            Reply
          </button>
        </div>
      ) : null}
      {composer}
      {comment.originalBody ? (
        <CommentEditHistoryModal
          open={historyOpen}
          originalBody={comment.originalBody}
          currentBody={comment.body}
          onClose={() => setHistoryOpen(false)}
        />
      ) : null}
    </article>
  );
}
