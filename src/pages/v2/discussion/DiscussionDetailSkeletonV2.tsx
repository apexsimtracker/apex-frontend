import { SkeletonBlock } from "@/components/ui/skeleton";

export default function DiscussionDetailSkeletonV2() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-v2-outline-variant/25 border-l-[3px] border-l-v2-primary/40 bg-v2-surface-container-low p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <SkeletonBlock className="size-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-28 rounded-v2-sm" />
            <SkeletonBlock className="h-2.5 w-20 rounded-v2-sm" />
          </div>
          <SkeletonBlock className="h-4 w-14 rounded-v2-sm" />
        </div>
        <SkeletonBlock className="mb-4 h-8 w-full max-w-md rounded-v2-sm" />
        <div className="space-y-2">
          <SkeletonBlock className="h-4 w-full rounded-v2-sm" />
          <SkeletonBlock className="h-4 w-full rounded-v2-sm" />
          <SkeletonBlock className="h-4 w-3/4 rounded-v2-sm" />
        </div>
        <div className="mt-5 flex gap-4 border-t border-v2-outline-variant/10 pt-4">
          <SkeletonBlock className="h-3 w-10 rounded-v2-sm" />
          <SkeletonBlock className="h-3 w-10 rounded-v2-sm" />
          <SkeletonBlock className="h-3 w-10 rounded-v2-sm" />
        </div>
      </div>

      <div>
        <SkeletonBlock className="mb-2 h-3 w-16 rounded-v2-sm" />
        <SkeletonBlock className="mb-6 h-4 w-32 rounded-v2-sm" />
        <div className="space-y-3">
          <SkeletonBlock className="h-24 w-full rounded-xl border-l-2 border-l-v2-primary/20" />
          <SkeletonBlock className="h-24 w-full rounded-xl border-l-2 border-l-v2-primary/20" />
        </div>
      </div>

      <SkeletonBlock className="h-16 w-full rounded-v2-lg" />
    </div>
  );
}
