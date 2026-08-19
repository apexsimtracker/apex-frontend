import { formatLapMs, formatCarName } from "@/lib/utils";

type SessionDetailHeroStatsProps = {
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
  "mb-1 font-apex-body text-[10px] font-bold uppercase tracking-widest text-apex-on-surface-variant";

const CARD = "rounded-xl bg-apex-surface-container-low p-4 shadow-lg";

type StatItem = {
  key: string;
  label: string;
  value: string;
  highlight?: boolean;
};

export default function SessionDetailHeroStats({
  bestLapMs,
  lapCount,
  carName,
  positionLabel,
  qualiGridLabel,
  bestLapLapNumber,
  improvementMs,
  improvementFromLap,
  totalKm,
}: SessionDetailHeroStatsProps) {
  const stats: StatItem[] = [];

  if (positionLabel) {
    stats.push({ key: "position", label: "Position", value: positionLabel });
  }
  if (qualiGridLabel) {
    stats.push({ key: "quali", label: "Quali", value: qualiGridLabel });
  }
  stats.push({
    key: "bestLap",
    label: "Best lap",
    value: bestLapMs != null ? formatLapMs(bestLapMs) : "—",
    highlight: true,
  });
  stats.push({
    key: "laps",
    label: "Laps",
    value: lapCount > 0 ? String(lapCount) : "—",
  });
  stats.push({
    key: "car",
    label: "Car",
    value: formatCarName(carName) || "—",
  });

  // Mobile only: Laps before Best lap so the highlighted time sits on the
  // right of the pair (desktop keeps Best lap → Laps).
  const mobileStats = (() => {
    const bestIdx = stats.findIndex((s) => s.key === "bestLap");
    const lapsIdx = stats.findIndex((s) => s.key === "laps");
    if (bestIdx < 0 || lapsIdx < 0 || bestIdx === lapsIdx) return stats;
    const next = stats.slice();
    const tmp = next[bestIdx]!;
    next[bestIdx] = next[lapsIdx]!;
    next[lapsIdx] = tmp;
    return next;
  })();

  return (
    <section className="space-y-3">
      <div className={CARD}>
        {/* Mobile: 2×2 (or wrapping) grid — no scroll. Car is always last and
            takes the full row so long names wrap instead of being ellipsed. */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:hidden">
          {mobileStats.map((stat) => (
            <div
              key={stat.key}
              className={`min-w-0 ${stat.key === "car" ? "col-span-2" : ""}`}
            >
              <p className={STAT_LABEL}>{stat.label}</p>
              <h2
                className={
                  stat.key === "car"
                    ? "font-apex-headline text-base font-bold leading-snug text-apex-on-surface"
                    : "font-apex-headline text-xl font-bold leading-none text-apex-on-surface"
                }
                style={stat.highlight ? { color: "#FFD700" } : undefined}
              >
                {stat.value}
              </h2>
            </div>
          ))}
        </div>

        {/* sm+: single row with dividers */}
        <div className="hidden items-start justify-between gap-4 sm:flex">
          {stats.map((stat, index) => (
            <div key={stat.key} className="contents">
              {index > 0 ? (
                <div className="h-8 w-px self-center bg-apex-outline-variant/20" />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className={STAT_LABEL}>{stat.label}</p>
                <h2
                  className={
                    stat.key === "car"
                      ? "truncate font-apex-headline text-sm font-bold leading-none text-apex-on-surface sm:text-lg"
                      : "font-apex-headline text-xl font-bold leading-none text-apex-on-surface sm:text-2xl"
                  }
                  style={stat.highlight ? { color: "#FFD700" } : undefined}
                >
                  {stat.value}
                </h2>
              </div>
            </div>
          ))}
        </div>
      </div>
      {(bestLapLapNumber != null ||
        (totalKm != null && Number.isFinite(totalKm)) ||
        (improvementMs != null && improvementMs > 0)) && (
        <p className="font-apex-body text-xs text-apex-on-surface-variant">
          {bestLapLapNumber != null ? (
            <>
              Best lap was{" "}
              <span className="font-bold text-apex-on-surface">
                Lap {bestLapLapNumber}
              </span>
              {improvementMs != null &&
              improvementMs > 0 &&
              improvementFromLap != null ? (
                <>
                  {" "}
                  — improved by{" "}
                  <span className="font-bold text-apex-on-surface">
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
              <span className="font-bold text-apex-on-surface">
                {totalKm.toFixed(1)} km
              </span>
            </>
          ) : null}
        </p>
      )}
    </section>
  );
}
