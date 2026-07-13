import type { SessionsLibraryWeeklyStats } from "@/lib/api";
import { cn } from "@/lib/utils";

function formatHoursFromSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0h";
  const hours = seconds / 3600;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function formatDelta(n: number, suffix = ""): string {
  if (!Number.isFinite(n) || n === 0) return `±0${suffix}`;
  return n > 0 ? `+${n}${suffix}` : `${n}${suffix}`;
}

function progressPct(current: number, target: number): number {
  if (!Number.isFinite(target) || target <= 0) return 0;
  return Math.min(100, Math.max(0, (current / target) * 100));
}

type SessionsWeeklyStatsPanelV2Props = {
  data: SessionsLibraryWeeklyStats | null;
  loading?: boolean;
};

export default function SessionsWeeklyStatsPanelV2({
  data,
  loading,
}: SessionsWeeklyStatsPanelV2Props) {
  if (loading || !data) {
    return (
      <div className="rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-6">
        <p className="font-v2-body text-sm text-v2-on-surface-variant">
          Loading weekly stats…
        </p>
      </div>
    );
  }

  const snap = data.weeklySnapshot;
  const goals = data.weeklyGoals;

  return (
    <div className="space-y-5 rounded-v2-lg border border-v2-outline-variant/10 bg-v2-surface-container-low p-5">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="font-v2-body text-[10px] uppercase tracking-wider text-v2-on-surface-variant">
            Sessions
          </p>
          <p className="font-v2-headline text-2xl font-bold text-v2-on-surface">
            {snap.sessions}
          </p>
          <p
            className={cn(
              "font-v2-body text-xs",
              snap.sessionsDelta > 0
                ? "text-v2-primary"
                : "text-v2-on-surface-variant",
            )}
          >
            {formatDelta(snap.sessionsDelta)} vs last week
          </p>
        </div>
        <div>
          <p className="font-v2-body text-[10px] uppercase tracking-wider text-v2-on-surface-variant">
            Laps
          </p>
          <p className="font-v2-headline text-2xl font-bold text-v2-on-surface">
            {snap.laps}
          </p>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            {formatDelta(snap.lapsDelta)} vs last week
          </p>
        </div>
        <div>
          <p className="font-v2-body text-[10px] uppercase tracking-wider text-v2-on-surface-variant">
            Track time
          </p>
          <p className="font-v2-headline text-2xl font-bold text-v2-on-surface">
            {formatHoursFromSeconds(snap.trackTimeSec)}
          </p>
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            {formatDelta(Math.round(snap.trackTimeSecDelta / 60), "m")} vs last
            week
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-v2-outline-variant/10 pt-4">
        <p className="font-v2-body text-[10px] font-bold uppercase tracking-wider text-v2-on-surface-variant">
          Weekly goals
        </p>
        {(
          [
            ["Races", goals.races],
            ["Podiums", goals.podiums],
            ["Laps", goals.laps],
          ] as const
        ).map(([label, metric]) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between">
              <span className="font-v2-body text-xs text-v2-on-surface-variant">
                {label}
              </span>
              <span className="font-v2-body text-xs font-semibold text-v2-on-surface">
                {metric.current} / {metric.target}
              </span>
            </div>
            <div className="h-1 w-full rounded-full bg-v2-surface-container-highest">
              <div
                className="h-full rounded-full bg-v2-primary transition-all"
                style={{
                  width: `${progressPct(metric.current, metric.target)}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
