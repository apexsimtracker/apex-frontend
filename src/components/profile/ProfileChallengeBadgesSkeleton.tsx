import { SkeletonBlock } from "@/components/ui/skeleton";

const sk = "bg-apex-surface-container-highest";

/** Header chip row while GET /api/users/:id preview badges are loading. */
export function ProfileChallengeBadgesSkeleton() {
  return (
    <div
      className="mt-4"
      aria-busy="true"
      aria-label="Loading podium badges"
    >
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <SkeletonBlock className={`h-3 w-24 rounded-apex-sm ${sk}`} />
        <SkeletonBlock className={`h-3.5 w-[4.5rem] rounded-apex-sm ${sk}`} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className={`size-7 rounded-full ${sk}`} />
        ))}
      </div>
    </div>
  );
}
