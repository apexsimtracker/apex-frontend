import { SkeletonBlock } from "@/components/ui/skeleton";

function FeatureRowSkeleton() {
  return (
    <div className="flex items-start gap-3">
      <SkeletonBlock
        height={16}
        width={16}
        rounded="full"
        className="mt-0.5 shrink-0 bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={14}
        className="flex-1 bg-apex-surface-container-highest"
      />
    </div>
  );
}

function FreePlanCardSkeleton() {
  return (
    <div className="flex h-full flex-col rounded-xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-6 sm:p-7">
      <SkeletonBlock
        height={20}
        width={64}
        className="bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={36}
        width={48}
        className="mt-1 bg-apex-surface-container-highest"
      />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <FeatureRowSkeleton key={i} />
        ))}
      </div>
      <div className="mt-auto pt-8">
        <SkeletonBlock
          height={40}
          className="w-full rounded-apex-sm bg-apex-surface-container-highest"
        />
      </div>
    </div>
  );
}

function ProPlanCardSkeleton() {
  return (
    <div
      className="relative flex h-full flex-col rounded-xl border-2 bg-apex-surface-container-low p-6 sm:p-7"
      style={{
        borderColor: "color-mix(in srgb, rgb(240, 28, 28) 60%, transparent)",
      }}
    >
      <SkeletonBlock
        height={24}
        width={48}
        rounded="full"
        className="absolute -top-3 left-6 bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={20}
        width={80}
        className="bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={40}
        className="mt-5 w-full rounded-apex-sm bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={36}
        width={72}
        className="mt-4 bg-apex-surface-container-highest"
      />
      <SkeletonBlock
        height={14}
        width={120}
        className="mt-1 bg-apex-surface-container-highest"
      />
      <div className="mt-6 space-y-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <FeatureRowSkeleton key={i} />
        ))}
      </div>
      <div className="mt-auto space-y-3 pt-6">
        <SkeletonBlock
          height={40}
          className="w-full rounded-apex-sm bg-apex-surface-container-highest"
        />
        <SkeletonBlock
          height={12}
          width="70%"
          className="mx-auto bg-apex-surface-container-highest"
        />
      </div>
    </div>
  );
}

export function PricingPageSkeleton() {
  return (
    <div className="mt-10 grid gap-6 md:grid-cols-2 md:items-stretch">
      <FreePlanCardSkeleton />
      <ProPlanCardSkeleton />
    </div>
  );
}
