import { Sparkles } from "lucide-react";

type OverviewRow = {
  label: string;
  value: string;
  scope: "lap" | "session";
};

type SessionDetailAnalysisGridProps = {
  apexTitle: string;
  apexBody: string;
  apexLocked?: boolean;
  apexConsistencyText: string;
  tireWearText: string;
  overviewRows: OverviewRow[];
  overviewLapNumber?: number | null;
  /** Hidden for manual activities and sessions with no telemetry values. */
  showTelemetryOverview?: boolean;
  /** Owner-only coaching card; hidden when viewing someone else's session. */
  showApexAnalysis?: boolean;
};

const CARD = "rounded-xl bg-apex-surface-container-low p-4 shadow-lg";

export default function SessionDetailAnalysisGrid({
  apexTitle,
  apexBody,
  apexLocked = false,
  apexConsistencyText,
  tireWearText,
  overviewRows,
  overviewLapNumber,
  showTelemetryOverview = true,
  showApexAnalysis = true,
}: SessionDetailAnalysisGridProps) {
  const lapRows = overviewRows.filter((row) => row.scope === "lap");
  const sessionRows = overviewRows.filter((row) => row.scope === "session");

  if (!showApexAnalysis && !showTelemetryOverview) {
    return null;
  }

  const useTwoColumns = showApexAnalysis && showTelemetryOverview;

  return (
    <section
      className={`grid grid-cols-1 gap-4 ${useTwoColumns ? "md:grid-cols-2" : ""}`}
    >
      {showApexAnalysis ? (
        <div className="rounded-xl border-l-4 border-apex-primary bg-apex-surface-container-low p-4 shadow-lg">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="size-5 text-apex-primary" aria-hidden />
            <h2 className="font-apex-headline text-xs font-bold uppercase tracking-widest text-apex-primary">
              Apex analysis
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="mb-1 font-apex-body text-xs font-bold text-apex-on-surface">
                {apexTitle}
              </p>
              <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
                {apexBody}
              </p>
            </div>
            {!apexLocked && (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded bg-apex-surface-container p-2.5">
                  <p className="mb-0.5 font-apex-body text-[9px] font-bold uppercase text-apex-on-surface-variant">
                    Consistency
                  </p>
                  <p className="font-apex-headline text-lg font-bold text-apex-on-surface">
                    {apexConsistencyText}
                  </p>
                </div>
                <div className="rounded bg-apex-surface-container p-2.5">
                  <p className="mb-0.5 font-apex-body text-[9px] font-bold uppercase text-apex-on-surface-variant">
                    Tire wear
                  </p>
                  <p className="font-apex-headline text-lg font-bold text-apex-on-surface">
                    {tireWearText}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {showTelemetryOverview ? (
        <div className={CARD}>
          <p className="mb-3 font-apex-body text-[10px] font-bold uppercase tracking-widest text-apex-on-surface-variant">
            Telemetry overview
          </p>
          <div className="space-y-4">
            <div className="rounded-lg bg-apex-surface-container p-3">
              <div className="mb-3 flex items-start justify-between gap-3 border-b border-apex-outline-variant/15 pb-2.5">
                <div>
                  <p className="font-apex-headline text-[10px] font-bold uppercase tracking-wider text-apex-on-surface">
                    Selected lap
                  </p>
                  <p className="mt-0.5 font-apex-body text-[10px] text-apex-on-surface-variant">
                    Updates when you select another lap
                  </p>
                </div>
                <span className="shrink-0 rounded-apex-sm border border-apex-primary/30 bg-apex-primary/10 px-2 py-1 font-apex-headline text-[10px] font-bold text-apex-primary">
                  {overviewLapNumber != null
                    ? `Lap ${overviewLapNumber}`
                    : "No lap"}
                </span>
              </div>
              <div className="space-y-2.5">
                {lapRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between font-apex-body text-xs"
                  >
                    <span className="text-apex-on-surface-variant">
                      {row.label}
                    </span>
                    <span className="font-bold text-apex-on-surface">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {sessionRows.length > 0 ? (
              <div className="px-1">
                <div className="mb-2.5 flex items-end justify-between gap-3">
                  <p className="font-apex-headline text-[10px] font-bold uppercase tracking-wider text-apex-on-surface">
                    Session conditions
                  </p>
                  <p className="font-apex-body text-[9px] text-apex-on-surface-variant">
                    Same for every lap
                  </p>
                </div>
                <div className="space-y-2.5">
                  {sessionRows.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between font-apex-body text-xs"
                    >
                      <span className="text-apex-on-surface-variant">
                        {row.label}
                      </span>
                      <span className="font-bold text-apex-on-surface">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
