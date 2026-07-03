import { formatLapMs } from "@/lib/utils";
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
};

// Loveable uses a single green accent for highlighted sectors/laps.
function loveableHighlightClass(h: TimingHighlight): string {
  return h === "default" ? "text-v2-on-surface" : "text-green-500";
}

// Loveable bolds a sector cell when its row is the fastest lap OR that sector
// is the highlighted (fastest) sector, so highlighted sectors stay bold even on
// non-fastest rows.
function sectorWeightClass(isFastest: boolean, h: TimingHighlight): string {
  return isFastest || h !== "default" ? "font-bold" : "";
}

const HEADER_CELL =
  "px-2 py-3 whitespace-nowrap text-[10px] font-bold tracking-widest text-v2-on-surface-variant";

export default function SessionLapTableV2({
  laps,
  lapHighlights,
  bestLapMsFromLaps,
  canShowMore,
  onShowMore,
}: SessionLapTableV2Props) {
  return (
    <div className="overflow-hidden rounded-lg bg-v2-surface-container-low shadow-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse text-left">
          <thead>
            <tr className="border-b border-v2-outline-variant/15">
              <th className={HEADER_CELL}>Lap</th>
              <th className={HEADER_CELL}>S1</th>
              <th className={HEADER_CELL}>S2</th>
              <th className={HEADER_CELL}>S3</th>
              <th className={`${HEADER_CELL} text-right`}>Time</th>
            </tr>
          </thead>
          <tbody className="font-v2-body text-[11px]">
            {laps.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm text-v2-on-surface-variant"
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
                return (
                  <tr
                    key={`lap-${row.lap}-${index}`}
                    className={
                      isFastest
                        ? "border-b border-green-500/20 bg-green-500/10"
                        : "border-b border-v2-outline-variant/5 transition-colors hover:bg-v2-surface-container"
                    }
                  >
                    <td
                      className={`whitespace-nowrap px-2 py-3 ${
                        isFastest
                          ? "font-bold italic text-green-500"
                          : "text-v2-on-surface-variant"
                      }`}
                    >
                      {row.lap}
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
                        isFastest ? "text-green-500" : "text-v2-on-surface"
                      }`}
                    >
                      {formatLapMs(row.timeMs)}
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
            className="text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
          >
            Show all laps
          </button>
        </div>
      )}
    </div>
  );
}
