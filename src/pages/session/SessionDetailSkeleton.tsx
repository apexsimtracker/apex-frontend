import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

/** Compact placeholder for sections below a seeded hero (not a full-page reload feel). */
export function SessionDetailBodySkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading session details"
    >
      <SkeletonBlock className={cn("h-28 w-full rounded-xl", blockClassName)} />
      <SkeletonBlock className={cn("h-40 w-full rounded-xl", blockClassName)} />
      <SkeletonBlock className={cn("h-48 w-full rounded-xl", blockClassName)} />
    </div>
  );
}

export default function SessionDetailSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading session"
    >
      <div className="flex flex-wrap gap-2">
        {["w-16", "w-14", "w-20"].map((widthClass) => (
          <SkeletonBlock
            key={widthClass}
            className={cn("h-6 rounded-apex-sm", widthClass, blockClassName)}
          />
        ))}
      </div>

      <div className="relative h-[220px] rounded-xl bg-apex-surface-container-low p-4 sm:h-64">
        <div className="flex justify-end gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <SkeletonBlock
              key={index}
              className={cn("size-9 rounded-full", blockClassName)}
            />
          ))}
        </div>
        <SkeletonBlock
          className={cn(
            "absolute bottom-6 left-4 h-10 w-64 max-w-[75%] rounded-apex-sm sm:left-6",
            blockClassName,
          )}
        />
      </div>

      <SessionDetailBodySkeleton />
    </div>
  );
}
