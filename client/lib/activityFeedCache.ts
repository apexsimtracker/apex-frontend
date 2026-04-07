import type { InfiniteData } from "@tanstack/react-query";
import type { ActivityFeedPageResult } from "@/lib/api";

/** Update one session in paginated activity feed cache (React Query infinite data). */
export function patchActivityFeedInfiniteData(
  old: InfiniteData<ActivityFeedPageResult> | undefined,
  id: string,
  patch: Record<string, unknown>
): InfiniteData<ActivityFeedPageResult> | undefined {
  if (!old) return old;
  return {
    pageParams: old.pageParams,
    pages: old.pages.map((p) => ({
      ...p,
      items: p.items.map((x) => {
        const item = x as { id?: string };
        return item.id === id ? { ...item, ...patch } : x;
      }),
    })),
  };
}
