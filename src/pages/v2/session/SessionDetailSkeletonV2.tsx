import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-v2-surface-container-high/80";

export default function SessionDetailSkeletonV2() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading session"
    >
      <SkeletonBlock className={cn("h-4 w-24 rounded-v2-sm", blockClassName)} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <SkeletonBlock
              className={cn("h-6 w-16 rounded-v2-sm", blockClassName)}
            />
            <SkeletonBlock
              className={cn("h-6 w-14 rounded-v2-sm", blockClassName)}
            />
          </div>
          <SkeletonBlock
            className={cn("h-9 w-64 max-w-full rounded-v2-sm", blockClassName)}
          />
          <SkeletonBlock
            className={cn("h-4 w-20 rounded-v2-sm", blockClassName)}
          />
        </div>
        <div className="flex shrink-0 gap-2">
          <SkeletonBlock
            className={cn("h-10 w-20 rounded-v2-sm", blockClassName)}
          />
          <SkeletonBlock
            className={cn("h-10 w-16 rounded-v2-sm", blockClassName)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-4"
          >
            <SkeletonBlock
              className={cn("mb-2 h-3 w-16 rounded-v2-sm", blockClassName)}
            />
            <SkeletonBlock
              className={cn("h-8 w-20 rounded-v2-sm", blockClassName)}
            />
          </div>
        ))}
      </div>

      <SkeletonBlock
        className={cn(
          "h-32 w-full rounded-v2-lg border border-v2-outline-variant/15",
          blockClassName,
        )}
      />

      <SkeletonBlock
        className={cn(
          "h-64 w-full rounded-2xl border border-v2-outline-variant/15",
          blockClassName,
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonBlock
          className={cn(
            "h-40 rounded-v2-lg border border-v2-outline-variant/15",
            blockClassName,
          )}
        />
        <SkeletonBlock
          className={cn(
            "h-40 rounded-v2-lg border border-v2-outline-variant/15",
            blockClassName,
          )}
        />
      </div>
    </div>
  );
}
