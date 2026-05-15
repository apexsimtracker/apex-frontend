import { useState, useEffect, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiPost, getSessionCommentsPage, SESSION_COMMENTS_PAGE_DEFAULT_LIMIT } from "@/lib/api";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { BaseModal } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type CommentItem = { id: string; body: string; createdAt?: string; userId?: string };

const COMMENTS_MODAL_LIMIT = SESSION_COMMENTS_PAGE_DEFAULT_LIMIT;

type SessionCommentsModalProps = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onRefreshSession?: () => void;
};

export function SessionCommentsModal({
  sessionId,
  isOpen,
  onClose,
  onCommentAdded,
  onRefreshSession,
}: SessionCommentsModalProps) {
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
    queryKey: ["sessions", sessionId, "modal-comments", page, COMMENTS_MODAL_LIMIT],
    queryFn: () => getSessionCommentsPage(sessionId, { page, limit: COMMENTS_MODAL_LIMIT }),
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

  const commentsError = commentsFailed ? "Can't load comments. Backend may be offline." : null;

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
        const lastPage = Math.max(1, Math.ceil(freshTotal / COMMENTS_MODAL_LIMIT) || 1);
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
    <BaseModal
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
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={commentPending || !commentText.trim()}
                onClick={() => void submitComment()}
              >
                {commentPending ? "Posting…" : "Post"}
              </Button>
            </div>
            {commentError ? (
              <div className="text-xs text-destructive">{commentError}</div>
            ) : null}
          </div>
        </>
      }
    >
          {commentsLoading ? (
            <p className="text-xs text-muted-foreground">Loading comments…</p>
          ) : commentsError ? (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">{commentsError}</p>
              <button type="button" onClick={() => loadComments()} className="text-xs text-primary underline hover:text-primary/80">
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm text-foreground">
                  <p>{c.body}</p>
                  {c.createdAt && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        {total > 0 && !commentsLoading && !commentsError && (
          <div className="space-y-3 border-t border-border pt-4">
            {range && (
              <p className="text-center text-xs text-muted-foreground">
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
    </BaseModal>
  );
}
