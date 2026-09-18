import type {
  InfiniteData,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import type { ActivityFeedPageResult } from "@/lib/api";

export type UgcModerationCacheSnapshot = Array<{
  queryKey: QueryKey;
  data: unknown;
}>;

const MODERATION_QUERY_ROOTS = new Set([
  "activity",
  "discussion",
  "discussions",
  "notifications",
  "profile",
  "sessions",
  "settings",
  "userProfile",
  "users",
]);

function isModerationQuery(queryKey: QueryKey): boolean {
  return (
    typeof queryKey[0] === "string" && MODERATION_QUERY_ROOTS.has(queryKey[0])
  );
}

export async function snapshotUgcModerationCache(
  queryClient: QueryClient,
): Promise<UgcModerationCacheSnapshot> {
  await queryClient.cancelQueries({
    predicate: (q) => isModerationQuery(q.queryKey),
  });
  return queryClient
    .getQueryCache()
    .getAll()
    .filter((q) => isModerationQuery(q.queryKey))
    .map((q) => ({ queryKey: q.queryKey, data: q.state.data }));
}

export function rollbackUgcModerationCache(
  queryClient: QueryClient,
  snapshot: UgcModerationCacheSnapshot,
): void {
  snapshot.forEach(({ queryKey, data }) => {
    queryClient.setQueryData(queryKey, data);
  });
}

export function invalidateAfterUgcModeration(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ["discussions"] });
  void queryClient.invalidateQueries({ queryKey: ["discussion"] });
  void queryClient.invalidateQueries({ queryKey: ["activity", "feed"] });
  void queryClient.invalidateQueries({ queryKey: ["users", "discover"] });
  void queryClient.invalidateQueries({ queryKey: ["profile"] });
  void queryClient.invalidateQueries({ queryKey: ["userProfile"] });
  void queryClient.invalidateQueries({ queryKey: ["notifications"] });
  void queryClient.invalidateQueries({
    queryKey: ["settings", "blocked-users"],
  });
  void queryClient.invalidateQueries({
    queryKey: ["settings", "hidden-content"],
  });
  void queryClient.invalidateQueries({ queryKey: ["sessions"] });
}

function authorIdFromUnknown(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Record<string, unknown>;
  if (typeof rec.id === "string" && rec.id.trim()) return rec.id.trim();
  return null;
}

function sessionAuthorId(session: Record<string, unknown>): string | null {
  if (typeof session.userId === "string" && session.userId.trim()) {
    return session.userId.trim();
  }
  if (typeof session.authorId === "string" && session.authorId.trim()) {
    return session.authorId.trim();
  }
  return authorIdFromUnknown(session.author);
}

function filterFeedItem(
  item: unknown,
  opts: { sessionId?: string; authorId?: string },
): unknown | null {
  if (!item || typeof item !== "object") return item;
  const rec = item as Record<string, unknown>;

  if (
    rec.type === "standalone" &&
    rec.session &&
    typeof rec.session === "object"
  ) {
    const session = rec.session as Record<string, unknown>;
    if (opts.sessionId && session.id === opts.sessionId) return null;
    if (opts.authorId && sessionAuthorId(session) === opts.authorId)
      return null;
    return rec;
  }

  if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
    const group = rec.group as { sessions?: unknown[]; authorId?: string };
    if (opts.authorId && group.authorId === opts.authorId) return null;
    if (!Array.isArray(group.sessions)) return rec;
    const sessions = group.sessions.filter((s) => {
      if (!s || typeof s !== "object") return true;
      const sess = s as Record<string, unknown>;
      if (opts.sessionId && sess.id === opts.sessionId) return false;
      if (opts.authorId && sessionAuthorId(sess) === opts.authorId)
        return false;
      return true;
    });
    if (sessions.length === 0) return null;
    return { ...rec, group: { ...group, sessions } };
  }

  return rec;
}

function mapActivityFeed(
  queryClient: QueryClient,
  mapper: (item: unknown) => unknown | null,
): void {
  queryClient.setQueriesData<InfiniteData<ActivityFeedPageResult>>(
    { queryKey: ["activity", "feed"] },
    (old) => {
      if (!old) return old;
      return {
        pageParams: old.pageParams,
        pages: old.pages.map((p) => ({
          ...p,
          items: p.items
            .map((item) => mapper(item))
            .filter((item): item is NonNullable<typeof item> => item != null),
        })),
      };
    },
  );
}

