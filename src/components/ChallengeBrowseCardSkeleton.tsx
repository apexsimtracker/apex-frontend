import { SkeletonBlock } from "@/components/ui/skeleton";

export default function ChallengeBrowseCardSkeleton() {
  return (
    <div className="border-white/6 flex h-full flex-col overflow-hidden rounded-lg border bg-card/20">
      <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-5">
        <div className="mb-3 flex items-start justify-between gap-2">
          <SkeletonBlock height={16} className="min-w-0 flex-1" />
          <SkeletonBlock height={20} width={72} rounded="sm" />
        </div>

        <div className="mb-3 space-y-2">
          <SkeletonBlock height={24} width={80} rounded="sm" />
          <SkeletonBlock height={12} width="70%" />
          <SkeletonBlock height={12} width="55%" />
        </div>

        <div className="mb-3 space-y-1.5 border-t border-white/5 pt-3">
          <SkeletonBlock height={12} width="80%" />
          <SkeletonBlock height={12} width="75%" />
        </div>

        <div className="mt-auto flex flex-wrap gap-3">
          <SkeletonBlock height={12} width={48} />
          <SkeletonBlock height={12} width={64} />
        </div>
      </div>

      <div className="border-t border-white/5 px-4 pb-4 pt-3 sm:px-5">
        <SkeletonBlock height={36} className="w-full" rounded="lg" />
      </div>
    </div>
  );
}

export function ChallengeBrowseGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ChallengeBrowseCardSkeleton key={i} />
      ))}
    </div>
  );
}
