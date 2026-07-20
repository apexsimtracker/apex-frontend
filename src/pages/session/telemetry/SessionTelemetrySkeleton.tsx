/** Compact placeholder while SessionTelemetry chunk loads. */
export default function SessionTelemetrySkeleton() {
  return (
    <section
      className="rounded-xl bg-apex-surface-container-low p-4 shadow-lg"
      data-testid="telemetry-chunk-loading"
      aria-busy="true"
      aria-label="Loading telemetry"
    >
      <h3 className="mb-3 font-apex-headline text-lg font-bold tracking-tight text-apex-on-surface">
        Telemetry Analysis
      </h3>
      <div className="h-40 animate-pulse rounded-lg bg-apex-surface-container" />
    </section>
  );
}
