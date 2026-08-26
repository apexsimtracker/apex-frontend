import type { ThreadComment } from "./commentTypes";

export function canEditThreadComment(
  comment: ThreadComment,
  isMine: boolean,
): boolean {
  return isMine && !comment.deletedAt && !comment.editedAt;
}

export function canReplyToThreadComment(
  comment: ThreadComment,
  signedIn: boolean,
): boolean {
  return signedIn && !comment.deletedAt;
}

export function deletedCommentCopy(
  isReply: boolean,
  displayName: string,
): string {
  return isReply
    ? `${displayName} deleted a reply.`
    : "This comment was deleted.";
}

/** Visible comments removed when deleting a root thread or a single child. */
export function commentDeleteCountDelta(
  targetRoot:
    | {
        replies?: Array<{ deletedAt?: string | null }>;
        replyCount?: number;
      }
    | undefined,
): number {
  if (!targetRoot) return 1;
  const loaded = targetRoot.replies ?? [];
  const loadedVisible = loaded.filter((child) => !child.deletedAt).length;
  const unloaded = Math.max(
    0,
    (targetRoot.replyCount ?? loaded.length) - loaded.length,
  );
  return 1 + loadedVisible + unloaded;
}

export function nextRepliesLabel(
  loading: boolean,
  replyCount: number,
  loadedCount: number,
): string {
  if (loading) return "Loading replies…";
  const count = Math.min(5, Math.max(0, replyCount - loadedCount));
  return `View ${count} more ${count === 1 ? "reply" : "replies"}`;
}
