import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import {
  apiPost,
  ApiError,
  getSessionCommentsPage,
  SESSION_COMMENTS_PAGE_DEFAULT_LIMIT,
  SESSION_COMMENT_MAX_LENGTH,
  type SessionCommentFilter,
  type SessionCommentItem,
} from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { cn, timeAgo } from "@/lib/utils";
import { resolveApiUrl } from "@/lib/api/config";
import {
  appManualTextareaClassName,
  appOutlineButtonClassName,
  appPrimaryButtonClassName,
} from "@/components/app-ui/appButtonClasses";
import { AppBaseModal } from "@/components/app-ui/AppBaseModal";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const COMMENTS_MODAL_LIMIT = SESSION_COMMENTS_PAGE_DEFAULT_LIMIT;
const SEARCH_DEBOUNCE_MS = 300;

const FILTER_OPTIONS: { value: SessionCommentFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "owner", label: "Owner" },
];

type SessionCommentsModalProps = {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onRefreshSession?: () => void;
};

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

export function SessionCommentsModal({
  sessionId,
  isOpen,
  onClose,
  onCommentAdded,
  onRefreshSession,
}: SessionCommentsModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<SessionCommentFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setCommentText("");
    setCommentError(null);
    setPage(1);
    setFilter("all");
    setSearchInput("");
  }, [isOpen, sessionId]);

  useEffect(() => {
    setPage(1);
  }, [filter, debouncedSearch]);

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
      filter,
      debouncedSearch.trim(),
    ],
    queryFn: () =>
      getSessionCommentsPage(sessionId, {
        page,
        limit: COMMENTS_MODAL_LIMIT,
        filter,
        q: debouncedSearch.trim() || undefined,
      }),
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

  const hasActiveFilters =
    filter !== "all" || searchInput.trim().length > 0;

  const charCount = commentText.length;
  const overLimit = charCount > SESSION_COMMENT_MAX_LENGTH;

  const postMutation = useMutation({
    mutationFn: (body: string) =>
      apiPost<{ comment: SessionCommentItem }>(
        `/api/sessions/${sessionId}/comments`,
        { body },
      ),
    onSuccess: async () => {
      setCommentText("");
      setCommentError(null);
      onCommentAdded();
      onRefreshSession?.();
      setFilter("all");
      setSearchInput("");
      setPage(1);
      await queryClient.invalidateQueries({
        queryKey: ["sessions", sessionId, "modal-comments"],
      });
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError && err.message.trim()) {
        setCommentError(err.message);
        return;
      }
      setCommentError("Can't post right now. Backend may be offline.");
    },
  });

  const commentPending = postMutation.isPending;

  const submitComment = useCallback(() => {
    const body = commentText.trim();
    if (!body || commentPending || body.length > SESSION_COMMENT_MAX_LENGTH) {
      return;
    }
    setCommentError(null);
    postMutation.mutate(body);
  }, [commentText, commentPending, postMutation]);

  const clearFilters = useCallback(() => {
    setFilter("all");
    setSearchInput("");
    setPage(1);
  }, []);

  const emptyMessage = useMemo(() => {
    if (hasActiveFilters) {
      return "No comments match your filters.";
    }
    return "No comments yet. Be the first to leave feedback.";
  }, [hasActiveFilters]);

  return (
    <AppBaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Comments"
      size="xl"
      mobileVariant="sheet"
      bodyClassName="flex min-h-0 flex-1 flex-col gap-4"
      footer={
        <div className="flex w-full flex-col gap-2">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void submitComment();
              }
            }}
            placeholder="Add a comment…"
            rows={3}
            maxLength={SESSION_COMMENT_MAX_LENGTH + 50}
            disabled={commentPending}
            className={cn(
              appManualTextareaClassName,
              "max-h-32 min-h-[5.5rem] overflow-y-auto",
            )}
            aria-label="Comment text"
          />
          <div className="flex items-center justify-between gap-3">
            <p
              className={cn(
                "font-apex-body text-xs tabular-nums",
                overLimit
                  ? "text-apex-error"
                  : "text-apex-on-surface-variant",
              )}
            >
              {charCount}/{SESSION_COMMENT_MAX_LENGTH}
            </p>
            <button
              type="button"
              className={cn(
                appPrimaryButtonClassName,
                "inline-flex shrink-0 items-center justify-center px-4 py-2",
              )}
              disabled={
                commentPending ||
                !commentText.trim() ||
                overLimit
              }
              onClick={() => void submitComment()}
            >
              {commentPending ? "Posting…" : "Post"}
            </button>
          </div>
          {commentError ? (
            <div className="font-apex-body text-xs text-apex-error">
              {commentError}
            </div>
          ) : (
            <p className="font-apex-body text-[11px] text-apex-on-surface-variant">
              Press Ctrl/Cmd+Enter to post
            </p>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-apex-on-surface-variant/60"
            aria-hidden
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search comments"
            className="w-full rounded-lg border border-apex-outline-variant/15 bg-apex-surface-container px-10 py-2.5 font-apex-body text-sm text-apex-on-surface transition-colors placeholder:text-apex-on-surface-variant/60 focus:border-apex-primary/40 focus:outline-none [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
            aria-label="Search comments"
          />
          {searchInput.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearchInput("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-apex-primary transition-colors hover:text-apex-primary/80"
              aria-label="Clear search"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTER_OPTIONS.map((opt) => {
            const isActive = filter === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFilter(opt.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-apex-body text-[10px] font-bold uppercase tracking-wide transition-colors",
                  isActive
                    ? "bg-apex-primary text-white"
                    : "bg-apex-surface-container-low text-apex-on-surface-variant hover:text-apex-on-surface",
                )}
              >
                {opt.label}
              </button>
            );
          })}
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-apex-outline-variant/20 px-2.5 py-1.5 font-apex-body text-[10px] font-bold uppercase tracking-wide text-apex-on-surface-variant transition-colors hover:bg-apex-surface-container hover:text-apex-on-surface"
            >
              <X className="size-3 text-apex-primary" aria-hidden />
              Clear
            </button>
          ) : null}
        </div>
      </div>

      {commentsLoading ? (
        <p className="font-apex-body text-sm text-apex-on-surface-variant">
          Loading comments…
        </p>
      ) : commentsError ? (
        <div className="space-y-2">
          <p className="font-apex-body text-sm text-apex-on-surface-variant">
            {commentsError}
          </p>
          <button
            type="button"
            onClick={() => void refetch()}
            className={cn(
              appOutlineButtonClassName,
              "font-apex-body text-xs underline",
            )}
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <p className="font-apex-body text-sm text-apex-on-surface-variant">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const displayName =
              c.author?.displayName?.trim() || "Community member";
            const avatarSrc = resolveApiUrl(c.author?.avatarUrl);
            const isMine = Boolean(user?.id && c.userId === user.id);
            const isOwner = Boolean(c.isSessionOwner);

            return (
              <li
                key={c.id}
                className="rounded-lg border border-apex-outline-variant/10 bg-apex-surface-container-low/60 p-3"
              >
                <div className="mb-2 flex items-start gap-3">
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={() => {
                      if (c.userId) {
                        navigate(`/user/${encodeURIComponent(c.userId)}`);
                      }
                    }}
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
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <button
                        type="button"
                        onClick={() => {
                          if (c.userId) {
                            navigate(`/user/${encodeURIComponent(c.userId)}`);
                          }
                        }}
                        className="truncate font-apex-body text-sm font-semibold text-apex-on-surface transition-colors hover:text-apex-primary"
                      >
                        {displayName}
                      </button>
                      {isMine ? (
                        <span className="rounded-apex-sm bg-apex-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-apex-primary">
                          You
                        </span>
                      ) : null}
                      {isOwner ? (
                        <span className="rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-apex-on-surface-variant">
                          Owner
                        </span>
                      ) : null}
                      {c.createdAt ? (
                        <span className="font-apex-body text-[11px] text-apex-on-surface-variant">
                          {timeAgo(c.createdAt)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap font-apex-body text-sm leading-relaxed text-apex-on-surface">
                      {c.body}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {total > 0 && !commentsLoading && !commentsError ? (
        <div className="space-y-3 border-t border-apex-outline-variant/15 pt-4">
          {range ? (
            <p className="text-center font-apex-body text-xs text-apex-on-surface-variant">
              Showing {range.start}–{range.end} of {total}
            </p>
          ) : null}
          <RaceHistoryPagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={commentsLoading}
          />
        </div>
      ) : null}
    </AppBaseModal>
  );
}
