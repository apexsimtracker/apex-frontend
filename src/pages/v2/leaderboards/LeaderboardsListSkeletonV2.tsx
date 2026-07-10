import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROW_COUNT = 10;
const blockClassName = "bg-v2-surface-container-high/80";

function LeaderboardRowSkeletonV2() {
  return (
    <div className="flex items-center gap-3 border-b border-v2-outline-variant/10 px-2 py-3 last:border-b-0">
      <SkeletonBlock
        className={cn("size-7 shrink-0 rounded-xl", blockClassName)}
      />
      <SkeletonBlock
        className={cn("size-9 shrink-0 rounded-xl", blockClassName)}
      />
      <SkeletonBlock
        className={cn(
          "h-3.5 max-w-[140px] flex-1 rounded-v2-sm",
          blockClassName,
        )}
      />
      <SkeletonBlock
        className={cn("h-4 w-12 shrink-0 rounded-v2-sm", blockClassName)}
      />
    </div>
  );
}

export default function LeaderboardsListSkeletonV2() {
  return (
    <div
      className="animate-pulse rounded-xl bg-v2-surface-container-low p-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading leaderboards"
    >
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <LeaderboardRowSkeletonV2 key={i} />
      ))}
    </div>
  );
}
