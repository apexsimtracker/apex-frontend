import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { apiPost, getSessionCommentsPage, SESSION_COMMENTS_PAGE_DEFAULT_LIMIT } from "@/lib/api";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";

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

  if (!isOpen) return null;
  if (typeof document === "undefined" || !document.body) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-t-lg border border-white/10 bg-card/20 shadow-xl backdrop-blur-lg sm:rounded-lg"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-semibold text-white">Comments</h3>
          <button type="button" onClick={onClose} className="p-1 text-white/50 hover:text-white">
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {commentsLoading ? (
            <p className="text-xs text-zinc-500">Loading comments…</p>
          ) : commentsError ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">{commentsError}</p>
              <button
                type="button"
                onClick={() => loadComments()}
                className="text-xs text-zinc-400 underline hover:text-zinc-300"
              >
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-zinc-500">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm text-white/80">
                  <p>{c.body}</p>
                  {c.createdAt && (
                    <p className="mt-0.5 text-xs text-white/50">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        {total > 0 && !commentsLoading && !commentsError && (
          <div className="space-y-3 border-t border-white/5 px-4 py-3">
            {range && (
              <p className="text-center text-xs text-zinc-500">
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
        <div className="flex flex-col gap-2 border-t border-white/10 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                  e.preventDefault();
                  void submitComment();
                }
              }}
              placeholder="Add a comment..."
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
            <button
              type="button"
              disabled={commentPending || !commentText.trim()}
              className={`rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/15 disabled:pointer-events-none ${commentPending || !commentText.trim() ? "cursor-not-allowed opacity-50" : ""}`}
              onClick={() => void submitComment()}
            >
              {commentPending ? "Posting…" : "Post"}
            </button>
          </div>
          {commentError && <div className="text-xs text-red-400">{commentError}</div>}
        </div>
      </div>
    </div>
  );

  try {
    return createPortal(modalContent, document.body);
  } catch {
    return null;
  }
}
