import { useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import {
  recordDiscussionView,
  type Discussion,
  type DiscussionsPageResult,
} from "@/lib/api/community";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrCreateAnonymousViewerId,
  isDiscussionViewedInBrowser,
  markDiscussionViewedInBrowser,
} from "@/lib/discussionViewerId";
import { discussionDetailQueryKey } from "@/lib/community/discussionDetailPrefetch";

const inFlightByDiscussionId = new Map<
  string,
  Promise<{ views: number; recorded: boolean }>
>();

function recordDiscussionViewSingleFlight(
  discussionId: string,
  run: () => Promise<{ views: number; recorded: boolean }>,
): Promise<{ views: number; recorded: boolean }> {
  const existing = inFlightByDiscussionId.get(discussionId);
  if (existing) return existing;

  const promise = run().finally(() => {
    if (inFlightByDiscussionId.get(discussionId) === promise) {
      inFlightByDiscussionId.delete(discussionId);
    }
  });
  inFlightByDiscussionId.set(discussionId, promise);
  return promise;
}

type UseRecordDiscussionViewOptions = {
  /** When true, discussion detail has loaded and view recording may run. */
  enabled: boolean;
};

/**
 * Fire-and-forget discussion view registration. Tier-0 short-circuit skips network on repeat
 * visits; always sends anonymousId when available for server anon→user merge.
 * On record, patches detail + list caches — does not invalidate the community list.
 */
export function useRecordDiscussionView(
  discussionId: string | undefined,
  { enabled }: UseRecordDiscussionViewOptions,
): void {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userKey = user?.id?.trim() || "anon";

  useEffect(() => {
    if (!discussionId || !enabled) return;
    if (isDiscussionViewedInBrowser(discussionId)) return;

    let cancelled = false;

    const run = async () => {
      try {
        const anonymousId = getOrCreateAnonymousViewerId();
        const res = await recordDiscussionViewSingleFlight(discussionId, () =>
          recordDiscussionView(discussionId, { anonymousId }),
        );
        if (cancelled) return;

        markDiscussionViewedInBrowser(discussionId);
        queryClient.setQueryData<Discussion>(
          discussionDetailQueryKey(discussionId, userKey),
          (prev) => (prev ? { ...prev, views: res.views } : prev),
        );

        if (res.recorded) {
          queryClient.setQueriesData<InfiniteData<DiscussionsPageResult>>(
            { queryKey: ["discussions", "community"] },
            (prev) => {
              if (!prev?.pages) return prev;
              return {
                ...prev,
                pages: prev.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.id === discussionId
                      ? { ...item, views: res.views }
                      : item,
                  ),
                })),
              };
            },
          );
        }
      } catch {
        /* view registration is best-effort */
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [discussionId, enabled, user?.id, userKey, queryClient]);
}
