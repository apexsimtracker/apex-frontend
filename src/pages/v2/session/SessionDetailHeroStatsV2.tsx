import { formatLapMs, formatCarName } from "@/lib/utils";

type SessionDetailHeroStatsV2Props = {
  bestLapMs: number | null | undefined;
  lapCount: number;
  carName: string | null;
  positionLabel?: string | null;
  qualiGridLabel?: string | null;
  bestLapLapNumber?: number | null;
  improvementMs?: number | null;
  /** Lap number used as the improvement baseline (first competitive lap). */
  improvementFromLap?: number | null;
  totalKm?: number | null;
};

const STAT_LABEL =
  "mb-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant";

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

export default function SessionDetailHeroStatsV2({
  bestLapMs,
  lapCount,
  carName,
  positionLabel,
  qualiGridLabel,
  bestLapLapNumber,
  improvementMs,
  improvementFromLap,
  totalKm,
}: SessionDetailHeroStatsV2Props) {
  return (
    <section className="space-y-3">
      <div className={CARD}>
        <div className="flex items-start justify-between gap-4 overflow-x-auto">
          {positionLabel ? (
            <>
              <div className="min-w-fit flex-1">
                <p className={STAT_LABEL}>Position</p>
                <h2 className="font-v2-headline text-xl font-bold leading-none text-v2-on-surface sm:text-2xl">
                  {positionLabel}
                </h2>
              </div>
              <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
            </>
          ) : null}
          {qualiGridLabel ? (
            <>
              <div className="min-w-fit flex-1">
                <p className={STAT_LABEL}>Quali</p>
                <h2 className="font-v2-headline text-xl font-bold leading-none text-v2-on-surface sm:text-2xl">
                  {qualiGridLabel}
                </h2>
              </div>
              <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
            </>
          ) : null}
          <div className="min-w-fit flex-1">
            <p className={STAT_LABEL}>Best lap</p>
            <h2
              className="font-v2-headline text-xl font-bold leading-none sm:text-2xl"
              style={{ color: "#FFD700" }}
            >
              {bestLapMs != null ? formatLapMs(bestLapMs) : "—"}
            </h2>
          </div>
          <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
          <div className="min-w-fit flex-1">
            <p className={STAT_LABEL}>Laps</p>
            <h2 className="font-v2-headline text-xl font-bold leading-none text-v2-on-surface sm:text-2xl">
              {lapCount > 0 ? lapCount : "—"}
            </h2>
          </div>
          <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
          <div className="min-w-fit flex-1">
            <p className={STAT_LABEL}>Car</p>
            <h2 className="whitespace-nowrap font-v2-headline text-sm font-bold leading-none text-v2-on-surface sm:text-lg">
              {formatCarName(carName) || "—"}
            </h2>
          </div>
        </div>
      </div>
      {(bestLapLapNumber != null ||
        (totalKm != null && Number.isFinite(totalKm)) ||
        (improvementMs != null && improvementMs > 0)) && (
        <p className="font-v2-body text-xs text-v2-on-surface-variant">
          {bestLapLapNumber != null ? (
            <>
              Best lap was{" "}
              <span className="font-bold text-v2-on-surface">
                Lap {bestLapLapNumber}
              </span>
              {improvementMs != null &&
              improvementMs > 0 &&
              improvementFromLap != null ? (
                <>
                  {" "}
                  — improved by{" "}
                  <span className="font-bold text-v2-on-surface">
                    +{(improvementMs / 1000).toFixed(3)}s
                  </span>{" "}
                  from Lap {improvementFromLap}
                </>
              ) : null}
            </>
          ) : null}
          {totalKm != null && Number.isFinite(totalKm) ? (
            <>
              {bestLapLapNumber != null ? " · " : null}
              Distance{" "}
              <span className="font-bold text-v2-on-surface">
                {totalKm.toFixed(1)} km
              </span>
            </>
          ) : null}
        </p>
      )}
    </section>
  );
}
