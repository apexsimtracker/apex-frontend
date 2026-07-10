import { Sparkles } from "lucide-react";

type SessionDetailAnalysisGridV2Props = {
  apexBody: string;
  apexConsistencyText: string;
};

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

// NOTE(dummy): Telemetry overview values are static until backend exposes them.
const TELEMETRY_OVERVIEW = [
  { label: "Top speed", value: "338 km/h" },
  { label: "Avg brake force", value: "88%" },
  { label: "Time in 8th gear", value: "14.2s" },
] as const;

export default function SessionDetailAnalysisGridV2({
  apexBody,
  apexConsistencyText,
}: SessionDetailAnalysisGridV2Props) {
  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl border-l-4 border-v2-primary bg-v2-surface-container-low p-4 shadow-lg">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="size-5 text-v2-primary" aria-hidden />
          <h2 className="font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-primary">
            Apex analysis
          </h2>
        </div>
        <div className="space-y-4">
          <div>
            <p className="mb-1 font-v2-body text-xs font-bold text-v2-on-surface">
              Strong pace
            </p>
            <p className="font-v2-body text-[11px] leading-relaxed text-v2-on-surface-variant">
              {apexBody}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded bg-v2-surface-container p-2.5">
              <p className="mb-0.5 font-v2-body text-[9px] font-bold uppercase text-v2-on-surface-variant">
                Consistency
              </p>
              <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                {apexConsistencyText}
              </p>
            </div>
            {/* NOTE(dummy): Tire wear not provided by backend yet. */}
            <div className="rounded bg-v2-surface-container p-2.5">
              <p className="mb-0.5 font-v2-body text-[9px] font-bold uppercase text-v2-on-surface-variant">
                Tire wear
              </p>
              <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                12%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-4 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Telemetry overview
        </p>
        <div className="space-y-3">
          {TELEMETRY_OVERVIEW.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between font-v2-body text-xs"
            >
              <span className="text-v2-on-surface-variant">{row.label}</span>
              <span className="font-bold text-v2-on-surface">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
