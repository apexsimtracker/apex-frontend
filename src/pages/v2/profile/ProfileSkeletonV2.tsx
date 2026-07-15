import { SkeletonBlock } from "@/components/ui/skeleton";
import { ProfileChallengeBadgesSkeletonV2 } from "@/components/v2/profile/ProfileChallengeBadgesSkeletonV2";

type ProfileSkeletonV2Props = {
  /** User details page shows a back control above the profile content. */
  showBackLink?: boolean;
  /** When preview is already loaded, mirror whether badges will appear. */
  showChallengeBadges?: boolean;
};

const sk = "bg-v2-surface-container-highest";

function SectionTitleSkeleton() {
  return <SkeletonBlock className={`h-5 w-36 rounded-v2-sm ${sk}`} />;
}

function StatCellSkeleton({ align }: { align?: "left" | "center" | "right" }) {
  return (
    <div
      className={
        align === "center"
          ? "flex flex-col items-center space-y-2 lg:items-start lg:rounded-xl lg:border lg:border-v2-outline-variant/15 lg:bg-v2-surface-container-low lg:p-4 lg:shadow-lg"
          : align === "right"
            ? "flex flex-col items-end space-y-2 lg:items-start lg:rounded-xl lg:border lg:border-v2-outline-variant/15 lg:bg-v2-surface-container-low lg:p-4 lg:shadow-lg"
            : "space-y-2 lg:rounded-xl lg:border lg:border-v2-outline-variant/15 lg:bg-v2-surface-container-low lg:p-4 lg:shadow-lg"
      }
    >
      <SkeletonBlock className={`h-2.5 w-14 rounded-v2-sm ${sk}`} />
      <SkeletonBlock className={`h-8 w-10 rounded-v2-sm ${sk}`} />
    </div>
  );
}

function ProgressRowSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="flex items-end justify-between">
        <SkeletonBlock className={`h-2.5 w-16 rounded-v2-sm ${sk}`} />
        <SkeletonBlock className={`h-3.5 w-12 rounded-v2-sm ${sk}`} />
      </div>
      <SkeletonBlock className={`h-1 w-full rounded-full ${sk}`} />
    </div>
  );
}

function DisciplineRowSkeleton() {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <SkeletonBlock className={`h-6 w-20 rounded-v2-sm ${sk}`} />
        <SkeletonBlock className={`h-3 w-10 rounded-v2-sm ${sk}`} />
      </div>
      <SkeletonBlock className={`h-1.5 w-full rounded-full ${sk}`} />
    </div>
  );
}

function RaceRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-v2-outline-variant/10 py-4 last:border-b-0">
      <div className="min-w-0 flex-1 space-y-1.5">
        <SkeletonBlock
          className={`h-3.5 w-32 max-w-full rounded-v2-sm ${sk}`}
        />
        <SkeletonBlock className={`h-2.5 w-16 rounded-v2-sm ${sk}`} />
      </div>
      <SkeletonBlock
        className={`hidden h-5 w-14 shrink-0 rounded-v2-sm sm:block ${sk}`}
      />
      <SkeletonBlock
        className={`hidden h-3.5 w-24 shrink-0 rounded-v2-sm md:block ${sk}`}
      />
      <SkeletonBlock className={`h-6 w-8 shrink-0 rounded-v2-sm ${sk}`} />
      <SkeletonBlock className={`h-3.5 w-14 shrink-0 rounded-v2-sm ${sk}`} />
    </div>
  );
}

