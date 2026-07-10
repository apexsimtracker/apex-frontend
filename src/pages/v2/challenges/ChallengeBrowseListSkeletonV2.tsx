import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-v2-surface-container-high/80";
const ROW_COUNT = 5;

function ChallengeBrowseRowSkeletonV2() {
  return (
    <div className="rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <SkeletonBlock
            className={cn("h-4 w-[60%] max-w-xs rounded-v2-sm", blockClassName)}
          />
          <SkeletonBlock
            className={cn("h-3 w-[85%] max-w-sm rounded-v2-sm", blockClassName)}
          />
        </div>
        <SkeletonBlock
          className={cn("h-9 w-20 shrink-0 rounded-v2-sm", blockClassName)}
        />
      </div>
    </div>
  );
}

function ChallengeFeaturedHeroSkeletonV2() {
  return (
    <div className="overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container">
      <SkeletonBlock
        className={cn("h-48 w-full rounded-none sm:h-56", blockClassName)}
      />
      <div className="grid grid-cols-3 gap-4 p-6">
        {([0, 1, 2] as const).map((i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock
              className={cn("h-2.5 w-12 rounded-v2-sm", blockClassName)}
            />
            <SkeletonBlock
              className={cn("h-4 w-16 rounded-v2-sm", blockClassName)}
            />
          </div>
        ))}
      </div>
      <div className="px-6 pb-6">
        <SkeletonBlock
          className={cn("h-12 w-full rounded-v2-sm", blockClassName)}
        />
      </div>
    </div>
  );
}

export default function ChallengeBrowseListSkeletonV2({
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
      {showHero && <ChallengeFeaturedHeroSkeletonV2 />}
      <div className="space-y-3">
        {Array.from({ length: rowCount }, (_, i) => (
          <ChallengeBrowseRowSkeletonV2 key={i} />
        ))}
      </div>
    </div>
  );
}
