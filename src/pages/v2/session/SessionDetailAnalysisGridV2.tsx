import { Sparkles } from "lucide-react";

type OverviewRow = {
  label: string;
  value: string;
  scope: "lap" | "session";
};

type SessionDetailAnalysisGridV2Props = {
  apexTitle: string;
  apexBody: string;
  apexLocked?: boolean;
  apexConsistencyText: string;
  tireWearText: string;
  overviewRows: OverviewRow[];
  overviewLapNumber?: number | null;
};

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

export default function SessionDetailAnalysisGridV2({
  apexTitle,
  apexBody,
  apexLocked = false,
  apexConsistencyText,
  tireWearText,
  overviewRows,
  overviewLapNumber,
}: SessionDetailAnalysisGridV2Props) {
  const lapRows = overviewRows.filter((row) => row.scope === "lap");
  const sessionRows = overviewRows.filter((row) => row.scope === "session");

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
              {apexTitle}
            </p>
            <p className="font-v2-body text-[11px] leading-relaxed text-v2-on-surface-variant">
              {apexBody}
            </p>
          </div>
          {!apexLocked && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded bg-v2-surface-container p-2.5">
                <p className="mb-0.5 font-v2-body text-[9px] font-bold uppercase text-v2-on-surface-variant">
                  Consistency
                </p>
                <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                  {apexConsistencyText}
                </p>
              </div>
              <div className="rounded bg-v2-surface-container p-2.5">
                <p className="mb-0.5 font-v2-body text-[9px] font-bold uppercase text-v2-on-surface-variant">
                  Tire wear
                </p>
                <p className="font-v2-headline text-lg font-bold text-v2-on-surface">
                  {tireWearText}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={CARD}>
        <p className="mb-3 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Telemetry overview
        </p>
        <div className="space-y-4">
          <div className="rounded-lg bg-v2-surface-container p-3">
            <div className="mb-3 flex items-start justify-between gap-3 border-b border-v2-outline-variant/15 pb-2.5">
              <div>
                <p className="font-v2-headline text-[10px] font-bold uppercase tracking-wider text-v2-on-surface">
                  Selected lap
                </p>
                <p className="mt-0.5 font-v2-body text-[10px] text-v2-on-surface-variant">
                  Updates when you select another lap
                </p>
              </div>
              <span className="shrink-0 rounded-v2-sm border border-v2-primary/30 bg-v2-primary/10 px-2 py-1 font-v2-headline text-[10px] font-bold text-v2-primary">
                {overviewLapNumber != null
                  ? `Lap ${overviewLapNumber}`
                  : "No lap"}
              </span>
            </div>
            <div className="space-y-2.5">
              {lapRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between font-v2-body text-xs"
                >
                  <span className="text-v2-on-surface-variant">
                    {row.label}
                  </span>
                  <span className="font-bold text-v2-on-surface">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {sessionRows.length > 0 ? (
            <div className="px-1">
              <div className="mb-2.5 flex items-end justify-between gap-3">
                <p className="font-v2-headline text-[10px] font-bold uppercase tracking-wider text-v2-on-surface">
                  Session conditions
                </p>
                <p className="font-v2-body text-[9px] text-v2-on-surface-variant">
                  Same for every lap
                </p>
              </div>
              <div className="space-y-2.5">
                {sessionRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between font-v2-body text-xs"
                  >
                    <span className="text-v2-on-surface-variant">
                      {row.label}
                    </span>
                    <span className="font-bold text-v2-on-surface">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
