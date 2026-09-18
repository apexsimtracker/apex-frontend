import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import type {
  ApexAnalysisDisplay,
  ApexEvidence,
} from "@/features/session-detail/apexAnalysisDisplay";
import { formatLapDelta } from "@/lib/utils";

type OverviewRow = {
  label: string;
  value: string;
  scope: "lap" | "session";
};

type SessionDetailAnalysisGridProps = {
  apexAnalysis: ApexAnalysisDisplay;
  apexConsistencyText: string;
  tireWearText: string;
  overviewRows: OverviewRow[];
  overviewLapNumber?: number | null;
  /** Hidden for manual activities and sessions with no telemetry values. */
  showTelemetryOverview?: boolean;
  /** Owner-only coaching card; hidden when viewing someone else's session. */
  showApexAnalysis?: boolean;
  canFocusTargetLap?: boolean;
  onFocusTargetLap?: () => void;
};

const CARD = "rounded-xl bg-apex-surface-container-low p-4 shadow-lg";

function confidenceClass(confidence: string): string {
  if (confidence === "HIGH") return "bg-emerald-500/15 text-emerald-300";
  if (confidence === "MEDIUM") return "bg-amber-500/15 text-amber-300";
  return "bg-apex-surface-container-highest text-apex-on-surface-variant";
}

function evidenceText(evidence: ApexEvidence): string {
  if (evidence.type === "SESSION_TREND") {
    const first = evidence.observations[0];
    const latest = evidence.observations[evidence.observations.length - 1];
    if (evidence.metric === "CONSISTENCY") {
      return `${evidence.observations.length} session observations; consistency ${first?.consistencyScore ?? "—"}% to ${latest?.consistencyScore ?? "—"}%.`;
    }
    return `${evidence.observations.length} session observations; best lap ${formatLapDelta(first?.bestLapMs)} to ${formatLapDelta(latest?.bestLapMs)}.`;
  }
  if (evidence.type === "SECTOR") {
    return `Sector ${evidence.sectorIndex}: target ${formatLapDelta(evidence.targetMs)}, baseline ${formatLapDelta(evidence.baselineMs)} (${evidence.deltaMs >= 0 ? "+" : "−"}${formatLapDelta(Math.abs(evidence.deltaMs))}).`;
  }
  if (evidence.type === "SESSION_SUMMARY") {
    return `Lap ${evidence.bestLapNumber} improved by ${formatLapDelta(evidence.improvementMs)} from the first competitive lap (${evidence.firstLapNumber}).`;
  }
  return `Lap ${evidence.targetLapNumber} braked at ${Math.round(evidence.targetBrakeOnsetM)} m versus ${Math.round(evidence.referenceBrakeOnsetM)} m on reference lap ${evidence.referenceLapNumber}; minimum speed ${Math.round(evidence.targetMinimumSpeedKmh)} versus ${Math.round(evidence.referenceMinimumSpeedKmh)} km/h; exit speed ${Math.round(evidence.targetExitSpeedKmh)} versus ${Math.round(evidence.referenceExitSpeedKmh)} km/h; zone delta ${evidence.zoneDeltaMs >= 0 ? "+" : "−"}${formatLapDelta(Math.abs(evidence.zoneDeltaMs))}.`;
}

