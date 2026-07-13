import type { SessionsLibraryOverview } from "@/lib/api";

function formatTrackTime(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return "0h";
  const hours = sec / 3600;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

type SessionsOverviewStatsV2Props = {
  overview: SessionsLibraryOverview | null;
};

export default function SessionsOverviewStatsV2({
  overview,
}: SessionsOverviewStatsV2Props) {
  return (
    <section className="border-y border-v2-outline-variant/15 py-5">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-0">
        <div className="flex flex-col items-center gap-2 sm:items-start">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant sm:text-left">
            Sessions
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {overview?.totalSessions ?? "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Matching filters
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-center">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
            Laps
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {overview?.totalLaps ?? "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Total recorded
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-center">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
            Track time
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {overview ? formatTrackTime(overview.trackTimeSec) : "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Sum of lap times
          </p>
        </div>

        <div className="flex flex-col items-center gap-2 sm:items-end sm:text-right">
          <p className="text-center text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant sm:text-right">
            Streak
          </p>
          <span className="font-v2-headline text-3xl font-extrabold tabular-nums leading-none text-v2-on-surface">
            {overview != null ? `${overview.streakDays}d` : "—"}
          </span>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Consecutive days
          </p>
        </div>
      </div>
    </section>
  );
}
