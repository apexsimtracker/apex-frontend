import { useNavigate } from "react-router-dom";
import { formatDuration } from "@/lib/utils";

function TrendChip({
  improvement,
  displayText,
}: {
  improvement: boolean | null;
  displayText: string;
}) {
  const arrow = improvement === null ? null : improvement ? "▲" : "▼";
  const textColor =
    improvement === null
      ? "text-white/40"
      : improvement
        ? "text-lime-400"
        : "text-[rgb(240,28,28)]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border border-white/10 bg-white/[0.03] px-1.5 py-0.5 text-[11px] ${textColor}`}
    >
      {arrow}
      {displayText}
    </span>
  );
}

type WeeklySnapshotProps = {
  sessionsCount: number;
  totalLaps: number;
  trackTimeMs: number;
  sessionDelta: number;
  lapsDelta: number;
  trackTimeDelta: number;
};

export default function WeeklySnapshot({
  sessionsCount,
  totalLaps,
  trackTimeMs,
  sessionDelta,
  lapsDelta,
  trackTimeDelta,
}: WeeklySnapshotProps) {
  const navigate = useNavigate();
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
    <div className="rounded-lg border border-white/6 bg-card/20 backdrop-blur-lg p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">
          Your Weekly Snapshot
        </h2>
        <button
          type="button"
          onClick={() => navigate("/sessions")}
          className="text-xs font-medium text-[rgb(240,28,28)] hover:opacity-90"
        >
          See More
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 divide-x divide-white/10">
        <div className="pr-4">
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            Sessions
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {sessionsCount}
          </div>
          <div className="mt-1.5">
            <TrendChip
              improvement={sessionImprovement}
              displayText={sessionDisplay}
            />
          </div>
        </div>

        <div className="px-4">
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            TRACK TIME
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {formatDuration(trackTimeMs)}
          </div>
          <div className="mt-1.5">
            <TrendChip
              improvement={trackTimeImprovement}
              displayText={trackTimeDisplay}
            />
          </div>
        </div>

        <div className="pl-4">
          <div className="text-[11px] uppercase tracking-wider text-white/50">
            Laps
          </div>
          <div className="mt-1 text-2xl font-semibold text-white">
            {totalLaps}
          </div>
          <div className="mt-1.5">
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
