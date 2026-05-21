import { ChevronDown, ChevronUp } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { SkeletonBlock } from "@/components/ui/skeleton";

function TrendChip({
  improvement,
  displayText,
}: {
  improvement: boolean | null;
  displayText: string;
}) {
  const arrow =
    improvement === null ? null : improvement ? (
      <ChevronUp className="size-3.5 shrink-0" aria-hidden />
    ) : (
      <ChevronDown className="size-3.5 shrink-0" aria-hidden />
    );
  const textColor =
    improvement === null
      ? "text-white/40"
      : improvement
        ? "text-lime-400"
        : "text-[rgb(240,28,28)]";
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px] ${textColor}`}
    >
      {arrow}
      <span className="truncate">{displayText}</span>
    </span>
  );
}

type WeeklySnapshotProps = {
  /** When true, shows a placeholder (profile summary still loading). */
  loading?: boolean;
  sessionsCount: number;
  totalLaps: number;
  trackTimeMs: number;
  sessionDelta: number;
  lapsDelta: number;
  trackTimeDelta: number;
};

const METRICS_GRID_CLASS =
  "mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/10";

function metricCellClass(index: 0 | 1 | 2) {
  if (index === 0) return "min-w-0 sm:pr-4 text-left";
  if (index === 2) return "min-w-0 sm:pl-4 text-left";
  return "min-w-0 sm:px-4 text-left";
}

export default function WeeklySnapshot({
  loading = false,
  sessionsCount,
  totalLaps,
  trackTimeMs,
  sessionDelta,
  lapsDelta,
  trackTimeDelta,
}: WeeklySnapshotProps) {
  if (loading) {
    return (
      <div className="border-white/6 rounded-lg border bg-card/20 p-4 backdrop-blur-lg">
        <div className="flex items-center justify-between">
          <SkeletonBlock height={20} width={180} className="bg-white/10" rounded="md" />
        </div>
        <div className={METRICS_GRID_CLASS}>
          {([0, 1, 2] as const).map((i) => (
            <div key={i} className={metricCellClass(i)}>
              <SkeletonBlock height={12} width={64} className="mx-auto mb-2 bg-white/10 sm:mx-0" rounded="sm" />
              <SkeletonBlock height={32} width={48} className="mx-auto bg-white/10 sm:mx-0" rounded="md" />
              <SkeletonBlock height={14} width={40} className="mx-auto mt-2 bg-white/10 sm:mx-0" rounded="sm" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sessionImprovement =
    sessionDelta === 0 ? null : sessionDelta > 0;
  const sessionDisplay =
    sessionDelta === 0 ? "—" : sessionDelta > 0 ? `+${sessionDelta}` : `${sessionDelta}`;

  const lapsImprovement = lapsDelta === 0 ? null : lapsDelta > 0;
  const lapsDisplay =
    lapsDelta === 0 ? "—" : lapsDelta > 0 ? `+${lapsDelta}` : `${lapsDelta}`;

  const trackTimeImprovement =
    trackTimeDelta === 0 ? null : trackTimeDelta > 0;
  const trackTimeDisplay =
    trackTimeDelta === 0
      ? "—"
      : trackTimeDelta > 0
        ? `+${formatDuration(trackTimeDelta)}`
        : `-${formatDuration(Math.abs(trackTimeDelta))}`;

  return (
    <div className="border-white/6 rounded-lg border bg-card/20 p-4 backdrop-blur-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Your Weekly Snapshot
        </h2>
      </div>

      <div className={METRICS_GRID_CLASS}>
        <div className={metricCellClass(0)}>
          <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1 sm:0">
            Sessions
          </div>
          <div className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
            {sessionsCount}
          </div>
          <div className="mt-1.5 flex my-2.5 sm:my-0 justify-start">
            <TrendChip
              improvement={sessionImprovement}
              displayText={sessionDisplay}
            />
          </div>
        </div>

        <div className={metricCellClass(1)}>
          <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1 sm:0">
            TRACK TIME
          </div>
          <div className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
            {formatDuration(trackTimeMs)}
          </div>
          <div className="mt-1.5 flex my-2.5 sm:my-0 justify-start">
            <TrendChip
              improvement={trackTimeImprovement}
              displayText={trackTimeDisplay}
            />
          </div>
        </div>

        <div className={metricCellClass(2)}>
          <div className="text-[11px] uppercase tracking-wider text-white/50 mb-1 sm:0">
            Laps
          </div>
          <div className="text-xl font-semibold tabular-nums text-white sm:text-2xl">
            {totalLaps}
          </div>
          <div className="mt-1.5 flex my-2.5 sm:my-0 justify-start">
            <TrendChip
              improvement={lapsImprovement}
              displayText={lapsDisplay}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
