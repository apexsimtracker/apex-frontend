import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const ROW_COUNT = 10;
const blockClassName = "bg-apex-surface-container-high/80";

function LeaderboardRowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-apex-outline-variant/10 px-2 py-3 last:border-b-0">
      <SkeletonBlock
        className={cn("size-7 shrink-0 rounded-xl", blockClassName)}
      />
      <SkeletonBlock
        className={cn("size-9 shrink-0 rounded-xl", blockClassName)}
      />
      <SkeletonBlock
        className={cn(
          "h-3.5 max-w-[140px] flex-1 rounded-apex-sm",
          blockClassName,
        )}
      />
      <SkeletonBlock
        className={cn("h-4 w-12 shrink-0 rounded-apex-sm", blockClassName)}
      />
    </div>
  );
}

export default function LeaderboardsListSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl bg-apex-surface-container-low p-2"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading leaderboards"
    >
      {Array.from({ length: ROW_COUNT }).map((_, i) => (
        <LeaderboardRowSkeleton key={i} />
      ))}
    </div>
  );
}