function GameStatCardSkeleton() {
  return (
    <div className="rounded-lg bg-v2-surface-container-low p-5">
      <SkeletonBlock className={`mb-4 h-4 w-24 rounded-v2-sm ${sk}`} />
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between gap-4">
            <SkeletonBlock className={`h-3 w-20 rounded-v2-sm ${sk}`} />
            <SkeletonBlock className={`h-3.5 w-8 rounded-v2-sm ${sk}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProfileSkeletonV2({
  showBackLink = false,
  showChallengeBadges = false,
}: ProfileSkeletonV2Props) {
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
      aria-label="Loading profile"
    >
      {showBackLink && (
        <SkeletonBlock className={`h-4 w-14 rounded-v2-sm ${sk}`} />
      )}

      {/* Header — avatar + name / followers / bio */}
      <section className="flex items-start gap-4 py-2">
        <SkeletonBlock className={`size-20 shrink-0 rounded-lg ${sk}`} />
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonBlock
            className={`h-7 w-44 max-w-[70%] rounded-v2-sm ${sk}`}
          />
          <div className="flex flex-wrap gap-3">
            <SkeletonBlock className={`h-3 w-[5.5rem] rounded-v2-sm ${sk}`} />
            <SkeletonBlock className={`h-3 w-[5.5rem] rounded-v2-sm ${sk}`} />
          </div>
          <div className="space-y-2 pt-1">
            <SkeletonBlock className={`h-3.5 w-full rounded-v2-sm ${sk}`} />
            <SkeletonBlock className={`h-3.5 w-[85%] rounded-v2-sm ${sk}`} />
          </div>
          <SkeletonBlock className={`h-7 w-24 rounded-full ${sk}`} />
        </div>
      </section>

      {showChallengeBadges && <ProfileChallengeBadgesSkeletonV2 />}

      {/* Key stats — 3×2 grid; cards on laptop+ */}
      <section className="grid grid-cols-3 gap-y-4 border-y border-v2-outline-variant/15 py-4 lg:gap-3 lg:border-0 lg:py-0">
        <StatCellSkeleton align="left" />
        <StatCellSkeleton align="center" />
        <StatCellSkeleton align="right" />
        <StatCellSkeleton align="left" />
        <StatCellSkeleton align="center" />
        <StatCellSkeleton align="right" />
      </section>

      {/* Weekly activity */}
      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="space-y-5 rounded-lg bg-v2-surface-container-low p-5">
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center">
            <SkeletonBlock className={`size-20 shrink-0 rounded-full ${sk}`} />
            <div className="w-full flex-1 space-y-4">
              <ProgressRowSkeleton />
              <ProgressRowSkeleton />
              <ProgressRowSkeleton />
            </div>
          </div>
          <div className="border-t border-v2-outline-variant/15 pt-5">
            <div className="flex h-36 items-end justify-between gap-1.5 sm:gap-2">
              {barHeights.map((heightClass, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <SkeletonBlock
                    className={`w-full rounded-v2-sm ${heightClass} ${sk}`}
                  />
                  <SkeletonBlock className={`h-2.5 w-6 rounded-v2-sm ${sk}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main disciplines */}
      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="space-y-6 rounded-lg bg-v2-surface-container-low p-5">
          <DisciplineRowSkeleton />
          <DisciplineRowSkeleton />
          <DisciplineRowSkeleton />
        </div>
      </section>

      {/* Race history */}
      <section className="space-y-3">
        <SectionTitleSkeleton />
        <div className="hidden lg:block">
          <div className="flex gap-4 border-b border-v2-outline-variant/15 pb-2">
            {["w-16", "w-10", "w-12", "w-8", "w-14"].map((w) => (
              <SkeletonBlock
                key={w}
                className={`h-2.5 ${w} rounded-v2-sm ${sk}`}
              />
            ))}
          </div>
          <RaceRowSkeleton />
          <RaceRowSkeleton />
          <RaceRowSkeleton />
          <RaceRowSkeleton />
        </div>
        <div className="space-y-3 lg:hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-v2-outline-variant/15 bg-v2-surface-container-low p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <SkeletonBlock
                    className={`h-3.5 w-32 max-w-full rounded-v2-sm ${sk}`}
                  />
                  <SkeletonBlock className={`h-2.5 w-20 rounded-v2-sm ${sk}`} />
                </div>
                <SkeletonBlock
                  className={`h-6 w-8 shrink-0 rounded-v2-sm ${sk}`}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <SkeletonBlock className={`h-5 w-14 rounded-v2-sm ${sk}`} />
                <SkeletonBlock className={`h-3.5 w-24 rounded-v2-sm ${sk}`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats by game */}
      <section className="space-y-4">
        <SectionTitleSkeleton />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <GameStatCardSkeleton />
          <GameStatCardSkeleton />
          <GameStatCardSkeleton />
        </div>
      </section>
    </div>
  );
}