function omitCommentFromThread<T extends Record<string, unknown>>(
  comment: T,
  opts: { commentId?: string; authorId?: string },
): T | null {
  if (opts.commentId && comment.id === opts.commentId) return null;
  if (
    opts.authorId &&
    (comment.userId === opts.authorId ||
      authorIdFromUnknown(comment.author) === opts.authorId)
  ) {
    return null;
  }
  if (!Array.isArray(comment.replies)) return comment;
  const replies = comment.replies
    .map((reply) =>
      reply && typeof reply === "object"
        ? omitCommentFromThread(reply as Record<string, unknown>, opts)
        : reply,
    )
    .filter((reply): reply is NonNullable<typeof reply> => reply != null);
  return {
    ...comment,
    replies,
    replyCount:
      typeof comment.replyCount === "number"
        ? Math.max(
            0,
            comment.replyCount - (comment.replies.length - replies.length),
          )
        : comment.replyCount,
  };
}

function omitDiscussionComments(
  queryClient: QueryClient,
  opts: { commentId?: string; authorId?: string },
): void {
  queryClient.setQueriesData<{
    items?: Array<Record<string, unknown>>;
    total?: number;
  }>({ queryKey: ["discussion", "comments"] }, (old) => {
    if (!old?.items) return old;
    const items = old.items
      .map((comment) => omitCommentFromThread(comment, opts))
      .filter((comment): comment is Record<string, unknown> => comment != null);
    return {
      ...old,
      items,
      total:
        typeof old.total === "number"
          ? Math.max(0, old.total - (old.items.length - items.length))
          : old.total,
    };
  });
}

function omitSessionComments(
  queryClient: QueryClient,
  opts: { commentId?: string; authorId?: string },
): void {
  queryClient.setQueriesData<{
    comments?: Array<Record<string, unknown>>;
    total?: number;
  }>({ queryKey: ["sessions"] }, (old) => {
    if (!old?.comments) return old;
    const comments = old.comments
      .map((comment) => omitCommentFromThread(comment, opts))
      .filter((comment): comment is Record<string, unknown> => comment != null);
    return {
      ...old,
      comments,
      total:
        typeof old.total === "number"
          ? Math.max(0, old.total - (old.comments.length - comments.length))
          : old.total,
    };
  });
}

export function omitActivitySession(
  queryClient: QueryClient,
  sessionId: string,
): void {
  mapActivityFeed(queryClient, (item) => filterFeedItem(item, { sessionId }));
}

export function omitActivityByAuthor(
  queryClient: QueryClient,
  authorId: string,
): void {
  mapActivityFeed(queryClient, (item) => filterFeedItem(item, { authorId }));
}

export function omitDiscussionFromLists(
  queryClient: QueryClient,
  discussionId: string,
  authorId?: string | null,
): void {
  queryClient.setQueriesData<
    InfiniteData<{ items?: Array<{ id?: string; author?: unknown }> }>
  >({ queryKey: ["discussions", "community"] }, (old) => {
    if (!old) return old;
    return {
      pageParams: old.pageParams,
      pages: old.pages.map((p) => ({
        ...p,
        items: (p.items ?? []).filter((d) => {
          if (d.id === discussionId) return false;
          if (authorId && authorIdFromUnknown(d.author) === authorId)
            return false;
          return true;
        }),
      })),
    };
  });
  if (discussionId) {
    queryClient.removeQueries({
      queryKey: ["discussion", "detail", discussionId],
    });
  }
}

export function applyOptimisticHide(
  queryClient: QueryClient,
  contentType: string,
  targetContentId: string,
): void {
  if (contentType === "DISCUSSION") {
    omitDiscussionFromLists(queryClient, targetContentId);
  }
  if (contentType === "SESSION") {
    omitActivitySession(queryClient, targetContentId);
  }
  if (contentType === "DISCUSSION_COMMENT") {
    omitDiscussionComments(queryClient, { commentId: targetContentId });
  }
  if (contentType === "SESSION_COMMENT") {
    omitSessionComments(queryClient, { commentId: targetContentId });
  }
}

export function applyOptimisticBlock(
  queryClient: QueryClient,
  authorId: string,
): void {
  omitDiscussionFromLists(queryClient, "", authorId);
  omitActivityByAuthor(queryClient, authorId);
  omitDiscussionComments(queryClient, { authorId });
  omitSessionComments(queryClient, { authorId });
  queryClient.setQueryData(
    ["profile", "publicPreview", authorId],
    (old: Record<string, unknown> | undefined) =>
      old
        ? {
            ...old,
            avatarUrl: null,
            bio: null,
            blockedByMe: true,
            viewerHasAccess: false,
          }
        : old,
  );
  queryClient.removeQueries({ queryKey: ["userProfile", "summary", authorId] });
  queryClient.removeQueries({ queryKey: ["userProfile", "bundle", authorId] });
  queryClient.removeQueries({
    queryKey: ["userProfile", "raceHistory", authorId],
  });
  queryClient.removeQueries({
    queryKey: ["profile", "challengeBadges", authorId],
  });
}
