import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";
const ROW_COUNT = 5;

function ChallengeBrowseRowSkeleton() {
  return (
    <div className="rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock
            className={cn("h-4 w-[60%] max-w-xs rounded-apex-sm", blockClassName)}
          />
          <SkeletonBlock
            className={cn("h-3 w-[85%] max-w-sm rounded-apex-sm", blockClassName)}
          />
        </div>
        <SkeletonBlock
          className={cn("h-9 w-20 shrink-0 rounded-apex-sm", blockClassName)}
        />
      </div>
    </div>
  );
}

function ChallengeFeaturedHeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container">
      <SkeletonBlock
        className={cn("h-48 w-full rounded-none sm:h-56", blockClassName)}
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

export default function ChallengeBrowseListSkeleton({
  showHero = false,
  rowCount = ROW_COUNT,
}: {
  showHero?: boolean;
  rowCount?: number;
}) {
  return (
    <div
      className="space-y-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading challenges"
    >
      {showHero && <ChallengeFeaturedHeroSkeleton />}
      <div className="space-y-3">
        {Array.from({ length: rowCount }, (_, i) => (
          <ChallengeBrowseRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
