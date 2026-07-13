import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { recordDiscussionView, type Discussion } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOrCreateAnonymousViewerId,
  isDiscussionViewedInBrowser,
  markDiscussionViewedInBrowser,
} from "@/lib/discussionViewerId";

const inFlightByDiscussionId = new Map<string, Promise<{ views: number; recorded: boolean }>>();

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
 */
export function useRecordDiscussionView(
  discussionId: string | undefined,
  { enabled }: UseRecordDiscussionViewOptions,
): void {
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
          ["discussion", "detail", discussionId],
          (prev) => (prev ? { ...prev, views: res.views } : prev),
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
  }, [discussionId, enabled, user?.id, queryClient]);
}
