import { formatLapMs } from "@/lib/utils";
import { formatLapDeltaMsForDisplay } from "@/features/session-detail/sessionInsights";
import {
  DEFAULT_LAP_TIMING_HIGHLIGHTS,
  type LapTimingHighlights,
  type TimingHighlight,
} from "@/lib/sessionLapDisplay";
import type { NormalizedLap } from "@/features/session-detail/sessionDetailData";

type SessionLapTableProps = {
  laps: NormalizedLap[];
  lapHighlights: Map<number, LapTimingHighlights>;
  bestLapMsFromLaps: number | null;
  canShowMore: boolean;
  onShowMore: () => void;
  selectedLap?: number | null;
  onSelectLap?: (lapNumber: number) => void;
  /** When true, hide S1/S2/S3 and show Lap + Time + Δ only. */
  hideSectorColumns?: boolean;
};

function loveableHighlightClass(h: TimingHighlight): string {
  return h === "purple" ? "text-purple-400" : "text-apex-on-surface";
}

function sectorWeightClass(isFastest: boolean, h: TimingHighlight): string {
  return isFastest || h !== "default" ? "font-bold" : "";
}

const HEADER_CELL =
  "px-2 py-3 whitespace-nowrap font-apex-headline text-[10px] font-bold tracking-widest text-apex-on-surface-variant";

export default function SessionLapTable({
  laps,
  lapHighlights,
  bestLapMsFromLaps,
  canShowMore,
  onShowMore,
  selectedLap = null,
  onSelectLap,
  hideSectorColumns = false,
}: SessionLapTableProps) {
  const colCount = hideSectorColumns ? 3 : 6;

  return (
    <div className="overflow-hidden rounded-xl bg-apex-surface-container-low shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse text-left">
          <thead>
            <tr className="border-b border-apex-outline-variant/15">
              <th className={HEADER_CELL}>Lap</th>
              {!hideSectorColumns ? (
                <>
                  <th className={HEADER_CELL}>S1</th>
                  <th className={HEADER_CELL}>S2</th>
                  <th className={HEADER_CELL}>S3</th>
                </>
              ) : null}
              <th className={`${HEADER_CELL} text-right`}>Time</th>
              <th className={`${HEADER_CELL} text-right`}>Δ</th>
            </tr>
          </thead>
          <tbody className="font-apex-body text-[11px]">
            {laps.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center font-apex-body text-sm text-apex-on-surface-variant"
                >
                  No laps recorded yet.
                </td>
              </tr>
            ) : (
              laps.map((row, index) => {
                const rowHighlights =
                  lapHighlights.get(row.lap) ?? DEFAULT_LAP_TIMING_HIGHLIGHTS;
                const isFastest =
                  bestLapMsFromLaps != null && row.timeMs === bestLapMsFromLaps;
                const isSelected = selectedLap === row.lap;
                const deltaMs =
                  typeof row.deltaMs === "number"
                    ? row.deltaMs
                    : bestLapMsFromLaps != null
                      ? row.timeMs - bestLapMsFromLaps
                      : null;
                return (
                  <tr
                    key={`lap-${row.lap}-${index}`}
                    data-testid={`lap-row-${row.lap}`}
                    onClick={() => onSelectLap?.(row.lap)}
                    className={
                      isFastest
                        ? "cursor-pointer border-b border-purple-400/20 bg-purple-400/10"
                        : isSelected
                          ? "cursor-pointer border-b border-apex-primary/30 bg-apex-primary/10"
                          : "cursor-pointer border-b border-apex-outline-variant/5 transition-colors hover:bg-apex-surface-container"
                    }
                  >
                    <td
                      className={`whitespace-nowrap px-2 py-3 ${
                        isFastest
                          ? "font-bold italic text-purple-400"
                          : "text-apex-on-surface-variant"
                      }`}
                    >
                      {row.lap}
                      {row.isOutLap ? (
                        <span className="ml-1 rounded bg-apex-surface-container px-1 py-0.5 font-apex-body text-[9px] font-bold uppercase tracking-wide text-apex-on-surface-variant">
                          Out
                        </span>
                      ) : null}
                    </td>
                    {!hideSectorColumns ? (
                      <>
                        <td
                          className={`whitespace-nowrap px-2 py-3 ${sectorWeightClass(
                            isFastest,
                            rowHighlights.s1,
                          )} ${loveableHighlightClass(rowHighlights.s1)}`}
                        >
                          {formatLapMs(row.sector1Ms)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2 py-3 ${sectorWeightClass(
                            isFastest,
                            rowHighlights.s2,
                          )} ${loveableHighlightClass(rowHighlights.s2)}`}
                        >
                          {formatLapMs(row.sector2Ms)}
                        </td>
                        <td
                          className={`whitespace-nowrap px-2 py-3 ${sectorWeightClass(
                            isFastest,
                            rowHighlights.s3,
                          )} ${loveableHighlightClass(rowHighlights.s3)}`}
                        >
                          {formatLapMs(row.sector3Ms)}
                        </td>
                      </>
                    ) : null}
                    <td
                      className={`whitespace-nowrap px-2 py-3 text-right font-apex-headline font-bold ${
                        isFastest || rowHighlights.lap === "purple"
                          ? "text-purple-400"
                          : "text-apex-on-surface"
                      }`}
                    >
                      {formatLapMs(row.timeMs)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right text-apex-on-surface-variant">
                      {deltaMs != null &&
                      Number.isFinite(deltaMs) &&
                      Math.abs(deltaMs) >= 0.5
                        ? formatLapDeltaMsForDisplay(deltaMs)
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {canShowMore && (
        <div className="flex justify-center border-t border-apex-outline-variant/10 py-4">
          <button
            type="button"
            onClick={onShowMore}
            className="font-apex-body text-[10px] font-bold uppercase tracking-widest text-apex-on-surface-variant transition-colors hover:text-apex-on-surface"
          >
            Show all laps
          </button>
        </div>
      )}
    </div>
  );
}
