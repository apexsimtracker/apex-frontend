import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Reply, Eye } from "lucide-react";
import {
  getDiscussion,
  getDiscussionComments,
  createDiscussionComment,
  DISCUSSION_CATEGORIES,
  ApiError,
  resolveDiscussionAvatarSrc,
  getDiscussionAuthorId,
  type Discussion,
  type DiscussionComment,
} from "@/lib/api";
import { DiscussionCategoryIcon } from "@/components/DiscussionCategoryIcon";
import { useAuth } from "@/contexts/AuthContext";
import { timeAgo, getDiscussionAuthorDisplay, getDiscussionAuthorInitials } from "@/lib/utils";

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
        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-medium flex-shrink-0">
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
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const discussionQuery = useQuery({
    queryKey: ["discussion", "detail", id ?? ""],
    queryFn: () => getDiscussion(id!),
    enabled: Boolean(id),
    retry: (failureCount, err) =>
      !(err instanceof ApiError && err.status === 404),
  });

  const commentsQuery = useQuery({
    queryKey: ["discussion", "comments", id ?? ""],
    queryFn: async () => {
      const raw = await getDiscussionComments(id!);
      return Array.isArray(raw)
        ? raw
        : (raw as { comments?: DiscussionComment[] })?.comments ?? [];
    },
    enabled: Boolean(id) && discussionQuery.isSuccess,
  });

  const discussion = discussionQuery.data ?? null;
  const comments: DiscussionComment[] = commentsQuery.data ?? [];

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
      (discussionQuery.isSuccess && commentsQuery.isPending));

  const [replyBody, setReplyBody] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const [postAvatarFailed, setPostAvatarFailed] = useState(false);

  const postMutation = useMutation({
    mutationFn: (body: string) => createDiscussionComment(id!, body),
    onSuccess: (created) => {
      setReplyBody("");
      queryClient.setQueryData<DiscussionComment[]>(
        ["discussion", "comments", id ?? ""],
        (prev) => [...(prev ?? []), created]
      );
      void queryClient.invalidateQueries({ queryKey: ["discussions"] });
    },
    onError: (e: unknown) => {
      console.error(e);
      setReplyError(e instanceof Error ? e.message : "Failed to post reply.");
    },
  });

  const posting = postMutation.isPending;

  const handlePostReply = () => {
    const body = replyBody.trim();
    if (!body || !id) return;
    setReplyError(null);
    postMutation.mutate(body);
  };

  const loadComments = () => {
    void commentsQuery.refetch();
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    setPostAvatarFailed(false);
  }, [discussion?.id, user?.id, user?.avatarUrl]);

  if (!id) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Invalid post ID.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">Loading discussion...</p>
        </div>
      </div>
    );
  }

  if (discussionError || !discussion) {
    return (
      <div className="bg-background min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <p className="text-muted-foreground">{discussionError ?? "Post not found."}</p>
          <button
            onClick={() => navigate("/community")}
            className="mt-4 text-primary hover:underline font-medium"
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

  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>

        <div className="bg-card rounded-2xl border border overflow-hidden">
          <div className="px-6 py-4 border-b border">
            <button
              onClick={() => {
                if (authorId) navigate(`/user/${encodeURIComponent(authorId)}`);
              }}
              className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity group text-left"
            >
              {showPostAvatar ? (
                <img
                  src={avatarSrc!}
                  alt={authorDisplay}
                  className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary transition-all"
                  onError={() => setPostAvatarFailed(true)}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-sm font-medium group-hover:ring-2 group-hover:ring-primary transition-all"
                  aria-label={`Avatar for ${authorDisplay}`}
                >
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {authorDisplay}
                </p>
                <p className="text-xs text-muted-foreground">
                  {timeAgo(discussion.createdAt)}
                </p>
              </div>
            </button>

            <div className="flex gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-foreground rounded-full text-xs font-medium">
                <DiscussionCategoryIcon
                  categoryKey={discussion.category ?? "general"}
                  className="w-3.5 h-3.5 opacity-90"
                />
                {categoryLabel(discussion.category)}
              </span>
              {discussion.isPinned && (
                <span className="inline-block px-2.5 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                  Pinned
                </span>
              )}
            </div>
          </div>

          <div className="px-6 py-6">
            <h1 className="text-3xl font-bold text-foreground mb-4">
              {discussion.title}
            </h1>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {description}
            </p>
          </div>

          <div className="px-6 py-4 border-t border flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium">
                {discussion.likeCount ?? discussion.views ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Reply className="w-4 h-4" />
              <span className="text-xs font-medium">
                {discussion.commentCount ??
                  discussion.commentsCount ??
                  discussion.replies ??
                  0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="w-4 h-4" />
              <span className="text-xs font-medium">
                {discussion.views ?? 0}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold text-foreground mb-6">
            Replies ({(comments ?? []).length})
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

          {!commentsError && (comments ?? []).length === 0 && (
            <p className="text-muted-foreground text-sm">No comments yet.</p>
          )}

          {(comments ?? []).length > 0 && (
            <div className="space-y-4">
              {(comments ?? []).map((c) => (
                <div
                  key={c.id}
                  className="bg-card rounded-2xl border border p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
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
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {c.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-card rounded-2xl border border p-6">
            {replyError && (
              <p className="mb-3 text-sm text-neutral-400">{replyError}</p>
            )}
            <textarea
              className="w-full px-4 py-3 bg-secondary border border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
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
                className="px-6 py-2 bg-primary text-primary-foreground disabled:opacity-50 rounded-lg font-medium transition-colors hover:opacity-90"
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
