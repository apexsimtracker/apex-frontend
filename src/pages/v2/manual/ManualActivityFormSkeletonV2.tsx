import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-v2-surface-container-high/80";

function FormSectionSkeletonV2({ fieldCount = 2 }: { fieldCount?: number }) {
  return (
    <section className="rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-5 sm:p-6">
      <SkeletonBlock
        className={cn("mb-4 h-3 w-28 rounded-v2-sm", blockClassName)}
      />
      <div className="space-y-4">
        {Array.from({ length: fieldCount }, (_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock
              className={cn("h-2.5 w-16 rounded-v2-sm", blockClassName)}
            />
            <SkeletonBlock
              className={cn("h-12 w-full rounded-[0.5rem]", blockClassName)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ManualActivityFormSkeletonV2() {
  return (
    <div
      className="space-y-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading manual entry form"
    >
      <FormSectionSkeletonV2 fieldCount={3} />
      <FormSectionSkeletonV2 fieldCount={2} />
      <section className="rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-5 sm:p-6">
        <SkeletonBlock
          className={cn("mb-4 h-3 w-24 rounded-v2-sm", blockClassName)}
        />
        <SkeletonBlock
          className={cn("h-32 w-full rounded-[0.5rem]", blockClassName)}
        />
      </section>
      <SkeletonBlock
        className={cn("h-12 w-full rounded-v2-sm", blockClassName)}
      />
    </div>
  );
}
