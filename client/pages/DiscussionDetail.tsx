import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Heart, Reply, Eye } from "lucide-react";
import {
  getDiscussion,
  getDiscussionComments,
  createDiscussionComment,
  DISCUSSION_CATEGORIES,
  ApiError,
  resolveApiUrl,
  type Discussion,
  type DiscussionComment,
} from "@/lib/api";
import { timeAgo, getDiscussionAuthorDisplay, getDiscussionAuthorInitials } from "@/lib/utils";

function userNameToSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function categoryLabel(value: string) {
  return DISCUSSION_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export default function DiscussionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [discussion, setDiscussion] = useState<Discussion | null>(null);
  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [discussionError, setDiscussionError] = useState<string | null>(null);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!id) return;
    try {
      setCommentsError(null);
      const data = await getDiscussionComments(id);
      setComments(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCommentsError(e instanceof Error ? e.message : "Failed to load comments.");
      setComments([]);
    }
  }, [id]);

  const handlePostReply = async () => {
    const body = replyBody.trim();
    if (!body || !id) return;
    try {
      setReplyError(null);
      setPosting(true);
      const created = await createDiscussionComment(id, body);
      setReplyBody("");
      setComments((prev) => [...(prev ?? []), created]);
    } catch (e) {
      console.error(e);
      setReplyError(e instanceof Error ? e.message : "Failed to post reply.");
    } finally {
      setPosting(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setDiscussionError("Invalid post ID");
      setDiscussion(null);
      setComments([]);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setDiscussionError(null);
      setCommentsError(null);

      let disc: Discussion | null = null;
      try {
        disc = await getDiscussion(id);
      } catch (e) {
        if (cancelled) return;
        const isApi = e instanceof ApiError;
        const is404 = isApi && e.status === 404;
        const isNetwork = isApi && e.status === 0;
        setDiscussion(null);
        setComments([]);
        setDiscussionError(
          is404
            ? "Discussion not found."
            : isNetwork
              ? "Failed to load discussion."
              : "Failed to load discussion."
        );
        setLoading(false);
        return;
      }

      if (cancelled) return;
      if (disc) {
        setDiscussion(disc);
        setDiscussionError(null);
      }

      let cmts: DiscussionComment[] = [];
      try {
        const raw = await getDiscussionComments(id);
        cmts = Array.isArray(raw) ? raw : (raw as { comments?: DiscussionComment[] })?.comments ?? [];
        setCommentsError(null);
      } catch (e) {
        if (!cancelled) setCommentsError(e instanceof Error ? e.message : "Failed to load comments.");
      }
      if (!cancelled) {
        setComments(cmts);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

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
  const description =
    discussion.content ??
    discussion.description ??
    discussion.excerpt ??
    discussion.title;
  const avatarUrl =
    discussion.author &&
    typeof discussion.author === "object" &&
    "avatarUrl" in discussion.author &&
    typeof (discussion.author as any).avatarUrl === "string"
      ? ((discussion.author as any).avatarUrl as string)
      : null;
  const avatarSrc = resolveApiUrl(avatarUrl);
  const hasAvatar = !!avatarSrc && avatarSrc.trim().length > 0;
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
              onClick={() => navigate(`/user/${userNameToSlug(authorDisplay)}`)}
              className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity group text-left"
            >
              {hasAvatar ? (
                <img
                  src={avatarSrc!}
                  alt={authorDisplay}
                  className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary transition-all"
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
              <span className="inline-block px-2.5 py-1 bg-secondary text-foreground rounded-full text-xs font-medium">
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
                    {(() => {
                      const authorLabel = getDiscussionAuthorDisplay(c.author);
                      const avatarUrl =
                        c.author &&
                        typeof c.author === "object" &&
                        "avatarUrl" in c.author &&
                        typeof (c.author as any).avatarUrl === "string"
                          ? ((c.author as any).avatarUrl as string)
                          : null;
                      const avatarSrc = resolveApiUrl(avatarUrl);
                      const hasAvatar = !!avatarSrc && avatarSrc.trim().length > 0;
                      const initials = getDiscussionAuthorInitials(authorLabel);
                      return (
                        <>
                          <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 text-xs font-medium flex-shrink-0">
                            {hasAvatar ? (
                              <img
                                src={avatarSrc!}
                                alt={authorLabel}
                                className="w-9 h-9 rounded-full object-cover"
                              />
                            ) : (
                              initials
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {authorLabel}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {timeAgo(c.createdAt)}
                            </p>
                          </div>
                        </>
                      );
                    })()}
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
