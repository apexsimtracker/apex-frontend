/** Must match backend COMMENT_REPLIES_PAGE_DEFAULT. */
export const COMMENT_REPLIES_PAGE_SIZE = 5;

export function nextCommentRepliesOffset(loadedCount: number): number {
  return Math.max(0, Math.floor(loadedCount));
}

export function mergeCommentReplies<T extends { id: string }>(
  existing: T[] | undefined,
  incoming: T[],
): T[] {
  const out = [...(existing ?? [])];
  const seen = new Set(out.map((row) => row.id));
  for (const row of incoming) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row);
  }
  return out;
}

type ThreadRoot<T extends { id: string }> = T & {
  replies?: T[];
  replyCount?: number;
  hasMoreReplies?: boolean;
};

/**
 * A root-page refetch only embeds the newest reply. Preserve replies that the
 * viewer already paged in while taking fresh server data for matching rows.
 */
export function preserveLoadedReplies<T extends { id: string }>(
  freshRoots: ThreadRoot<T>[],
  cachedRoots: ThreadRoot<T>[] | undefined,
): ThreadRoot<T>[] {
  if (!cachedRoots?.length) return freshRoots;

  const cachedById = new Map(cachedRoots.map((root) => [root.id, root]));
  return freshRoots.map((fresh) => {
    const cached = cachedById.get(fresh.id);
    if (!cached?.replies?.length) return fresh;

    const cachedReplies = cached.replies.filter(
      (reply) => !reply.id.startsWith("temp-"),
    );
    const replies = mergeCommentReplies(fresh.replies, cachedReplies);
    const replyCount = fresh.replyCount ?? replies.length;
    return {
      ...fresh,
      replies,
      replyCount,
      hasMoreReplies: replies.length < replyCount,
    };
  });
}
