import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatLapMs, formatCarName } from "@/lib/utils";
import { isRaceKind } from "@/lib/sessionKind";
import type { SessionDetail } from "@/features/session-detail/sessionDetailData";

type ResolvedSessionFields = {
  track: string | null;
  car: string | null;
  carRawForFormat: string | null;
  sim: string | null;
};

type SessionDetailStatsV2Props = {
  session: SessionDetail;
  resolved: ResolvedSessionFields;
  showPosition: boolean;
  displayPositionLabel: string | null;
  showQualiGrid: boolean;
  qualiGridLabel: string | null;
  totalLapsCount: number;
  hasNoLaps: boolean;
};

const STAT_LABEL =
  "mb-1 text-[11px] font-medium uppercase tracking-wider text-v2-on-surface-variant";
const STAT_VALUE =
  "font-v2-headline text-3xl font-extrabold tabular-nums text-v2-on-surface";

function StatCard({
  label,
  value,
  className,
  children,
}: {
  label: string;
  value: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`rounded-v2-lg border border-v2-outline-variant/15 bg-v2-surface-container-low p-4 ${className ?? ""}`}
    >
      <p className={STAT_LABEL}>{label}</p>
      <p className={STAT_VALUE}>{value}</p>
      {children}
    </div>
  );
}

export default function SessionDetailStatsV2({
  session,
  resolved,
  showPosition,
  displayPositionLabel,
  showQualiGrid,
  qualiGridLabel,
  totalLapsCount,
  hasNoLaps,
}: SessionDetailStatsV2Props) {
  const gridCols =
    showPosition && showQualiGrid
      ? "sm:grid-cols-2 lg:grid-cols-5"
      : showPosition || showQualiGrid
        ? "sm:grid-cols-2 lg:grid-cols-4"
        : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
      {showPosition && displayPositionLabel && (
        <StatCard label="Position" value={displayPositionLabel} />
      )}
      {showQualiGrid && qualiGridLabel && (
        <StatCard label="Quali position" value={qualiGridLabel} />
      )}
      <StatCard
        label="Best Lap"
        value={formatLapMs(session.bestLapMs)}
        className={!hasNoLaps ? "sm:col-span-2 lg:col-span-1" : undefined}
      >
        {!hasNoLaps && (
          <p className="mt-2 font-v2-body text-xs leading-relaxed text-v2-on-surface-variant">
            {isRaceKind(session) ? (
              <>
                The{" "}
                <Link
                  to="/v2/leaderboards"
                  className="text-v2-primary transition-colors hover:text-v2-primary/80"
                >
                  fastest lap
                </Link>{" "}
                board lists the top ten drivers across the platform. Your
                session can still have the best lap shown here without appearing
                on that list.
              </>
            ) : (
              <>
                The{" "}
                <Link
                  to="/v2/leaderboards"
                  className="text-v2-primary transition-colors hover:text-v2-primary/80"
                >
                  fastest lap
                </Link>{" "}
                leaderboard uses race laps only (telemetry race/sprint, or
                manual activity with session kind Race). Practice and qualifying
                laps are ignored there—this session&apos;s badge above shows how
                it was logged.
              </>
            )}
          </p>
        )}
      </StatCard>
      <StatCard label="Total Laps" value={totalLapsCount} />
      <StatCard
        label="Car"
        value={formatCarName(resolved.car ?? resolved.carRawForFormat ?? null)}
      />
    </div>
  );
}
