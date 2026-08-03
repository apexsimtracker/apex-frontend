import { SkeletonBlock } from "@/components/ui/skeleton";

const sk = "bg-apex-surface-container-highest";

/**
 * Mirrors Driver Settings layout: title + 7/5 column section cards.
 * Used for route Suspense and in-page auth loading.
 */
export default function SettingsPageSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-6 py-8"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="mb-10">
        <SkeletonBlock
          height={36}
          width={220}
          className={`mb-2 rounded ${sk}`}
        />
        <SkeletonBlock height={16} width={320} className={`rounded ${sk}`} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          <SkeletonBlock
            height={360}
            className={`rounded-apex-lg ${sk}`}
          />
          <SkeletonBlock
            height={240}
            className={`rounded-apex-lg ${sk}`}
          />
          <SkeletonBlock
            height={280}
            className={`rounded-apex-lg ${sk}`}
          />
        </div>
        <div className="space-y-10 lg:col-span-5">
          <SkeletonBlock
            height={160}
            className={`rounded-apex-lg ${sk}`}
          />
          <SkeletonBlock
            height={220}
            className={`rounded-apex-lg ${sk}`}
          />
          <SkeletonBlock
            height={240}
            className={`rounded-apex-lg ${sk}`}
          />
          <SkeletonBlock
            height={180}
            className={`rounded-apex-lg ${sk}`}
          />
        </div>
      </div>
    </div>
  );
}
