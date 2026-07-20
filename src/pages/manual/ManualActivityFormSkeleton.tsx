import { SkeletonBlock } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const blockClassName = "bg-apex-surface-container-high/80";

function FormSectionSkeleton({ fieldCount = 2 }: { fieldCount?: number }) {
  return (
    <section className="rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container-low p-5 sm:p-6">
      <SkeletonBlock
        className={cn("mb-4 h-3 w-28 rounded-apex-sm", blockClassName)}
      />
      <div className="space-y-4">
        {Array.from({ length: fieldCount }, (_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonBlock
              className={cn("h-2.5 w-16 rounded-apex-sm", blockClassName)}
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

export default function ManualActivityFormSkeleton() {
  return (
    <div
      className="space-y-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading manual entry form"
    >
      <FormSectionSkeleton fieldCount={3} />
      <FormSectionSkeleton fieldCount={2} />
      <section className="rounded-apex-lg border border-apex-outline-variant/15 bg-apex-surface-container-low p-5 sm:p-6">
        <SkeletonBlock
          className={cn("mb-4 h-3 w-24 rounded-apex-sm", blockClassName)}
        />
        <SkeletonBlock
          className={cn("h-32 w-full rounded-[0.5rem]", blockClassName)}
        />
      </section>
      <SkeletonBlock
        className={cn("h-12 w-full rounded-apex-sm", blockClassName)}
      />
    </div>
  );
}
