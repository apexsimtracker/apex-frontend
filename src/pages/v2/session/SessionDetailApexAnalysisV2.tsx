import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { formatLapDelta } from "@/lib/utils";
import type { SessionDetail } from "@/features/session-detail/sessionDetailData";

type SessionDetailApexAnalysisV2Props = {
  apexInsightsLocked: boolean;
  apexInsightLines: string[];
  lockedMessage?: string | null;
  compareToPrevious: SessionDetail["compareToPrevious"];
};

const PANEL =
  "rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-6";

export default function SessionDetailApexAnalysisV2({
  apexInsightsLocked,
  apexInsightLines,
  lockedMessage,
  compareToPrevious,
}: SessionDetailApexAnalysisV2Props) {
  return (
    <section className={PANEL}>
      <h2 className="font-v2-headline text-lg font-semibold text-v2-on-surface">
        Apex Analysis
      </h2>

      {apexInsightsLocked ? (
        <div className="mt-4 rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-high/40 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
              Coaching insights
            </span>
            <Link
              to="/v2/pricing"
              className="font-v2-body text-xs font-medium text-v2-primary transition-colors hover:text-v2-primary/80"
            >
              Unlock with Pro
            </Link>
          </div>
          <p className="mt-2 font-v2-body text-sm leading-relaxed text-v2-on-surface-variant">
            {lockedMessage ?? "Unlock Apex Analysis with Apex Pro"}
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {apexInsightLines.length === 0 ? (
            <p className="font-v2-body text-sm text-v2-on-surface-variant">
              No coaching insights for this session yet. Upload telemetry with
              lap data to generate analysis.
            </p>
          ) : (
            apexInsightLines.map((line, idx) => (
              <div
                key={idx}
                className="border-l-4 border-v2-primary bg-v2-surface-container-high/40 p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles
                    className="size-5 shrink-0 text-v2-primary"
                    aria-hidden
                  />
                  <span className="font-v2-headline text-xs font-bold uppercase tracking-widest text-v2-primary">
                    Insight
                  </span>
                </div>
                <p className="font-v2-body text-sm leading-relaxed text-v2-on-surface">
                  {line}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {compareToPrevious && (
        <div className="mt-6 border-t border-v2-outline-variant/10 pt-4">
          <p className="font-v2-headline text-[10px] font-semibold uppercase tracking-[0.2em] text-v2-on-surface-variant">
            Compared to previous session
          </p>
          <div className="mt-2 space-y-1 font-v2-body text-sm text-v2-on-surface-variant">
            {compareToPrevious.bestLapDiffMs != null && (
              <p>
                Best lap{" "}
                {compareToPrevious.bestLapDiffMs < 0
                  ? "improved"
                  : "was slower"}{" "}
                by{" "}
                <span className="text-v2-on-surface">
                  {formatLapDelta(Math.abs(compareToPrevious.bestLapDiffMs))}
                </span>
              </p>
            )}
            {compareToPrevious.medianLapDiffMs != null && (
              <p>
                Median pace{" "}
                {compareToPrevious.medianLapDiffMs < 0
                  ? "improved"
                  : "was slower"}{" "}
                by{" "}
                <span className="text-v2-on-surface">
                  {formatLapDelta(Math.abs(compareToPrevious.medianLapDiffMs))}
                </span>
              </p>
            )}
            {compareToPrevious.consistencyDiffPct != null && (
              <p>
                Consistency{" "}
                {compareToPrevious.consistencyDiffPct > 0
                  ? "improved"
                  : "decreased"}{" "}
                by{" "}
                <span className="text-v2-on-surface">
                  {Math.abs(compareToPrevious.consistencyDiffPct).toFixed(1)}%
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
