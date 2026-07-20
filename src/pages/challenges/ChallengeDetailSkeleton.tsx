import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

function ChallengeDetailHeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container">
      <SkeletonBlock
        className={cn("h-48 w-full rounded-none sm:h-64", blockClassName)}
      />
      <div className="grid grid-cols-3 gap-4 p-6">
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock
              className={cn("h-2.5 w-12 rounded-apex-sm", blockClassName)}
            />
            <SkeletonBlock
              className={cn("h-4 w-16 rounded-apex-sm", blockClassName)}
            />
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <SkeletonBlock
          className={cn("h-12 w-full rounded-apex-sm", blockClassName)}
        />
      </div>
    </div>
  );
}

function ChallengeDetailOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-6">
          <SkeletonBlock
            className={cn("mb-6 h-5 w-40 rounded-apex-sm", blockClassName)}
          />
          <div className="grid grid-cols-2 gap-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock
                  className={cn("h-2.5 w-14 rounded-apex-sm", blockClassName)}
                />
                <SkeletonBlock
                  className={cn("h-4 w-24 rounded-apex-sm", blockClassName)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-6">
          <SkeletonBlock
            className={cn("mb-6 h-5 w-36 rounded-apex-sm", blockClassName)}
          />
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <SkeletonBlock
                key={i}
                className={cn("h-24 w-full rounded-xl", blockClassName)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChallengeDetailSkeleton() {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading challenge"
    >
      <ChallengeDetailHeroSkeleton />
      <div className="flex gap-2">
        {Array.from({ length: 3 }, (_, i) => (
          <SkeletonBlock
            key={i}
            className={cn("h-9 w-24 shrink-0 rounded-apex-sm", blockClassName)}
          />
        ))}
      </div>
      <ChallengeDetailOverviewSkeleton />
    </div>
  );
}
