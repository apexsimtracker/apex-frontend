import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

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

      <section className="space-y-3">
        <div className="flex items-center gap-5 overflow-hidden rounded-xl bg-apex-surface-container-low p-4 shadow-lg">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="min-w-24 flex-1 space-y-2">
              <SkeletonBlock
                className={cn("h-3 w-14 rounded-apex-sm", blockClassName)}
              />
              <SkeletonBlock
                className={cn("h-7 w-20 rounded-apex-sm", blockClassName)}
              />
            </div>
          ))}
        </div>
        <SkeletonBlock
          className={cn("h-3 w-72 max-w-full rounded-apex-sm", blockClassName)}
        />
      </section>

      <section className="rounded-xl bg-apex-surface-container-low p-4 shadow-lg">
        <div className="mb-5 flex items-center justify-between">
          <SkeletonBlock
            className={cn("h-6 w-40 rounded-apex-sm", blockClassName)}
          />
          <SkeletonBlock
            className={cn("h-3 w-24 rounded-apex-sm", blockClassName)}
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <SkeletonBlock
                className={cn("h-1 w-full rounded-full", blockClassName)}
              />
              <SkeletonBlock
                className={cn("h-3 w-14 rounded-apex-sm", blockClassName)}
              />
              <SkeletonBlock
                className={cn(
                  "h-7 w-20 max-w-full rounded-apex-sm",
                  blockClassName,
                )}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SkeletonBlock
          className={cn("h-6 w-28 rounded-apex-sm", blockClassName)}
        />
        <SkeletonBlock
          className={cn("h-64 w-full rounded-xl", blockClassName)}
        />
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonBlock className={cn("h-52 rounded-xl", blockClassName)} />
        <SkeletonBlock className={cn("h-52 rounded-xl", blockClassName)} />
      </div>

      <section className="space-y-3">
        <SkeletonBlock
          className={cn("h-6 w-36 rounded-apex-sm", blockClassName)}
        />
        <SkeletonBlock
          className={cn("h-72 w-full rounded-xl", blockClassName)}
        />
      </section>
    </div>
  );
}
