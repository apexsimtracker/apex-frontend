import { SkeletonBlock } from "@/components/ui/skeleton";

export default function SessionsOverviewStatsSkeleton() {
  const blockClassName = "bg-apex-surface-container-high/80";
  return (
    <section className="animate-pulse border-y border-apex-outline-variant/15 py-5">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0">
        {([0, 1, 2, 3] as const).map((i) => (
          <div
            key={i}
            className="flex flex-col items-center gap-2 sm:items-start"
          >
            <SkeletonBlock
              height={10}
              width={64}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={32}
              width={56}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={10}
              width={80}
              className={blockClassName}
              rounded="sm"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
