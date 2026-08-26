import { MessageCircle } from "lucide-react";
import type { RefObject } from "react";
import type { DiscussionComment } from "@/lib/api/community";
import CommentThread from "@/components/comments/CommentThread";
import { Skeleton } from "@/components/ui/skeleton";
import DiscussionCommentsPagination from "./DiscussionCommentsPagination";
import { DISCUSSION_REPLY_MAX_LENGTH } from "./discussionReplyUtils";

type DiscussionCommentListProps = {
  repliesTotal: number;
  threadTotal: number;
  comments: DiscussionComment[];
  commentsError: string | null;
  commentsPage: number;
  commentsTotalPages: number;
  commentsFetching: boolean;
  commentsRange: { start: number; end: number } | null;
  onRetryComments: () => void;
  onPageChange: (page: number) => void;
  dockAnchorRef?: RefObject<HTMLDivElement | null>;
  currentUserId?: string | null;
  isAdmin?: boolean;
  signedIn: boolean;
  replyOpenId: string | null;
  editingId: string | null;
  editError?: string | null;
  replyError?: string | null;
  posting?: boolean;
  onToggleReply: (rootId: string) => void;
  onToggleEdit: (commentId: string | null) => void;
  onSubmitReply: (rootId: string, body: string) => void;
  onSubmitEdit: (commentId: string, body: string) => void;
  onDelete: (commentId: string) => void;
  onLoadMoreReplies: (rootId: string) => void;
  loadingMoreRootId?: string | null;
};

export default function DiscussionCommentList({
  repliesTotal,
  threadTotal,
  comments,
  commentsError,
  commentsPage,
  commentsTotalPages,
  commentsFetching,
  commentsRange,
  onRetryComments,
  onPageChange,
  dockAnchorRef,
  currentUserId,
  isAdmin,
  signedIn,
  replyOpenId,
  editingId,
  editError,
  replyError,
  posting,
  onToggleReply,
  onToggleEdit,
  onSubmitReply,
  onSubmitEdit,
  onDelete,
  onLoadMoreReplies,
  loadingMoreRootId,
}: DiscussionCommentListProps) {
  const repliesSubtitle =
    repliesTotal === 0
      ? "Start the conversation below."
      : `${repliesTotal} ${repliesTotal === 1 ? "reply" : "replies"}`;

  return (
    <section aria-labelledby="replies-heading">
      <h2
        id="replies-heading"
        className="mb-1 font-apex-headline text-[10px] uppercase tracking-[0.2em] text-apex-on-surface-variant"
      >
        Replies
      </h2>
      <p className="mb-6 font-apex-body text-sm text-apex-on-surface-variant">
        {repliesSubtitle}
      </p>

      {commentsError && (
        <div className="mb-6 rounded-lg border border-apex-error/30 bg-apex-error/10 px-4 py-3 font-apex-body text-sm text-apex-error">
          {commentsError}
          <button
            type="button"
            onClick={onRetryComments}
            className="ml-2 font-medium text-apex-primary transition-colors hover:text-apex-primary/80"
          >
            Retry
          </button>
        </div>
      )}

      {!commentsError && repliesTotal === 0 && (
        <div className="mb-8 rounded-xl border border-dashed border-apex-outline-variant/20 bg-apex-surface-container-low px-6 py-12 text-center">
          <MessageCircle
            className="mx-auto mb-3 size-10 text-apex-on-surface-variant/30"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="font-apex-body text-sm font-medium text-apex-on-surface">
            No replies yet
          </p>
          <p className="mt-1 font-apex-body text-xs text-apex-on-surface-variant sm:text-sm">
            Be the first to share your thoughts.
          </p>
        </div>
      )}

      {!commentsError &&
      commentsFetching &&
      comments.length === 0 &&
      repliesTotal > 0 ? (
        <div className="mb-8 space-y-3" aria-busy="true" aria-label="Loading comments">
          {[0, 1].map((row) => (
            <div
              key={row}
              className="flex gap-3 rounded-xl bg-apex-surface-container-low p-4"
            >
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!commentsError && comments.length > 0 && (
        <ul className="mb-8 space-y-3 sm:space-y-4">
          {comments.map((c) => (
            <CommentThread
              key={c.id}
              comment={c}
              variant="discussion"
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              signedIn={signedIn}
              maxLength={DISCUSSION_REPLY_MAX_LENGTH}
              replyOpen={replyOpenId === c.id}
              editingId={editingId}
              editError={editError}
              replyError={replyOpenId === c.id ? replyError : null}
              posting={posting}
              onToggleReply={onToggleReply}
              onToggleEdit={onToggleEdit}
              onSubmitReply={onSubmitReply}
              onSubmitEdit={onSubmitEdit}
              onDelete={onDelete}
              onLoadMoreReplies={onLoadMoreReplies}
              loadingMore={loadingMoreRootId === c.id}
            />
          ))}
        </ul>
      )}

      {!commentsError && comments.length > 0 && (
        <div className="mb-4 space-y-3">
          {commentsRange && (
            <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
              Showing {commentsRange.start}–{commentsRange.end} of {threadTotal}
            </p>
          )}
          <DiscussionCommentsPagination
            page={commentsPage}
            totalPages={commentsTotalPages}
            onPageChange={onPageChange}
            disabled={commentsFetching}
          />
        </div>
      )}

      <div ref={dockAnchorRef} aria-hidden className="h-0 w-full shrink-0" />
    </section>
  );
}
