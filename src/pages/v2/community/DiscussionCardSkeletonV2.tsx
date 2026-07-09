import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DiscussionCardSkeletonV2Props = {
  count?: number;
  className?: string;
};

export function DiscussionCardSkeletonV2({
  count = 4,
  className,
}: DiscussionCardSkeletonV2Props) {
  const blockClassName = "bg-v2-surface-container-high/80";

  return (
    <div
      className={className ?? "space-y-3"}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading discussions"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border-l-2 border-l-v2-primary/20 bg-v2-surface-container-low p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <SkeletonBlock
              className={cn("size-6 shrink-0 rounded-full", blockClassName)}
            />
            <SkeletonBlock className={cn("h-3 w-24 rounded", blockClassName)} />
            <SkeletonBlock
              className={cn("ml-auto h-4 w-14 rounded", blockClassName)}
            />
          </div>
          <SkeletonBlock
            className={cn("mb-1 h-4 w-full max-w-md rounded", blockClassName)}
          />
          <SkeletonBlock
            className={cn("mb-1 h-3 w-full rounded", blockClassName)}
          />
          <SkeletonBlock
            className={cn("mb-3 h-3 w-4/5 rounded", blockClassName)}
          />
          <div className="flex items-center gap-3">
            <SkeletonBlock className={cn("h-3 w-8 rounded", blockClassName)} />
            <SkeletonBlock className={cn("h-3 w-8 rounded", blockClassName)} />
            <SkeletonBlock className={cn("h-3 w-8 rounded", blockClassName)} />
          </div>
        </div>
      ))}
    </div>
  );
}
