import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const sk = "bg-apex-surface-container-high/80";

/**
 * Mirrors Apex Agent page: outer max-w-5xl shell, inner max-w-4xl column
 * with platform tabs, callout, sim rows, status, and CTA.
 */
export default function AgentPageSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8"
      aria-busy="true"
      aria-label="Loading agent"
    >
      <section className="mx-auto mb-8 w-full max-w-4xl space-y-2">
        <SkeletonBlock height={36} width={180} className={sk} rounded="sm" />
        <SkeletonBlock height={14} width={280} className={sk} rounded="sm" />
      </section>

      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 inline-flex w-full gap-2 p-1">
          {([0, 1, 2] as const).map((i) => (
            <SkeletonBlock
              key={i}
              height={36}
              className={cn("min-w-0 flex-1 rounded", sk)}
            />
          ))}
        </div>

        <section className="mb-8">
          <div className="rounded-r-lg border-l-4 border-apex-primary/40 bg-apex-surface-container/50 p-4">
            <SkeletonBlock
              height={12}
              width={96}
              className={cn("mb-3", sk)}
              rounded="sm"
            />
            <div className="space-y-2">
              <SkeletonBlock height={12} width="100%" className={sk} rounded="sm" />
              <SkeletonBlock height={12} width="92%" className={sk} rounded="sm" />
              <SkeletonBlock height={12} width="75%" className={sk} rounded="sm" />
            </div>
          </div>
        </section>

        <section className="mb-8">
          <SkeletonBlock
            height={12}
            width={160}
            className={cn("mb-4", sk)}
            rounded="sm"
          />
          <div className="space-y-3">
            {([0, 1, 2] as const).map((i) => (
              <div
                key={i}
                className="rounded-lg border border-[#2a2a2a] bg-apex-surface-container p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <SkeletonBlock
                      height={20}
                      width={20}
                      rounded="full"
                      className={sk}
                    />
                    <SkeletonBlock
                      height={14}
                      width={120}
                      className={sk}
                      rounded="sm"
                    />
                  </div>
                  <SkeletonBlock
                    height={12}
                    width={72}
                    className={sk}
                    rounded="sm"
                  />
                </div>
                <SkeletonBlock
                  height={12}
                  width="70%"
                  className={cn("mt-3 ml-8", sk)}
                  rounded="sm"
                />
              </div>
            ))}
          </div>
        </section>

        <div className="mb-10 rounded-lg border border-[#2a2a2a] bg-[#121212] p-4">
          <SkeletonBlock height={12} width="85%" className={sk} rounded="sm" />
        </div>

        <section className="mb-8">
          <SkeletonBlock
            height={12}
            width={140}
            className={cn("mb-4", sk)}
            rounded="sm"
          />
          <div className="rounded-lg border border-[#2a2a2a] bg-apex-surface-container p-6 space-y-4">
            {([0, 1, 2] as const).map((i) => (
              <div key={i} className="flex gap-3">
                <SkeletonBlock
                  height={24}
                  width={24}
                  rounded="full"
                  className={cn("shrink-0", sk)}
                />
                <SkeletonBlock
                  height={14}
                  className={cn("min-w-0 flex-1", sk)}
                  rounded="sm"
                />
              </div>
            ))}
          </div>
        </section>

        <SkeletonBlock height={48} className={cn("w-full rounded-lg", sk)} />
      </div>
    </div>
  );
}
