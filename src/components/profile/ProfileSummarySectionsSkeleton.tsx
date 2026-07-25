/**
 * Section skeletons for profile stats while summary is still loading.
 * Header paints separately from preview/auth.
 */
import { SkeletonBlock } from "@/components/ui/skeleton";

const sk = "bg-apex-surface-container-highest";

function SectionTitleSkeleton() {
  return <SkeletonBlock className={`h-5 w-36 rounded-apex-sm ${sk}`} />;
}

function StatCellSkeleton({ align }: { align?: "left" | "center" | "right" }) {
  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-center space-y-2 lg:items-start lg:rounded-xl lg:border lg:border-apex-outline-variant/15 lg:bg-apex-surface-container-low lg:p-4 lg:shadow-lg"
          : align === "right"
            ? "flex flex-col items-end space-y-2 lg:items-start lg:rounded-xl lg:border lg:border-apex-outline-variant/15 lg:bg-apex-surface-container-low lg:p-4 lg:shadow-lg"
            : "space-y-2 lg:rounded-xl lg:border lg:border-apex-outline-variant/15 lg:bg-apex-surface-container-low lg:p-4 lg:shadow-lg"
      }
    >
      <SkeletonBlock className={`h-2.5 w-14 rounded-apex-sm ${sk}`} />
      <SkeletonBlock className={`h-8 w-10 rounded-apex-sm ${sk}`} />
    </div>
  );
}

function ProgressRowSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between">
        <SkeletonBlock className={`h-2.5 w-16 rounded-apex-sm ${sk}`} />
        <SkeletonBlock className={`h-3.5 w-12 rounded-apex-sm ${sk}`} />
      </div>
      <SkeletonBlock className={`h-1 w-full rounded-full ${sk}`} />
    </div>
  );
}

function DisciplineRowSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonBlock className={`h-6 w-20 rounded-apex-sm ${sk}`} />
        <SkeletonBlock className={`h-3 w-10 rounded-apex-sm ${sk}`} />
      </div>
      <SkeletonBlock className={`h-1.5 w-full rounded-full ${sk}`} />
    </div>
  );
}

function GameStatCardSkeleton() {
  return (
    <div className="rounded-lg bg-apex-surface-container-low p-5">
      <SkeletonBlock className={`mb-4 h-4 w-24 rounded-apex-sm ${sk}`} />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <SkeletonBlock className={`h-3 w-20 rounded-apex-sm ${sk}`} />
            <SkeletonBlock className={`h-3.5 w-8 rounded-apex-sm ${sk}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ProfileSummarySectionsSkeleton() {
  const barHeights = [
    "h-[45%]",
    "h-[70%]",
    "h-[30%]",
    "h-[85%]",
    "h-[55%]",
    "h-[40%]",
    "h-[65%]",
  ];

  return (
    <div
      className="w-full space-y-6"
      aria-busy="true"
      aria-label="Loading profile stats"
    >
      <section className="grid grid-cols-3 gap-y-4 border-y border-apex-outline-variant/15 py-4 lg:gap-3 lg:border-0 lg:py-0">
        <StatCellSkeleton align="left" />
        <StatCellSkeleton align="center" />
        <StatCellSkeleton align="right" />
        <StatCellSkeleton align="left" />
        <StatCellSkeleton align="center" />
        <StatCellSkeleton align="right" />
      </section>

      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="space-y-5 rounded-lg bg-apex-surface-container-low p-5">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <SkeletonBlock className={`size-20 shrink-0 rounded-full ${sk}`} />
            <div className="w-full flex-1 space-y-4">
              <ProgressRowSkeleton />
              <ProgressRowSkeleton />
              <ProgressRowSkeleton />
            </div>
          </div>
          <div className="flex h-24 items-end justify-between gap-2 border-t border-apex-outline-variant/10 pt-4">
            {barHeights.map((h, i) => (
              <SkeletonBlock
                key={i}
                className={`w-full rounded-t-sm ${h} ${sk}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="space-y-4 rounded-lg bg-apex-surface-container-low p-5">
          <DisciplineRowSkeleton />
          <DisciplineRowSkeleton />
          <DisciplineRowSkeleton />
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="grid gap-3 sm:grid-cols-2">
          <GameStatCardSkeleton />
          <GameStatCardSkeleton />
        </div>
      </section>
    </div>
  );
}
