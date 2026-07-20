import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <SkeletonBlock
            height={12}
            width={120}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={9}
            width={64}
            className={blockClassName}
            rounded="sm"
          />
        </div>
        <SkeletonBlock
          height={20}
          width={72}
          className={blockClassName}
          rounded="sm"
        />
      </div>
      <SkeletonBlock
        height={10}
        width={48}
        className={blockClassName}
        rounded="sm"
      />
      <SkeletonBlock
        height={14}
        width={140}
        className={`${blockClassName} mt-1`}
        rounded="sm"
      />
    </div>
  );
}

type PersonalBestsSkeletonProps = {
  contentOnly?: boolean;
};

export default function PersonalBestsSkeleton({
  contentOnly = false,
}: PersonalBestsSkeletonProps) {
  return (
    <div className="space-y-6">
      {!contentOnly ? (
        <section className="grid grid-cols-3 gap-y-2 border-y border-apex-outline-variant/15 py-4">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className={cn(
                "flex flex-col gap-2",
                i === 1 && "items-center",
                i === 2 && "items-end",
              )}
            >
              <SkeletonBlock
                height={10}
                width={56}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={32}
                width={40}
                className={blockClassName}
                rounded="sm"
              />
            </div>
          ))}
        </section>
      ) : null}

      <div className="space-y-3">
        {([0, 1, 2, 3] as const).map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
