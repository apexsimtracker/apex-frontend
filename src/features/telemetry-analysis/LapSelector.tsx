import { formatLapMs } from "@/lib/utils";
import type { TelemetryLapSummary } from "./types";

type LapSelectorProps = {
  laps: TelemetryLapSummary[];
  selectedLap: number | null;
  compareLap: number | null;
  onSelectLap: (lapNumber: number) => void;
  onSelectCompare: (lapNumber: number | null) => void;
};

export function LapSelector({
  laps,
  selectedLap,
  compareLap,
  onSelectLap,
  onSelectCompare,
}: LapSelectorProps) {
  const validLaps = laps.filter((l) => l.isValid && l.lapTimeMs > 0);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-wrap gap-2">
        {validLaps.map((lap) => {
          const selected = lap.lapNumber === selectedLap;
          const comparing = lap.lapNumber === compareLap;
          return (
            <button
              key={lap.lapNumber}
              type="button"
              onClick={() => onSelectLap(lap.lapNumber)}
              className={`rounded-lg border px-3 py-1.5 text-left text-xs transition-colors ${
                selected
                  ? "border-sky-400/60 bg-sky-500/15 text-white"
                  : comparing
                    ? "border-emerald-400/50 bg-emerald-500/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              <div className="font-medium tabular-nums">Lap {lap.lapNumber}</div>
              <div className="tabular-nums text-white/60">{formatLapMs(lap.lapTimeMs)}</div>
              <div className="mt-0.5 flex flex-wrap gap-1">
                {lap.isBestLap && (
                  <span className="rounded bg-amber-500/20 px-1 text-[10px] text-amber-300">
                    Best
                  </span>
                )}
                {lap.isOutLap && (
                  <span className="rounded bg-white/10 px-1 text-[10px] text-white/50">
                    Out
                  </span>
                )}
                {lap.hasTraces && (
                  <span className="rounded bg-sky-500/15 px-1 text-[10px] text-sky-300">
                    Trace
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <label className="flex flex-col gap-1 text-xs text-white/50">
        Compare lap
        <select
          className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
          value={compareLap ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onSelectCompare(v ? Number(v) : null);
          }}
        >
          <option value="">None</option>
          {validLaps
            .filter((l) => l.lapNumber !== selectedLap && l.hasTraces)
            .map((lap) => (
              <option key={lap.lapNumber} value={lap.lapNumber}>
                Lap {lap.lapNumber} ({formatLapMs(lap.lapTimeMs)})
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
