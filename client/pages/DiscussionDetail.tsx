import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowLeft, Heart, Reply, Eye } from "lucide-react";
import {
  getDiscussion,
  getDiscussionComments,
  createDiscussionComment,
  DISCUSSION_CATEGORIES,
  DISCUSSION_COMMENTS_PAGE_SIZE,
  ApiError,
  resolveDiscussionAvatarSrc,
  getDiscussionAuthorId,
  likeDiscussion,
  unlikeDiscussion,
  recordDiscussionView,
  type Discussion,
  type DiscussionComment,
  type DiscussionCommentsPageResult,
} from "@/lib/api";
import type { AuthRedirectState } from "@/auth/authRedirect";
import { DiscussionCategoryIcon } from "@/components/DiscussionCategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import {
  timeAgo,
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
  formatCompactCount,
  cn,
} from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { RaceHistoryPagination } from "@/components/RaceHistoryPagination";
import { COMPANY_NAME } from "@/lib/siteMeta";

/** Persists one UUID per browser for anonymous view dedupe; signing in uses a separate server-side key (may double-count once — MVP). */
const ANON_VIEWER_STORAGE_KEY = "apex_discussion_anon_viewer";

function getOrCreateAnonymousViewerId(): string {
  try {
    let v = localStorage.getItem(ANON_VIEWER_STORAGE_KEY);
    if (!v) {
      v = crypto.randomUUID();
      localStorage.setItem(ANON_VIEWER_STORAGE_KEY, v);
    }
    return v;
  } catch {
    return crypto.randomUUID();
  }
}

function categoryLabel(value: string) {
  return DISCUSSION_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

/** Avatar for a comment row: same resolution as /profile when the reply is yours. */
function CommentAuthorAvatar({ author }: { author: unknown }) {
  const { user } = useAuth();
  const label = getDiscussionAuthorDisplay(author);
  const src = resolveDiscussionAvatarSrc(author, user);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src, user?.id, user?.avatarUrl]);
  const initials = getDiscussionAuthorInitials(label);
  if (src?.trim() && !failed) {
    return (
      <img
        src={src}
        alt={label}
        className="size-9 shrink-0 rounded-full object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-medium text-white/70">
      {initials}
    </div>
  );
}

function discussionLoadErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.status === 404) return "Discussion not found.";
  if (e instanceof ApiError && e.status === 0) return "Failed to load discussion.";
  return "Failed to load discussion.";
}

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const discussionQuery = useQuery({
    queryKey: ["discussion", "detail", id ?? ""],
    queryFn: () => getDiscussion(id!),
    enabled: Boolean(id),
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === 404),
  });

  const [commentsPage, setCommentsPage] = useState(1);

  const commentsQuery = useQuery({
    queryKey: ["discussion", "comments", id ?? "", commentsPage],
    queryFn: () =>
      getDiscussionComments(id!, {
        page: commentsPage,
        limit: DISCUSSION_COMMENTS_PAGE_SIZE,
      }),
    enabled: Boolean(id) && discussionQuery.isSuccess,
    placeholderData: keepPreviousData,
  });

  const discussion = discussionQuery.data ?? null;
  const comments: DiscussionComment[] = commentsQuery.data?.items ?? [];

  const discussionError = discussionQuery.isError
    ? discussionLoadErrorMessage(discussionQuery.error)
    : null;

  const commentsError = commentsQuery.isError
    ? commentsQuery.error instanceof Error
      ? commentsQuery.error.message
      : "Failed to load comments."
    : null;

  const loading =
    Boolean(id) &&
    (discussionQuery.isPending ||
      (discussionQuery.isSuccess &&
        !commentsQuery.data &&
        commentsQuery.isPending));

  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [postAvatarFailed, setPostAvatarFailed] = useState(false);

  const postMutation = useMutation({
    mutationFn: (body: string) => createDiscussionComment(id!, body),
    onSuccess: () => {
      setReplyBody("");
      if (!id) return;
      const pageResult = queryClient.getQueryData<DiscussionCommentsPageResult>([
        "discussion",
        "comments",
        id,
        commentsPage,
      ]);
      const disc = queryClient.getQueryData<Discussion>(["discussion", "detail", id]);
      const prevTotal =
        pageResult?.total ??
        disc?.commentsCount ??
        disc?.commentCount ??
        disc?.replies ??
        0;
      const newTotal = prevTotal + 1;
      setCommentsPage(
        Math.max(1, Math.ceil(newTotal / DISCUSSION_COMMENTS_PAGE_SIZE))
      );
      queryClient.setQueryData<Discussion>(["discussion", "detail", id], (prev) => {
        if (!prev) return prev;
        const prevCount =
          prev.commentsCount ?? prev.commentCount ?? prev.replies ?? 0;
        const nextCount = prevCount + 1;
        return {
          ...prev,
          commentsCount: nextCount,
          commentCount: nextCount,
          replies: nextCount,
        };
      });
      void queryClient.invalidateQueries({ queryKey: ["discussion", "comments", id] });
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: (e: unknown) => {
      console.error(e);
      setReplyError(e instanceof Error ? e.message : "Failed to post reply.");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing discussion id");
      const current = queryClient.getQueryData<Discussion>(["discussion", "detail", id]);
      return current?.likedByMe ? unlikeDiscussion(id) : likeDiscussion(id);
    },
    onSuccess: (data) => {
      if (!id) return;
      queryClient.setQueryData<Discussion>(["discussion", "detail", id], (prev) =>
        prev ? { ...prev, likeCount: data.likeCount, likedByMe: data.likedByMe } : prev
      );
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: () => {
      if (id) void queryClient.invalidateQueries({ queryKey: ["discussion", "detail", id] });
    },
  });

  const posting = postMutation.isPending;

  const handlePostReply = () => {
    const body = replyBody.trim();
    if (!body || !id) return;
    setReplyError(null);
    postMutation.mutate(body);
  };

  const handleLikeClick = () => {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to like posts.",
        from: `${location.pathname}${location.search}`,
      };
      navigate("/login", { state });
      return;
    }
    if (!id || likeMutation.isPending) return;
    likeMutation.mutate();
  };

  const loadComments = () => {
    void commentsQuery.refetch();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setCommentsPage(1);
  }, [id]);

  useEffect(() => {
    if (!id || !discussionQuery.isSuccess || !discussion) return;
    let cancelled = false;
    const run = async () => {
      try {
        const res = user
          ? await recordDiscussionView(id)
          : await recordDiscussionView(id, { anonymousId: getOrCreateAnonymousViewerId() });
        if (cancelled) return;
        queryClient.setQueryData<Discussion>(["discussion", "detail", id], (prev) =>
          prev ? { ...prev, views: res.views } : prev
        );
        if (res.recorded) {
          void queryClient.invalidateQueries({ queryKey: ["discussions"] });
        }
      } catch {
        /* view registration is best-effort */
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run on identity keys only; `discussion`/`user` objects would over-trigger view recording
  }, [id, discussionQuery.isSuccess, discussion?.id, user?.id, queryClient]);

  useEffect(() => {
    setPostAvatarFailed(false);
  }, [discussion?.id, user?.id, user?.avatarUrl]);

  if (!id) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Community | ${COMPANY_NAME}`}
          description={`Discussions on ${COMPANY_NAME}.`}
          path="/community"
          noindex
        />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Invalid post ID.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Discussion | ${COMPANY_NAME}`}
          description={`Community discussion on ${COMPANY_NAME}.`}
          path={`/discussion/${id ?? ""}`}
        />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (discussionError || !discussion) {
    return (
      <div className="min-h-screen bg-background">
        <PageMeta
          title={`Discussion | ${COMPANY_NAME}`}
          description={discussionError ?? "Discussion not found."}
          path={`/discussion/${id ?? ""}`}
          noindex
        />
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">{discussionError ?? "Post not found."}</p>
          <button
            onClick={() => navigate("/community")}
            className="mt-4 font-medium text-primary hover:underline"
          >
            Back to Community
          </button>
        </div>
      </div>
    );
  }

  const authorDisplay = getDiscussionAuthorDisplay(discussion.author);
  const authorId = getDiscussionAuthorId(discussion.author);
  const description =
    discussion.content ??
    discussion.description ??
    discussion.excerpt ??
    discussion.title;
  const avatarSrc = resolveDiscussionAvatarSrc(discussion.author, user);
  const showPostAvatar = Boolean(avatarSrc?.trim()) && !postAvatarFailed;
  const initials = getDiscussionAuthorInitials(authorDisplay);

  const discussionSnippet =
    typeof description === "string"
      ? `${description.trim().slice(0, 160)}${description.trim().length > 160 ? "…" : ""}`
      : `${discussion.title} — ${COMPANY_NAME} community`;

  const repliesTotal =
    commentsQuery.data?.total ??
    discussion.commentCount ??
    discussion.commentsCount ??
    discussion.replies ??
    0;
  const commentsPageSize =
    commentsQuery.data?.limit ?? DISCUSSION_COMMENTS_PAGE_SIZE;
  const commentsTotalPages = commentsQuery.data?.totalPages ?? 1;
  const commentsRange =
    repliesTotal === 0
      ? null
      : {
          start: (commentsPage - 1) * commentsPageSize + 1,
          end: Math.min(commentsPage * commentsPageSize, repliesTotal),
        };

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={`${discussion.title} | ${COMPANY_NAME}`}
        description={discussionSnippet}
        path={`/discussion/${id}`}
        image={avatarSrc}
        ogType="article"
      />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="overflow-hidden rounded-2xl border bg-card">
          <div className="border px-6 py-4">
            <button
              onClick={() => {
                if (authorId) navigate(`/user/${encodeURIComponent(authorId)}`);
              }}
              className="group mb-4 flex w-full items-center gap-3 text-left transition-opacity hover:opacity-80"
            >
              {showPostAvatar ? (
                <img
                  src={avatarSrc!}
                  alt={authorDisplay}
                  className="size-10 rounded-full object-cover transition-all group-hover:ring-2 group-hover:ring-primary"
                  onError={() => setPostAvatarFailed(true)}
                />
              ) : (
                <div
                  className="flex size-10 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/70 transition-all group-hover:ring-2 group-hover:ring-primary"
                  aria-label={`Avatar for ${authorDisplay}`}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground transition-colors group-hover:text-primary">
                  {authorDisplay}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(discussion.createdAt)}
                </p>
              </div>
            </button>

            <div className="mb-4 flex gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">
                <DiscussionCategoryIcon
                  categoryKey={discussion.category ?? "general"}
                  className="size-3.5 opacity-90"
                />
                {categoryLabel(discussion.category)}
              </span>
              {discussion.isPinned && (
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  Pinned
                </span>
              )}
            </div>
          </div>

          <div className="p-6">
            <h1 className="mb-4 text-3xl font-bold text-foreground">
              {discussion.title}
            </h1>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex items-center gap-6 border px-6 py-4">
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={likeMutation.isPending}
              aria-pressed={Boolean(discussion.likedByMe)}
              aria-label={discussion.likedByMe ? "Unlike post" : "Like post"}
              className={cn(
                "flex items-center gap-1.5 rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60",
                discussion.likedByMe && "text-rose-500 hover:text-rose-500"
              )}
            >
              <Heart
                className={cn("size-4 shrink-0", discussion.likedByMe && "fill-current")}
              />
              <span
                className="text-xs font-medium tabular-nums"
                title={String(discussion.likeCount ?? 0)}
              >
                {formatCompactCount(discussion.likeCount ?? 0)}
              </span>
            </button>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Reply className="size-4 shrink-0" />
              <span
                className="text-xs font-medium tabular-nums"
                title={String(
                  discussion.commentCount ??
                    discussion.commentsCount ??
                    discussion.replies ??
                    0
                )}
              >
                {formatCompactCount(
                  discussion.commentCount ??
                    discussion.commentsCount ??
                    discussion.replies ??
                    0
                )}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="size-4 shrink-0" />
              <span
                className="text-xs font-medium tabular-nums"
                title={String(discussion.views ?? 0)}
              >
                {formatCompactCount(discussion.views ?? 0)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="mb-6 text-xl font-bold text-foreground">
            Replies ({repliesTotal})
          </h2>

          {commentsError && (
            <div className="mb-4 text-sm text-neutral-400">
              {commentsError}
              <button
                type="button"
                onClick={loadComments}
                className="ml-2 text-primary hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!commentsError && repliesTotal === 0 && (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          )}

          {!commentsError && repliesTotal > 0 && (
            <div className="space-y-4">
              {(comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className="rounded-2xl border bg-card p-6"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <CommentAuthorAvatar author={c.author} />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {getDiscussionAuthorDisplay(c.author)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(c.createdAt)}
                      </p>
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!commentsError && repliesTotal > 0 && (
            <div className="mt-6 space-y-3">
              {commentsRange && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing {commentsRange.start}–{commentsRange.end} of{" "}
                  {repliesTotal}
                </p>
              )}
              <RaceHistoryPagination
                page={commentsPage}
                totalPages={commentsTotalPages}
                onPageChange={setCommentsPage}
                disabled={commentsQuery.isFetching}
              />
            </div>
          )}

          <div className="mt-8 rounded-2xl border bg-card p-6">
            {replyError && (
              <p className="mb-3 text-sm text-neutral-400">{replyError}</p>
            )}
            <textarea
              className="w-full resize-none rounded-lg border bg-secondary px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              rows={4}
              placeholder="Write a reply…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={posting}
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handlePostReply}
                disabled={!replyBody.trim() || posting}
                className="rounded-lg bg-primary px-6 py-2 font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
              >
                {posting ? "Posting…" : "Post Reply"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
