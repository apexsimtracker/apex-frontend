import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiPost,
  getSessionCommentsPage,
  SESSION_COMMENTS_PAGE_DEFAULT_LIMIT,
} from "@/lib/api";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  v2InputClassName,
  v2OutlineButtonClassName,
  v2PrimaryButtonClassName,
} from "@/components/v2/ui/v2ButtonClasses";
import { V2BaseModal } from "@/components/v2/ui/V2BaseModal";

type CommentItem = {
  id: string;
  body: string;
  createdAt?: string;
  userId?: string;
};

const COMMENTS_MODAL_LIMIT = SESSION_COMMENTS_PAGE_DEFAULT_LIMIT;

type SessionCommentsModalV2Props = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onRefreshSession?: () => void;
};

export function SessionCommentsModalV2({
  sessionId,
  isOpen,
  onClose,
  onCommentAdded,
  onRefreshSession,
}: SessionCommentsModalV2Props) {
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setCommentText("");
    setCommentError(null);
    setPage(1);
  }, [isOpen, sessionId]);

  const {
    data: commentsPage,
    isPending: commentsLoading,
    isError: commentsFailed,
    refetch,
  } = useQuery({
    queryKey: [
      "sessions",
      sessionId,
      "modal-comments",
      page,
      COMMENTS_MODAL_LIMIT,
    ],
    queryFn: () =>
      getSessionCommentsPage(sessionId, { page, limit: COMMENTS_MODAL_LIMIT }),
    enabled: isOpen && Boolean(sessionId),
  });

  const comments = commentsPage?.comments ?? [];
  const total = commentsPage?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / COMMENTS_MODAL_LIMIT) || 1);
  const range =
    total === 0
      ? null
      : {
          start: (page - 1) * COMMENTS_MODAL_LIMIT + 1,
          end: Math.min(page * COMMENTS_MODAL_LIMIT, total),
        };

  const commentsError = commentsFailed
    ? "Can't load comments. Backend may be offline."
    : null;

  const postMutation = useMutation({
    mutationFn: (body: string) =>
      apiPost<{ comment: CommentItem }>(`/api/sessions/${sessionId}/comments`, {
        body,
      }),
    onSuccess: async () => {
      setCommentText("");
      onCommentAdded();
      onRefreshSession?.();
      try {
        const { total: freshTotal } = await getSessionCommentsPage(sessionId, {
          page: 1,
          limit: COMMENTS_MODAL_LIMIT,
        });
        const lastPage = Math.max(
          1,
          Math.ceil(freshTotal / COMMENTS_MODAL_LIMIT) || 1,
        );
        setPage(lastPage);
      } catch {
        setPage(1);
      }
      await queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId, "modal-comments"],
      });
    },
    onError: () => {
      setCommentError("Can't post right now. Backend may be offline.");
    },
  });

  const commentPending = postMutation.isPending;

  const submitComment = useCallback(() => {
    const body = commentText.trim();
    if (!body || commentPending) return;
    setCommentError(null);
    postMutation.mutate(body);
  }, [commentText, commentPending, postMutation]);

  const loadComments = useCallback(() => {
    void refetch();
  }, [refetch]);

  return (
    <V2BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Comments"
      size="sm"
      mobileVariant="sheet"
      bodyClassName="flex min-h-0 flex-1 flex-col gap-4"
      footer={
        <>
          <div className="flex w-full flex-col gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void submitComment();
                  }
                }}
                placeholder="Add a comment..."
                className={cn(v2InputClassName, "flex-1")}
              />
              <button
                type="button"
                className={cn(
                  v2PrimaryButtonClassName,
                  "inline-flex shrink-0 items-center justify-center px-4 py-2",
                )}
                disabled={commentPending || !commentText.trim()}
                onClick={() => void submitComment()}
              >
                {commentPending ? "Posting…" : "Post"}
              </button>
            </div>
            {commentError ? (
              <div className="font-v2-body text-xs text-v2-error">
                {commentError}
              </div>
            ) : null}
          </div>
        </>
      }
    >
      {commentsLoading ? (
        <p className="font-v2-body text-xs text-v2-on-surface-variant">
          Loading comments…
        </p>
      ) : commentsError ? (
        <div className="space-y-2">
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            {commentsError}
          </p>
          <button
            type="button"
            onClick={() => loadComments()}
            className={cn(
              v2OutlineButtonClassName,
              "font-v2-body text-xs underline",
            )}
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="font-v2-body text-xs text-v2-on-surface-variant">
          No comments yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <li key={c.id} className="font-v2-body text-sm text-v2-on-surface">
              <p>{c.body}</p>
              {c.createdAt && (
                <p className="mt-0.5 font-v2-body text-xs text-v2-on-surface-variant">
                  {new Date(c.createdAt).toLocaleString()}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
      {total > 0 && !commentsLoading && !commentsError && (
        <div className="space-y-3 border-t border-v2-outline-variant/15 pt-4">
          {range && (
            <p className="text-center font-v2-body text-xs text-v2-on-surface-variant">
              Showing {range.start}–{range.end} of {total}
            </p>
          )}
          <RaceHistoryPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={commentsLoading}
          />
        </div>
      )}
    </V2BaseModal>
  );
}
