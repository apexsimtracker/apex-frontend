import { SkeletonBlock } from "@/components/ui/skeleton";

type DiscussionCardSkeletonProps = {
  count?: number;
  className?: string;
};

export function DiscussionCardSkeleton({
  count = 4,
  className,
}: DiscussionCardSkeletonProps) {
  return (
    <div
      className={className ?? "space-y-5 sm:space-y-6"}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading discussions"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-lg border border-white/10 bg-card/20 p-4 sm:p-5"
        >
          <div className="mb-4 flex gap-3">
            <SkeletonBlock className="size-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-28 rounded" />
              <SkeletonBlock className="h-3 w-20 rounded" />
            </div>
          </div>
          <SkeletonBlock className="mb-3 h-3 w-24 rounded" />
          <SkeletonBlock className="mb-2 h-5 w-full max-w-md rounded" />
          <SkeletonBlock className="mb-2 h-4 w-full rounded" />
          <SkeletonBlock className="h-4 max-w-sm w-full rounded" />
        </div>
      ))}
    </div>
  );
}
