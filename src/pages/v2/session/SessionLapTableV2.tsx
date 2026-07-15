import { formatLapMs } from "@/lib/utils";
import { formatLapDeltaMsForDisplay } from "@/features/session-detail/sessionInsights";
import {
  DEFAULT_LAP_TIMING_HIGHLIGHTS,
  type LapTimingHighlights,
  type TimingHighlight,
} from "@/lib/sessionLapDisplay";
import type { NormalizedLap } from "@/features/session-detail/sessionDetailData";

type SessionLapTableV2Props = {
  laps: NormalizedLap[];
  lapHighlights: Map<number, LapTimingHighlights>;
  bestLapMsFromLaps: number | null;
  canShowMore: boolean;
  onShowMore: () => void;
  selectedLap?: number | null;
  onSelectLap?: (lapNumber: number) => void;
};

function loveableHighlightClass(h: TimingHighlight): string {
  return h === "purple" ? "text-purple-400" : "text-v2-on-surface";
}

function sectorWeightClass(isFastest: boolean, h: TimingHighlight): string {
  return isFastest || h !== "default" ? "font-bold" : "";
}

const HEADER_CELL =
  "px-2 py-3 whitespace-nowrap font-v2-headline text-[10px] font-bold tracking-widest text-v2-on-surface-variant";

export default function SessionLapTableV2({
  laps,
  lapHighlights,
  bestLapMsFromLaps,
  canShowMore,
  onShowMore,
  selectedLap = null,
  onSelectLap,
}: SessionLapTableV2Props) {
  return (
    <div className="overflow-hidden rounded-xl bg-v2-surface-container-low shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[360px] border-collapse text-left">
          <thead>
            <tr className="border-b border-v2-outline-variant/15">
              <th className={HEADER_CELL}>Lap</th>
              <th className={HEADER_CELL}>S1</th>
              <th className={HEADER_CELL}>S2</th>
              <th className={HEADER_CELL}>S3</th>
              <th className={`${HEADER_CELL} text-right`}>Time</th>
              <th className={`${HEADER_CELL} text-right`}>Δ</th>
            </tr>
          </thead>
          <tbody className="font-v2-body text-[11px]">
            {laps.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center font-v2-body text-sm text-v2-on-surface-variant"
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
                          ? "cursor-pointer border-b border-v2-primary/30 bg-v2-primary/10"
                          : "cursor-pointer border-b border-v2-outline-variant/5 transition-colors hover:bg-v2-surface-container"
                    }
                  >
                    <td
                      className={`whitespace-nowrap px-2 py-3 ${
                        isFastest
                          ? "font-bold italic text-purple-400"
                          : "text-v2-on-surface-variant"
                      }`}
                    >
                      {row.lap}
                      {row.isOutLap ? (
                        <span className="ml-1 rounded bg-v2-surface-container px-1 py-0.5 font-v2-body text-[9px] font-bold uppercase tracking-wide text-v2-on-surface-variant">
                          Out
                        </span>
                      ) : null}
                    </td>
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
                    <td
                      className={`whitespace-nowrap px-2 py-3 text-right font-v2-headline font-bold ${
                        isFastest || rowHighlights.lap === "purple"
                          ? "text-purple-400"
                          : "text-v2-on-surface"
                      }`}
                    >
                      {formatLapMs(row.timeMs)}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-right text-v2-on-surface-variant">
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
        <div className="flex justify-center border-t border-v2-outline-variant/10 py-4">
          <button
            type="button"
            onClick={onShowMore}
            className="font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            Show all laps
          </button>
        </div>
      )}
    </div>
  );
}
