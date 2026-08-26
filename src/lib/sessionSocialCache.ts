import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { ActivityFeedPageResult } from "@/lib/api";
import {
  bumpActivityFeedCommentCount,
  patchActivityFeedInfiniteData,
} from "@/lib/activityFeedCache";
import type { ParsedSessionDetail } from "@/features/session-detail/sessionDetailData";
import { sessionDetailQueryKey } from "@/lib/sessions/sessionDetailPrefetch";

const ACTIVITY_FEED_QUERY_KEY = ["activity", "feed"] as const;

export type SessionSocialPatch = {
  likeCount?: number;
  likedByMe?: boolean;
  commentCount?: number;
};

function toFeedPatch(patch: SessionSocialPatch): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  if (patch.likeCount != null) next.likeCount = patch.likeCount;
  if (patch.likedByMe != null) next.likedByMe = patch.likedByMe;
  if (patch.commentCount != null) {
    next.commentCount = patch.commentCount;
    next.commentsCount = patch.commentCount;
  }
  return next;
}

/** Patch one session in home/public activity infinite caches and session detail. */
export function patchSessionSocialCaches(
  queryClient: QueryClient,
  sessionId: string,
  patch: SessionSocialPatch,
): void {
  const feedPatch = toFeedPatch(patch);
  queryClient.setQueriesData<InfiniteData<ActivityFeedPageResult>>(
    { queryKey: ACTIVITY_FEED_QUERY_KEY },
    (old) => patchActivityFeedInfiniteData(old, sessionId, feedPatch),
  );
  queryClient.setQueryData<ParsedSessionDetail>(
    sessionDetailQueryKey(sessionId),
    (old) => {
      if (!old?.session) return old;
      return {
        ...old,
        session: {
          ...old.session,
          ...(patch.likeCount != null ? { likeCount: patch.likeCount } : {}),
          ...(patch.likedByMe != null ? { likedByMe: patch.likedByMe } : {}),
          ...(patch.commentCount != null
            ? { commentCount: patch.commentCount }
            : {}),
        },
      };
    },
  );
}

export function bumpSessionCommentCountInCaches(
  queryClient: QueryClient,
  sessionId: string,
  delta: number,
): void {
  queryClient.setQueriesData<InfiniteData<ActivityFeedPageResult>>(
    { queryKey: ACTIVITY_FEED_QUERY_KEY },
    (old) => bumpActivityFeedCommentCount(old, sessionId, delta),
  );
  queryClient.setQueryData<ParsedSessionDetail>(
    sessionDetailQueryKey(sessionId),
    (old) => {
      if (!old?.session) return old;
      const current = Number(old.session.commentCount ?? 0);
      return {
        ...old,
        session: {
          ...old.session,
          commentCount: Math.max(0, current + delta),
        },
      };
    },
  );
}
