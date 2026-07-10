import { formatLapMs, formatCarName } from "@/lib/utils";

type SessionDetailHeroStatsV2Props = {
  bestLapMs: number | null | undefined;
  lapCount: number;
  carName: string | null;
};

const STAT_LABEL =
  "mb-1 font-v2-body text-[10px] font-bold uppercase tracking-widest text-v2-on-surface-variant";

const CARD = "rounded-xl bg-v2-surface-container-low p-4 shadow-lg";

export default function SessionDetailHeroStatsV2({
  bestLapMs,
  lapCount,
  carName,
}: SessionDetailHeroStatsV2Props) {
  return (
    <section className={CARD}>
      <div className="flex items-start justify-between gap-4 overflow-x-auto">
        <div className="min-w-fit flex-1">
          <p className={STAT_LABEL}>Best lap</p>
          <h2
            className="font-v2-headline text-xl font-bold leading-none sm:text-2xl"
            style={{ color: "#FFD700" }}
          >
            {bestLapMs != null ? formatLapMs(bestLapMs) : "1:08.635"}
          </h2>
        </div>
        <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
        <div className="min-w-fit flex-1">
          <p className={STAT_LABEL}>Laps</p>
          <h2 className="font-v2-headline text-xl font-bold leading-none text-v2-on-surface sm:text-2xl">
            {lapCount > 0 ? lapCount : "5"}
          </h2>
        </div>
        <div className="h-8 w-px self-center bg-v2-outline-variant/20" />
        <div className="min-w-fit flex-1">
          <p className={STAT_LABEL}>Car</p>
          <h2 className="whitespace-nowrap font-v2-headline text-sm font-bold leading-none text-v2-on-surface sm:text-lg">
            {formatCarName(carName) || "Red Bull RB20"}
          </h2>
        </div>
      </div>
    </section>
  );
}
