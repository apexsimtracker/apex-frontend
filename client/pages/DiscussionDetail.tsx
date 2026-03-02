import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, Heart, Reply, Eye } from "lucide-react";
import {
  getDiscussion,
  getDiscussions,
  getDiscussionComments,
  createDiscussionComment,
  DISCUSSION_CATEGORIES,
  type Discussion,
  type DiscussionComment,
} from "@/lib/api";
import { timeAgo } from "@/lib/utils";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop";

function getAuthorDisplay(author: unknown): string {
  if (typeof author === "string") return author.trim() || "Local Driver";
  if (author && typeof author === "object" && "name" in author) {
    const n = (author as { name?: unknown }).name;
    return typeof n === "string" ? (n.trim() || "Local Driver") : "Local Driver";
  }
  return "Local Driver";
}

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
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("404")) {
          // TODO: Remove when GET /api/community/discussions/:id exists — stopgap: fetch list and select by id
          try {
            const raw = await getDiscussions({ category: "all" });
            const list = Array.isArray(raw) ? raw : (raw as { discussions?: Discussion[] })?.discussions ?? [];
            disc = list.find((d) => d.id === id) ?? null;
          } catch {
            disc = null;
          }
        }
        if (!disc) {
          if (cancelled) return;
          setDiscussionError(msg.includes("404") ? "Post not found" : msg);
          setDiscussion(null);
          setComments([]);
          setLoading(false);
          return;
        }
      }

      if (cancelled) return;
      setDiscussion(disc);

      let cmts: DiscussionComment[] = [];
      try {
        const raw = await getDiscussionComments(id);
        cmts = Array.isArray(raw) ? raw : (raw as { comments?: DiscussionComment[] })?.comments ?? [];
        setCommentsError(null);
      } catch (e) {
        setCommentsError(e instanceof Error ? e.message : "Failed to load comments.");
      }
      setComments(cmts);
      setLoading(false);
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
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  if (discussionError === "Post not found" || !discussion) {
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
          <p className="text-muted-foreground">Post not found.</p>
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

  const authorDisplay = getAuthorDisplay(discussion.author);
  const description =
    discussion.description ?? discussion.excerpt ?? discussion.title;

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

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <button
              onClick={() => navigate(`/user/${userNameToSlug(authorDisplay)}`)}
              className="w-full flex items-center gap-3 mb-4 hover:opacity-80 transition-opacity group text-left"
            >
              <img
                src={discussion.authorAvatar ?? DEFAULT_AVATAR}
                alt={authorDisplay}
                className="w-10 h-10 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary transition-all"
              />
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

          <div className="px-6 py-4 border-t border-border flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Heart className="w-4 h-4" />
              <span className="text-xs font-medium">
                {discussion.likeCount ?? discussion.views ?? 0}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Reply className="w-4 h-4" />
              <span className="text-xs font-medium">
                {discussion.commentCount ?? discussion.replies ?? 0}
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
                  className="bg-card rounded-2xl border border-border p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">
                        {getAuthorDisplay(c.author)}
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

          <div className="mt-8 bg-card rounded-2xl border border-border p-6">
            {replyError && (
              <p className="mb-3 text-sm text-neutral-400">{replyError}</p>
            )}
            <textarea
              className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary resize-none"
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
