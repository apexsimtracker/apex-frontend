import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ChevronRight,
  Heart,
  MessageCircle,
  Reply,
  Eye,
  MoreHorizontal,
  Pencil,
  Pin,
  Trash2,
} from "lucide-react";
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
  updateDiscussion,
  deleteDiscussion,
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
import { Button } from "@/components/ui/button";
import {
  BaseAlertDialog,
  BaseModal,
} from "@/components/ui/base-modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SkeletonBlock } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const ACCENT_RED = "rgb(240, 28, 28)";

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
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [originalOpen, setOriginalOpen] = useState(false);

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

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscussion(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setDeleteOpen(false);
      navigate("/community");
    },
    onError: (e: unknown) => {
      console.error(e);
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      updateDiscussion(id!, {
        title: editTitle.trim(),
        description: editDescription.trim(),
      }),
    onSuccess: (data) => {
      if (!id) return;
      queryClient.setQueryData<Discussion>(["discussion", "detail", id], data);
      setEditOpen(false);
      setEditError(null);
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: (e: unknown) => {
      setEditError(e instanceof ApiError ? e.message : "Could not save changes.");
    },
  });

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

  useEffect(() => {
    if (!editOpen || !discussion) return;
    setEditTitle(discussion.title);
    setEditDescription(
      (discussion.content ?? discussion.description ?? "").trim() || ""
    );
    setEditError(null);
  }, [editOpen, discussion]);

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
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/6 bg-card/20 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-lg transition-colors hover:border-white/10 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
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
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/6 bg-card/20 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-lg transition-colors hover:border-white/10 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-white/6 bg-card/20 shadow-none backdrop-blur-lg">
            <div className="h-1 bg-gradient-to-r from-[rgb(240,28,28)]/90 via-[rgb(240,28,28)]/35 to-transparent" />
            <div className="flex gap-3 border-b border-white/6 px-5 py-4 sm:px-6">
              <SkeletonBlock className="size-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2 pt-1">
                <SkeletonBlock className="h-4 w-32 rounded" />
                <SkeletonBlock className="h-3 w-24 rounded" />
              </div>
            </div>
            <div className="space-y-3 px-5 py-6 sm:px-6">
              <SkeletonBlock className="h-8 max-w-md w-full rounded-lg" />
              <SkeletonBlock className="h-4 w-full rounded" />
              <SkeletonBlock className="h-4 w-full rounded" />
              <SkeletonBlock className="h-4 w-3/4 rounded" />
            </div>
            <div className="flex gap-4 border-t border-white/6 bg-white/[0.02] px-5 py-4 sm:px-6">
              <SkeletonBlock className="h-9 w-20 rounded-lg" />
              <SkeletonBlock className="h-9 w-20 rounded-lg" />
              <SkeletonBlock className="h-9 w-20 rounded-lg" />
            </div>
          </div>
          <div className="mt-10 space-y-4">
            <SkeletonBlock className="h-7 w-48 rounded" />
            <SkeletonBlock className="h-28 w-full rounded-xl" />
            <SkeletonBlock className="h-28 w-full rounded-xl" />
          </div>
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
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/6 bg-card/20 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-lg transition-colors hover:border-white/10 hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
          </div>
          <div className="rounded-xl border border-dashed border-white/12 bg-card/15 px-6 py-10 text-center backdrop-blur-sm">
            <p className="text-sm text-muted-foreground">
              {discussionError ?? "Post not found."}
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-5 border-white/10 bg-card/30"
              onClick={() => navigate("/community")}
            >
              Back to Community
            </Button>
          </div>
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

  const isOwner =
    Boolean(user) && getDiscussionAuthorId(discussion.author) === user.id;
  const alreadyEdited = Boolean(discussion.editedAt ?? discussion.wasEdited);
  const showEditedBadge = Boolean(
    discussion.wasEdited || discussion.editedAt || discussion.originalBody
  );

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
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/6 bg-card/20 px-3 py-2 text-sm font-medium text-muted-foreground backdrop-blur-lg transition-colors hover:border-white/10 hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Back
          </button>
        </div>

        <article className="relative overflow-hidden rounded-xl border border-white/6 bg-card/20 shadow-none backdrop-blur-lg">
          <div
            className="h-1 bg-gradient-to-r from-[rgb(240,28,28)]/90 via-[rgb(240,28,28)]/35 to-transparent"
            aria-hidden
          />
          {isOwner && (
            <div className="absolute right-2 top-5 z-10 sm:right-3 sm:top-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    aria-label="Post options"
                  >
                    <MoreHorizontal className="size-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[10rem]">
                  {!alreadyEdited && (
                    <DropdownMenuItem
                      onClick={() => {
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="mr-2 size-4" />
                      Edit post
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <div className="border-b border-white/6 px-5 pb-5 pt-6 sm:px-6 sm:pb-6 sm:pt-7">
            <button
              type="button"
              onClick={() => {
                if (authorId) navigate(`/user/${encodeURIComponent(authorId)}`);
              }}
              className="group mb-5 flex w-full items-center gap-3 text-left transition-opacity hover:opacity-90 sm:mb-6 sm:gap-4"
            >
              {showPostAvatar ? (
                <img
                  src={avatarSrc!}
                  alt={authorDisplay}
                  className="size-11 rounded-full object-cover ring-2 ring-white/5 transition-all group-hover:ring-[rgba(240,28,28,0.45)] sm:size-12"
                  onError={() => setPostAvatarFailed(true)}
                />
              ) : (
                <div
                  className="flex size-11 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white/80 ring-2 ring-white/5 transition-all group-hover:ring-[rgba(240,28,28,0.45)] sm:size-12 sm:text-base"
                  aria-label={`Avatar for ${authorDisplay}`}
                >
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground transition-colors group-hover:text-[rgb(240,28,28)]">
                  {authorDisplay}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                  {timeAgo(discussion.createdAt)}
                </p>
              </div>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-foreground/90">
                <DiscussionCategoryIcon
                  categoryKey={discussion.category ?? "general"}
                  className="size-3.5 text-white/70"
                />
                {categoryLabel(discussion.category)}
              </span>
              {discussion.isPinned && (
                <span
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
                  style={{
                    color: ACCENT_RED,
                    backgroundColor: "rgba(240, 28, 28, 0.06)",
                  }}
                >
                  <Pin className="size-3.5 shrink-0" aria-hidden />
                  Pinned
                </span>
              )}
              {showEditedBadge && (
                <button
                  type="button"
                  onClick={() => setOriginalOpen(true)}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted-foreground underline-offset-2 transition-colors hover:border-white/15 hover:bg-white/[0.07] hover:text-foreground hover:underline"
                >
                  Edited
                </button>
              )}
            </div>
          </div>

          <div className="px-5 py-6 sm:px-6 sm:py-8">
            <h1 className="mb-4 text-2xl font-bold leading-tight tracking-tight text-foreground sm:mb-5 sm:text-3xl sm:leading-tight">
              {discussion.title}
            </h1>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-white/6 bg-white/[0.02] px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
            <button
              type="button"
              onClick={handleLikeClick}
              disabled={likeMutation.isPending}
              aria-pressed={Boolean(discussion.likedByMe)}
              aria-label={discussion.likedByMe ? "Unlike post" : "Like post"}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium tabular-nums text-muted-foreground transition-colors hover:border-white/12 hover:bg-white/[0.06] hover:text-foreground disabled:opacity-60 sm:text-sm",
                discussion.likedByMe &&
                "border-rose-500/25 bg-rose-500/10 text-rose-500 hover:border-rose-500/35 hover:bg-rose-500/15 hover:text-rose-500"
              )}
            >
              <Heart
                className={cn(
                  "size-4 shrink-0",
                  discussion.likedByMe && "fill-current text-rose-500"
                )}
              />
              <span title={String(discussion.likeCount ?? 0)}>
                {formatCompactCount(discussion.likeCount ?? 0)}
              </span>
            </button>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium tabular-nums text-muted-foreground sm:text-sm">
              <MessageCircle className="size-4 shrink-0 opacity-80" aria-hidden />
              <span
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
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2 text-xs font-medium tabular-nums text-muted-foreground sm:text-sm">
              <Eye className="size-4 shrink-0 opacity-80" aria-hidden />
              <span title={String(discussion.views ?? 0)}>
                {formatCompactCount(discussion.views ?? 0)}
              </span>
            </div>
          </div>
        </article>

        <section className="mt-10 sm:mt-12" aria-labelledby="replies-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-8">
            <div className="flex items-center gap-2.5">
              <div
                className="flex size-9 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04]"
                aria-hidden
              >
                <Reply className="size-4 text-muted-foreground" />
              </div>
              <div>
                <h2
                  id="replies-heading"
                  className="text-lg font-semibold tracking-tight text-foreground sm:text-xl"
                >
                  Replies
                </h2>
                <p className="text-xs text-muted-foreground sm:text-sm">
                  {repliesTotal === 0
                    ? "Start the conversation below."
                    : `${repliesTotal} ${repliesTotal === 1 ? "reply" : "replies"}`}
                </p>
              </div>
            </div>
          </div>

          {commentsError && (
            <div className="mb-6 rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
              {commentsError}
              <button
                type="button"
                onClick={loadComments}
                className="ml-2 font-medium text-[rgb(240,28,28)] hover:underline"
              >
                Retry
              </button>
            </div>
          )}

          {!commentsError && repliesTotal === 0 && (
            <div className="mb-8 rounded-xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-12 text-center">
              <MessageCircle
                className="mx-auto mb-3 size-10 text-muted-foreground/35"
                strokeWidth={1.25}
                aria-hidden
              />
              <p className="text-sm font-medium text-foreground">No replies yet</p>
              <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                Be the first to share your thoughts.
              </p>
            </div>
          )}

          {!commentsError && repliesTotal > 0 && (
            <ul className="space-y-3 sm:space-y-4">
              {(comments ?? []).map((c) => (
                <li key={c.id}>
                  <div className="overflow-hidden rounded-xl border border-white/6 bg-card/15 backdrop-blur-sm">
                    <div className="border-l-2 border-l-[rgba(240,28,28,0.35)] bg-card/25 px-4 py-4 sm:px-5 sm:py-5">
                      <div className="mb-3 flex items-start gap-3 sm:mb-4 sm:gap-4">
                        <CommentAuthorAvatar author={c.author} />
                        <div className="min-w-0 flex-1 pt-0.5">
                          <p className="font-semibold leading-none text-foreground">
                            {getDiscussionAuthorDisplay(c.author)}
                          </p>
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {timeAgo(c.createdAt)}
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
                        {c.body}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!commentsError && repliesTotal > 0 && (
            <div className="mt-8 space-y-3">
              {commentsRange && (
                <p className="text-center text-xs text-muted-foreground">
                  Showing {commentsRange.start}–{commentsRange.end} of {repliesTotal}
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

          <div className="mt-10 overflow-hidden rounded-xl border border-white/6 bg-card/20 p-5 shadow-none backdrop-blur-lg sm:p-6">
            <div className="mb-4 flex items-center gap-2">
              <MessageCircle className="size-4 text-muted-foreground" aria-hidden />
              <span className="text-sm font-semibold text-foreground">Add a reply</span>
            </div>
            {replyError && (
              <p className="mb-3 text-sm text-destructive/90">{replyError}</p>
            )}
            <Textarea
              className="min-h-[120px] resize-y border-white/10 bg-secondary/40 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-[rgba(240,28,28,0.45)] focus-visible:ring-[rgba(240,28,28,0.25)]"
              rows={4}
              placeholder="Write a reply…"
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              disabled={posting}
            />
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handlePostReply}
                disabled={!replyBody.trim() || posting}
                className="min-w-[8.5rem] font-medium text-white"
                style={{ backgroundColor: ACCENT_RED }}
              >
                {posting ? "Posting…" : "Post reply"}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <BaseModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit discussion"
        size="md"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => editMutation.mutate()}
              disabled={
                editMutation.isPending ||
                editTitle.trim().length < 3 ||
                editDescription.trim().length < 10
              }
            >
              {editMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </>
        }
      >
          <div className="space-y-4">
            {editError && (
              <p className="text-sm text-destructive">{editError}</p>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={editMutation.isPending}
                className="border-white/10 bg-secondary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Body</label>
              <Textarea
                className="min-h-[160px] resize-y border-white/10 bg-secondary"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={editMutation.isPending}
              />
            </div>
          </div>
      </BaseModal>

      <BaseModal
        isOpen={originalOpen}
        onClose={() => setOriginalOpen(false)}
        title="Original post"
        size="md"
        footer={
          <Button type="button" variant="outline" onClick={() => setOriginalOpen(false)}>
            Close
          </Button>
        }
        bodyClassName="min-h-0 space-y-3 text-sm"
      >
            <p className="font-semibold text-foreground">
              {discussion.originalTitle ?? discussion.title}
            </p>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {discussion.originalBody ??
                discussion.content ??
                discussion.description ??
                ""}
            </p>
      </BaseModal>

      <BaseAlertDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete this discussion?"
        description="This removes the post from the community. You can’t undo this from the site; contact support if you deleted by mistake."
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={deleteMutation.isPending}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </Button>
          </>
        }
      />
    </div>
  );
}
