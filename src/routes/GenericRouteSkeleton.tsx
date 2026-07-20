import { SkeletonBlock } from "@/components/ui/skeleton";

const block = "bg-apex-surface-container-high/80";

/** Default product content placeholder while a lazy route chunk loads. */
export function GenericRouteSkeleton() {
  return (
    <div
      className="mx-auto flex min-h-[40vh] w-full max-w-5xl flex-1 flex-col space-y-6 px-6 py-8"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-3">
        <SkeletonBlock height={28} width="40%" className={block} rounded="sm" />
        <SkeletonBlock height={14} width="65%" className={block} rounded="sm" />
      </div>
      <div className="space-y-4">
        {([0, 1, 2] as const).map((i) => (
          <div
            key={i}
            className="animate-pulse space-y-3 rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container-low p-5"
          >
            <SkeletonBlock
              height={16}
              width="50%"
              className={block}
              rounded="sm"
            />
            <SkeletonBlock
              height={12}
              width="80%"
              className={block}
              rounded="sm"
            />
            <SkeletonBlock
              height={12}
              width="60%"
              className={block}
              rounded="sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin content pane placeholder while a lazy admin page chunk loads. */
export function AdminRouteSkeleton() {
  return (
    <div
      className="mx-auto w-full max-w-6xl space-y-6"
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="space-y-2">
        <SkeletonBlock height={24} width={200} className="bg-muted" rounded="sm" />
        <SkeletonBlock height={14} width={320} className="bg-muted" rounded="sm" />
      </div>
      <div className="space-y-3 rounded-lg border border-border p-4">
        {([0, 1, 2, 3, 4] as const).map((i) => (
          <SkeletonBlock
            key={i}
            height={40}
            width="100%"
            className="bg-muted"
            rounded="md"
          />
        ))}
      </div>
    </div>
  );
}
