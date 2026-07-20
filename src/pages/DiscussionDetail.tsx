import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getDiscussion,
  getDiscussionComments,
  createDiscussionComment,
  DISCUSSION_COMMENTS_PAGE_SIZE,
  ApiError,
  resolveDiscussionAvatarSrc,
  getDiscussionAuthorId,
  likeDiscussion,
  unlikeDiscussion,
  updateDiscussion,
  deleteDiscussion,
  type Discussion,
  type DiscussionComment,
} from "@/lib/api";
import type { AuthRedirectState } from "@/auth/authRedirect";
import { AUTH_PATHS } from "@/config/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getDiscussionAuthorDisplay,
  getDiscussionAuthorInitials,
} from "@/lib/utils";
import PageMeta from "@/components/PageMeta";
import { COMPANY_NAME } from "@/lib/siteMeta";
import { Button } from "@/components/ui/button";
import { appOutlineButtonClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import DiscussionPostCard from "@/pages/discussion/DiscussionPostCard";
import DiscussionCommentList from "@/pages/discussion/DiscussionCommentList";
import DiscussionReplyForm from "@/pages/discussion/DiscussionReplyForm";
import DiscussionReplyModal from "@/pages/discussion/DiscussionReplyModal";
import DiscussionReplyFab from "@/pages/discussion/DiscussionReplyFab";
import DiscussionDetailSkeleton from "@/pages/discussion/DiscussionDetailSkeleton";
import DiscussionEditModal from "@/pages/discussion/DiscussionEditModal";
import DiscussionDeleteDialog from "@/pages/discussion/DiscussionDeleteDialog";
import DiscussionOriginalPostModal from "@/pages/discussion/DiscussionOriginalPostModal";
import {
  normalizeDiscussionReplyBody,
  DISCUSSION_REPLY_MAX_LENGTH,
} from "@/pages/discussion/discussionReplyUtils";
import { useRecordDiscussionView } from "@/hooks/useRecordDiscussionView";

const COMMUNITY_PATH = "/community";
const COMMENTS_SORT = "desc" as const;
const DEFAULT_REPLY_BAR_HEIGHT = 120;

function discussionLoadErrorMessage(e: unknown): string {
  if (e instanceof ApiError && e.status === 404) return "Discussion not found.";
  if (e instanceof ApiError && e.status === 0)
    return "Failed to load discussion.";
  return "Failed to load discussion.";
}

function discussionPath(id: string) {
  return `/discussion/${id}`;
}

function CommunityBackLink() {
  return (
    <Link
      to={COMMUNITY_PATH}
      className="inline-flex items-center gap-1.5 font-apex-body text-sm text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
    >
      <ChevronLeft className="size-4 shrink-0" aria-hidden />
      Community
    </Link>
  );
}

function PageShell({
  children,
  replyBarPinned,
  replyBarHeight,
}: {
  children: ReactNode;
  replyBarPinned?: boolean;
  replyBarHeight?: number;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8",
        replyBarPinned && "lg:pb-[calc(var(--reply-bar-h,7.5rem)+0.5rem)]",
      )}
      style={
        replyBarPinned && replyBarHeight != null
          ? ({ "--reply-bar-h": `${replyBarHeight}px` } as React.CSSProperties)
          : undefined
      }
    >
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <CommunityBackLink />
        {children}
      </div>
    </div>
  );
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
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyBarPinned, setReplyBarPinned] = useState(true);
  const [replyBarHeight, setReplyBarHeight] = useState(
    DEFAULT_REPLY_BAR_HEIGHT,
  );
  const dockAnchorRef = useRef<HTMLDivElement>(null);

  const handleDockMetricsChange = useCallback(
    (metrics: { pinned: boolean; barHeight: number }) => {
      setReplyBarPinned(metrics.pinned);
      setReplyBarHeight(metrics.barHeight);
    },
    [],
  );

  const commentsQuery = useQuery({
    queryKey: ["discussion", "comments", id ?? "", commentsPage, COMMENTS_SORT],
    queryFn: () =>
      getDiscussionComments(id!, {
        page: commentsPage,
        limit: DISCUSSION_COMMENTS_PAGE_SIZE,
        sort: COMMENTS_SORT,
      }),
    enabled: Boolean(id),
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

  const loading = Boolean(id) && discussionQuery.isPending;

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
      setReplyModalOpen(false);
      if (!id) return;
      setCommentsPage(1);
      queryClient.setQueryData<Discussion>(
        ["discussion", "detail", id],
        (prev) => {
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
        },
      );
      void queryClient.invalidateQueries({
        queryKey: ["discussion", "comments", id],
      });
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      requestAnimationFrame(() => {
        document
          .getElementById("replies-heading")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    },
    onError: (e: unknown) => {
      console.error(e);
      setReplyError(e instanceof Error ? e.message : "Failed to post reply.");
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("Missing discussion id");
      const current = queryClient.getQueryData<Discussion>([
        "discussion",
        "detail",
        id,
      ]);
      return current?.likedByMe ? unlikeDiscussion(id) : likeDiscussion(id);
    },
    onSuccess: (data) => {
      if (!id) return;
      queryClient.setQueryData<Discussion>(
        ["discussion", "detail", id],
        (prev) =>
          prev
            ? {
                ...prev,
                likeCount: data.likeCount,
                likedByMe: data.likedByMe,
              }
            : prev,
      );
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: () => {
      if (id)
        void queryClient.invalidateQueries({
          queryKey: ["discussion", "detail", id],
        });
    },
  });

  const posting = postMutation.isPending;

  const deleteMutation = useMutation({
    mutationFn: () => deleteDiscussion(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
      setDeleteOpen(false);
      navigate(COMMUNITY_PATH);
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
      setEditError(
        e instanceof ApiError ? e.message : "Could not save changes.",
      );
    },
  });

  const handleOpenReplyModal = () => {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to reply.",
        from: `${location.pathname}${location.search}`,
      };
      navigate(AUTH_PATHS.login, { state });
      return;
    }
    setReplyError(null);
    setReplyModalOpen(true);
  };

  const handleCloseReplyModal = () => {
    if (posting) return;
    setReplyModalOpen(false);
    setReplyError(null);
  };

  const handlePostReply = () => {
    const body = normalizeDiscussionReplyBody(replyBody);
    if (!body || !id) {
      if (replyBody.trim()) setReplyError("Reply cannot be empty.");
      return;
    }
    if (body.length > DISCUSSION_REPLY_MAX_LENGTH) {
      setReplyError(
        `Reply must be ${DISCUSSION_REPLY_MAX_LENGTH} characters or fewer.`,
      );
      return;
    }
    setReplyError(null);
    postMutation.mutate(body);
  };

  const handleLikeClick = () => {
    if (!user) {
      const state: AuthRedirectState = {
        message: "Sign in to like posts.",
        from: `${location.pathname}${location.search}`,
      };
      navigate(AUTH_PATHS.login, { state });
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

  useRecordDiscussionView(id, {
    enabled: Boolean(id && discussionQuery.isSuccess && discussion),
  });

  useEffect(() => {
    setPostAvatarFailed(false);
  }, [discussion?.id, user?.id, user?.avatarUrl]);

  useEffect(() => {
    if (!editOpen || !discussion) return;
    setEditTitle(discussion.title);
    setEditDescription(
      (discussion.content ?? discussion.description ?? "").trim() || "",
    );
    setEditError(null);
  }, [editOpen, discussion]);

  if (!id) {
    return (
      <>
        <PageMeta
          title={`Community | ${COMPANY_NAME}`}
          description={`Discussions on ${COMPANY_NAME}.`}
          path={COMMUNITY_PATH}
          noindex
        />
        <PageShell>
          <p className="font-apex-body text-sm text-apex-on-surface-variant">
            Invalid post ID.
          </p>
        </PageShell>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <PageMeta
          title={`Discussion | ${COMPANY_NAME}`}
          description={`Community discussion on ${COMPANY_NAME}.`}
          path={discussionPath(id)}
        />
        <PageShell>
          <DiscussionDetailSkeleton />
        </PageShell>
      </>
    );
  }

  if (discussionError || !discussion) {
    return (
      <>
        <PageMeta
          title={`Discussion | ${COMPANY_NAME}`}
          description={discussionError ?? "Discussion not found."}
          path={discussionPath(id)}
          noindex
        />
        <PageShell>
          <div className="rounded-xl border border-dashed border-apex-outline-variant/20 bg-apex-surface-container-low px-6 py-10 text-center">
            <p className="font-apex-body text-sm text-apex-on-surface-variant">
              {discussionError ?? "Post not found."}
            </p>
            <Button
              type="button"
              variant="outline"
              className={cn("mt-5", appOutlineButtonClassName)}
              asChild
            >
              <Link to={COMMUNITY_PATH}>Back to Community</Link>
            </Button>
          </div>
        </PageShell>
      </>
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
    discussion.wasEdited || discussion.editedAt || discussion.originalBody,
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
    <>
      <PageMeta
        title={`${discussion.title} | ${COMPANY_NAME}`}
        description={discussionSnippet}
        path={discussionPath(id)}
        image={avatarSrc}
        ogType="article"
      />
      <PageShell
        replyBarPinned={replyBarPinned}
        replyBarHeight={replyBarHeight}
      >
        <DiscussionPostCard
          discussion={discussion}
          authorDisplay={authorDisplay}
          authorId={authorId}
          description={description}
          avatarSrc={avatarSrc}
          showPostAvatar={showPostAvatar}
          initials={initials}
          isOwner={isOwner}
          alreadyEdited={alreadyEdited}
          showEditedBadge={showEditedBadge}
          onPostAvatarError={() => setPostAvatarFailed(true)}
          onLikeClick={handleLikeClick}
          likePending={likeMutation.isPending}
          onEditClick={() => setEditOpen(true)}
          onDeleteClick={() => setDeleteOpen(true)}
          onOriginalClick={() => setOriginalOpen(true)}
        />

        <DiscussionCommentList
          repliesTotal={repliesTotal}
          comments={comments}
          commentsError={commentsError}
          commentsPage={commentsPage}
          commentsTotalPages={commentsTotalPages}
          commentsFetching={commentsQuery.isFetching}
          commentsRange={commentsRange}
          onRetryComments={loadComments}
          onPageChange={setCommentsPage}
          dockAnchorRef={dockAnchorRef}
        />

        <DiscussionReplyForm
          dockAnchorRef={dockAnchorRef}
          onDockMetricsChange={handleDockMetricsChange}
          replyBody={replyBody}
          replyError={replyError}
          posting={posting}
          onReplyBodyChange={setReplyBody}
          onPostReply={handlePostReply}
        />
      </PageShell>

      <DiscussionReplyFab onClick={handleOpenReplyModal} />

      <DiscussionReplyModal
        open={replyModalOpen}
        onClose={handleCloseReplyModal}
        replyBody={replyBody}
        replyError={replyError}
        posting={posting}
        onReplyBodyChange={setReplyBody}
        onPostReply={handlePostReply}
      />

      <DiscussionEditModal
        open={editOpen}
        editTitle={editTitle}
        editDescription={editDescription}
        editError={editError}
        saving={editMutation.isPending}
        onClose={() => setEditOpen(false)}
        onSave={() => editMutation.mutate()}
        onTitleChange={setEditTitle}
        onDescriptionChange={setEditDescription}
      />

      <DiscussionOriginalPostModal
        open={originalOpen}
        discussion={discussion}
        onClose={() => setOriginalOpen(false)}
      />

      <DiscussionDeleteDialog
        open={deleteOpen}
        deleting={deleteMutation.isPending}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteMutation.mutate()}
      />
    </>
  );
}