function ApexAnalysisContent({
  analysis,
  canFocusTargetLap,
  onFocusTargetLap,
}: {
  analysis: ApexAnalysisDisplay;
  canFocusTargetLap: boolean;
  onFocusTargetLap?: () => void;
}) {
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);
  const evidenceId = useId();

  if (analysis.locked) {
    return (
      <div className="space-y-3">
        <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
          {analysis.message ?? "Upgrade to Apex Pro to unlock Apex Analysis."}
        </p>
        <Link
          to="/pricing"
          className="inline-flex rounded-apex-sm bg-apex-primary px-3 py-2 font-apex-body text-xs font-bold text-white"
        >
          Upgrade to Pro
        </Link>
      </div>
    );
  }

  if (analysis.source === "v2" && analysis.status === "INSUFFICIENT_DATA") {
    return (
      <div>
        <p className="mb-1 font-apex-body text-xs font-bold text-apex-on-surface">
          More telemetry needed
        </p>
        <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
          This session does not contain enough comparable telemetry for a
          reliable diagnostic.
        </p>
      </div>
    );
  }

  if (analysis.source === "v2" && analysis.status === "FAILED") {
    return (
      <div>
        <p className="mb-1 font-apex-body text-xs font-bold text-apex-on-surface">
          Analysis unavailable
        </p>
        <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
          Apex could not prepare a diagnostic for this session. Try again later.
        </p>
      </div>
    );
  }

  const insight = analysis.insight;
  if (insight) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-apex-headline text-base font-bold text-apex-on-surface">
            {insight.headline}
          </h3>
          <span
            className={`rounded-full px-2 py-1 font-apex-body text-[9px] font-bold uppercase tracking-wider ${confidenceClass(insight.confidence)}`}
          >
            {insight.confidence.toLowerCase()} confidence
          </span>
        </div>
        <p className="font-apex-body text-xs leading-relaxed text-apex-on-surface-variant">
          {insight.explanation}
        </p>
        <div className="rounded-lg bg-apex-surface-container p-3">
          <p className="mb-1 font-apex-body text-[9px] font-bold uppercase tracking-wider text-apex-primary">
            Next lap
          </p>
          <p className="font-apex-body text-xs font-semibold leading-relaxed text-apex-on-surface">
            {insight.action}
          </p>
        </div>
        {canFocusTargetLap && analysis.targetLapNumber != null ? (
          <button
            type="button"
            className="font-apex-body text-xs font-bold text-apex-primary hover:underline"
            onClick={onFocusTargetLap}
          >
            Focus lap {analysis.targetLapNumber}
          </button>
        ) : null}
        {insight.evidence.length > 0 ? (
          <div className="border-t border-apex-outline-variant/15 pt-2">
            <button
              type="button"
              className="font-apex-body text-[10px] font-bold uppercase tracking-wider text-apex-on-surface-variant"
              aria-expanded={evidenceExpanded}
              aria-controls={evidenceId}
              onClick={() => setEvidenceExpanded((expanded) => !expanded)}
            >
              {evidenceExpanded ? "Hide evidence" : "Show evidence"}
            </button>
            {evidenceExpanded ? (
              <ul id={evidenceId} className="mt-2 space-y-2">
                {insight.evidence.map((evidence, index) => (
                  <li
                    key={`${evidence.type}-${index}`}
                    className="font-apex-body text-[10px] leading-relaxed text-apex-on-surface-variant"
                  >
                    {evidenceText(evidence)}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  if (analysis.legacyInsights.length > 0) {
    return (
      <div>
        <p className="mb-1 font-apex-body text-xs font-bold text-apex-on-surface">
          Session insight
        </p>
        <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
          {analysis.legacyInsights.join(" ")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1 font-apex-body text-xs font-bold text-apex-on-surface">
        No analysis yet
      </p>
      <p className="font-apex-body text-[11px] leading-relaxed text-apex-on-surface-variant">
        Apex Analysis will appear here once a diagnostic is available.
      </p>
    </div>
  );
}

export default function SessionDetailAnalysisGrid({
  apexAnalysis,
  apexConsistencyText,
  tireWearText,
  overviewRows,
  overviewLapNumber,
  showTelemetryOverview = true,
  showApexAnalysis = true,
  canFocusTargetLap = false,
  onFocusTargetLap,
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
            <ApexAnalysisContent
              analysis={apexAnalysis}
              canFocusTargetLap={canFocusTargetLap}
              onFocusTargetLap={onFocusTargetLap}
            />
            {!apexAnalysis.locked && (
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
