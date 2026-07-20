import { SkeletonBlock } from "@/components/ui/skeleton";
import SessionsOverviewStatsSkeleton from "@/pages/sessions/SessionsOverviewStatsSkeleton";

const blockClassName = "bg-apex-surface-container-high/80";

export function SessionsListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-5"
        >
          <div className="flex items-center gap-3">
            <SkeletonBlock
              height={36}
              width={36}
              rounded="full"
              className={blockClassName}
            />
            <div className="space-y-2">
              <SkeletonBlock
                height={12}
                width={96}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={10}
                width={52}
                className={blockClassName}
                rounded="sm"
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <SkeletonBlock
              height={20}
              width="60%"
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={14}
              width="40%"
              className={blockClassName}
              rounded="sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full Sessions library placeholder (chunk + initial data loading). */
export default function SessionsPageSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <section className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <SkeletonBlock
            height={32}
            width={160}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={14}
            width={280}
            className={blockClassName}
            rounded="sm"
          />
        </div>
        <div className="flex gap-2">
          <SkeletonBlock
            height={40}
            width={100}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={40}
            width={100}
            className={blockClassName}
            rounded="sm"
          />
        </div>
      </section>

      <div className="mb-6">
        <SessionsOverviewStatsSkeleton />
      </div>

      <div className="mb-4 flex gap-2">
        {([0, 1, 2, 3] as const).map((i) => (
          <SkeletonBlock
            key={i}
            height={36}
            width={88}
            className={blockClassName}
            rounded="sm"
          />
        ))}
      </div>

      <SessionsListSkeleton />
    </div>
  );
}
