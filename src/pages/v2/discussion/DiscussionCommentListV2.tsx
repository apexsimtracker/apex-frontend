import { MessageCircle } from "lucide-react";
import type { DiscussionComment } from "@/lib/api";
import DiscussionCommentItemV2 from "./DiscussionCommentItemV2";
import DiscussionCommentsPaginationV2 from "./DiscussionCommentsPaginationV2";

type DiscussionCommentListV2Props = {
  repliesTotal: number;
  comments: DiscussionComment[];
  commentsError: string | null;
  commentsPage: number;
  commentsTotalPages: number;
  commentsFetching: boolean;
  commentsRange: { start: number; end: number } | null;
  onRetryComments: () => void;
  onPageChange: (page: number) => void;
};

export default function DiscussionCommentListV2({
  repliesTotal,
  comments,
  commentsError,
  commentsPage,
  commentsTotalPages,
  commentsFetching,
  commentsRange,
  onRetryComments,
  onPageChange,
}: DiscussionCommentListV2Props) {
  const repliesSubtitle =
    repliesTotal === 0
      ? "Start the conversation below."
      : `${repliesTotal} ${repliesTotal === 1 ? "reply" : "replies"}`;

  return (
    <section aria-labelledby="replies-heading-v2">
      <h2
        id="replies-heading-v2"
        className="mb-1 font-v2-headline text-[10px] uppercase tracking-[0.2em] text-v2-on-surface-variant"
      >
        Replies
      </h2>
      <p className="mb-6 font-v2-body text-sm text-v2-on-surface-variant">
        {repliesSubtitle}
      </p>

      {commentsError && (
        <div className="mb-6 rounded-lg border border-v2-error/30 bg-v2-error/10 px-4 py-3 font-v2-body text-sm text-v2-error">
          {commentsError}
          <button
            type="button"
            onClick={onRetryComments}
            className="ml-2 font-medium text-v2-primary transition-colors hover:text-v2-primary/80"
          >
            Retry
          </button>
        </div>
      )}

      {!commentsError && repliesTotal === 0 && (
        <div className="mb-8 rounded-xl border border-dashed border-v2-outline-variant/20 bg-v2-surface-container-low px-6 py-12 text-center">
          <MessageCircle
            className="mx-auto mb-3 size-10 text-v2-on-surface-variant/30"
            strokeWidth={1.25}
            aria-hidden
          />
          <p className="font-v2-body text-sm font-medium text-v2-on-surface">
            No replies yet
          </p>
          <p className="mt-1 font-v2-body text-xs text-v2-on-surface-variant sm:text-sm">
            Be the first to share your thoughts.
          </p>
        </div>
      )}

      {!commentsError && repliesTotal > 0 && (
        <ul className="mb-8 space-y-3 sm:space-y-4">
          {comments.map((c) => (
            <DiscussionCommentItemV2 key={c.id} comment={c} />
          ))}
        </ul>
      )}

      {!commentsError && repliesTotal > 0 && (
        <div className="mb-4 space-y-3">
          {commentsRange && (
            <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
              Showing {commentsRange.start}–{commentsRange.end} of{" "}
              {repliesTotal}
            </p>
          )}
          <DiscussionCommentsPaginationV2
            page={commentsPage}
            totalPages={commentsTotalPages}
            onPageChange={onPageChange}
            disabled={commentsFetching}
          />
        </div>
      )}
    </section>
  );
}
