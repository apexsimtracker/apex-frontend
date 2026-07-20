import { SkeletonBlock } from "@/components/ui/skeleton";

const blockClassName = "bg-apex-surface-container-high/80";

export function FeedSkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container-low shadow-sm">
      <div className="space-y-3 p-4 lg:p-5">
        <div className="flex items-center justify-between">
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
          <SkeletonBlock
            height={28}
            width={56}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex gap-2">
            <SkeletonBlock
              height={16}
              width={40}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={16}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={10}
            width={80}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={28}
            width="72%"
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="space-y-2 border-t border-apex-outline-variant/10 pt-4">
          <SkeletonBlock
            height={10}
            width={48}
            className={blockClassName}
            rounded="sm"
          />
          <SkeletonBlock
            height={32}
            width={112}
            className={blockClassName}
            rounded="sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-apex-outline-variant/10 pt-4">
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className="space-y-2">
              <SkeletonBlock
                height={9}
                width={40}
                className={blockClassName}
                rounded="sm"
              />
              <SkeletonBlock
                height={14}
                width="80%"
                className={blockClassName}
                rounded="sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-apex-outline-variant/10 pt-3">
          <div className="flex gap-5">
            <SkeletonBlock
              height={18}
              width={44}
              className={blockClassName}
              rounded="sm"
            />
            <SkeletonBlock
              height={18}
              width={36}
              className={blockClassName}
              rounded="sm"
            />
          </div>
          <SkeletonBlock
            height={18}
            width={18}
            className={blockClassName}
            rounded="sm"
          />
        </div>
      </div>
    </div>
  );
}

/** Full home Dashboard placeholder (chunk + data loading). */
export default function DashboardSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col space-y-6 px-6 py-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <SkeletonBlock
          height={28}
          width={180}
          className="bg-apex-surface-container-high"
          rounded="sm"
        />
        <SkeletonBlock
          height={14}
          width={240}
          className="bg-apex-surface-container-high"
          rounded="sm"
        />
      </div>

      <section className="space-y-2">
        <SkeletonBlock
          height={20}
          width={120}
          className="bg-apex-surface-container-high"
          rounded="sm"
        />
        <div className="grid grid-cols-3 gap-2">
          {([0, 1, 2] as const).map((i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-xl bg-apex-surface-container-low p-3"
            >
              <SkeletonBlock
                height={56}
                width={56}
                rounded="full"
                className="bg-apex-surface-container-high"
              />
              <SkeletonBlock
                height={10}
                width={48}
                className="bg-apex-surface-container-high"
                rounded="sm"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SkeletonBlock
          height={20}
          width={140}
          className="bg-apex-surface-container-high"
          rounded="sm"
        />
        <div className="space-y-6">
          <FeedSkeletonCard />
          <FeedSkeletonCard />
          <FeedSkeletonCard />
        </div>
      </section>
    </div>
  );
}
