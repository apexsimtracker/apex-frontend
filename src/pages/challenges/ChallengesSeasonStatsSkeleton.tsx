import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

function StatColumnSkeleton({
  align = "center",
  bordered = false,
}: {
  align?: "center" | "start" | "end";
  bordered?: boolean;
}) {
  const alignClass =
    align === "start"
      ? "sm:items-start"
      : align === "end"
        ? "sm:items-end sm:text-right"
        : "sm:items-start";

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2",
        alignClass,
        bordered &&
          "border-y border-apex-outline-variant/15 py-6 sm:border-x sm:border-y-0 sm:py-0",
      )}
    >
      <SkeletonBlock
        className={cn("h-3 w-24 rounded-apex-sm", blockClassName)}
      />
      <SkeletonBlock
        className={cn("h-9 w-16 rounded-apex-sm", blockClassName)}
      />
      <SkeletonBlock
        className={cn("h-3 w-28 rounded-apex-sm", blockClassName)}
      />
    </div>
  );
}

export default function ChallengesSeasonStatsSkeleton() {
  return (
    <section
      className="border-y border-apex-outline-variant/15 py-5"
      aria-busy="true"
      aria-label="Loading challenge stats"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-0">
        <StatColumnSkeleton align="start" />
        <StatColumnSkeleton bordered />
        <StatColumnSkeleton align="end" />
      </div>
    </section>
  );
}
