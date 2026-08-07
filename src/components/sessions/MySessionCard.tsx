import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import {
  parseTrackHeadline,
  splitPositionLabel,
} from "@/components/dashboard/dashboardSessionDisplay";
import {
  getPodiumBestLapClassName,
  getPodiumTrophyClassName,
} from "@/components/dashboard/dashboardPodiumColors";
import { getDisciplineLogoSrc } from "@/components/profile/profileDisciplineAssets";
import {
  formatLapMs,
  formatCarName,
  timeAgo,
  cn,
} from "@/lib/utils";
import {
  displayPositionRank,
  getDisplayPosition,
  getSessionTypeTagStyle,
  isPracticeKind,
  shouldShowSessionPosition,
} from "@/lib/sessionKind";
import type { SessionsLibraryRow } from "@/lib/api/sessionsLibrary";
import SessionCaption from "@/components/sessions/SessionCaption";
import { preloadSessionDetail } from "@/routes/routePreload";
import { seedSessionDetailFromLibraryRow } from "@/lib/sessions/sessionDetailPrefetch";

function SessionTypePill({
  sessionType,
  manualSessionKind,
}: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}) {
  const style = getSessionTypeTagStyle({ sessionType, manualSessionKind });
  return (
    <span
      className="inline-flex items-center rounded-apex-sm px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider"
      style={{
        color: style.color,
        backgroundColor: style.background,
      }}
      aria-label={`Session type: ${style.label}`}
    >
      {style.label}
    </span>
  );
}

function IngestBadge({
  ingestSource,
  source,
}: {
  ingestSource?: string | null;
  source?: string | null;
}) {
  const ingest = (ingestSource ?? "").toLowerCase();
  let label = "Telemetry";
  if (ingest === "manual_form" || source === "manual") label = "Manual";
  else if (ingest === "agent_upload" || source === "agent") label = "Agent";
  else if (ingest === "manual_upload_ibt") label = "IBT";
  else if (ingest === "manual_upload_json") label = "JSON";
  else if (source === "telemetry") label = "Telemetry";

  return (
    <span className="inline-flex items-center rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-apex-on-surface-variant">
      {label}
    </span>
  );
}

function StatCell({
  label,
  value,
  valueClassName,
  className,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-apex-on-surface-variant">
        {label}
      </p>
      <p
        className={cn(
          "font-apex-headline text-xs font-bold text-apex-on-surface lg:text-sm",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function formatTrackTime(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms) || ms <= 0) return null;
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

type MySessionCardProps = {
  session: SessionsLibraryRow;
};

export default function MySessionCard({ session }: MySessionCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    id,
    track,
    trackName,
    car,
    carName,
    position,
    qualifyingPosition,
    totalDrivers,
    sessionType,
    manualSessionKind,
    simKey,
    source,
    ingestSource,
    bestLapMs,
    lapCount,
    totalTimeMs,
    createdAt,
    caption,
  } = session;

  const isPractice =
    !shouldShowSessionPosition({
      sessionType,
      manualSessionKind,
      position,
      qualifyingPosition,
      totalDrivers,
    }) &&
    isPracticeKind({ sessionType, manualSessionKind });

  const warmDetail = useCallback(() => {
    void preloadSessionDetail();
    seedSessionDetailFromLibraryRow(queryClient, session);
  }, [queryClient, session]);

  const goToSession = useCallback(() => {
    warmDetail();
    navigate(`/sessions/${id}`);
  }, [navigate, id, warmDetail]);

  const { city, title } = parseTrackHeadline(track, trackName);
  const logoSrc = getDisciplineLogoSrc(simKey);
  const displaySession = {
    sessionType,
    manualSessionKind,
    position,
    qualifyingPosition,
    totalDrivers,
  };
  const showPos = shouldShowSessionPosition(displaySession);
  const displayLabel = showPos ? getDisplayPosition(displaySession) : null;
  const pos = displayPositionRank(displaySession);
  const { rank, suffix } = displayLabel
    ? splitPositionLabel(displayLabel)
    : { rank: "", suffix: null };
  const trophyClassName = getPodiumTrophyClassName(pos);
  const carLabel = carName ?? formatCarName(car ?? "");
  const trackTime = formatTrackTime(totalTimeMs);
  const showBest = bestLapMs != null;
  const showLaps = true;
  const showCar = Boolean(carLabel);
  const showTime = Boolean(trackTime);
  const columns = [showBest, showLaps, showCar, showTime].filter(
    Boolean,
  ).length;

  type SessionStatItem = {
    key: "best" | "laps" | "car" | "time";
    label: string;
    value: string;
    valueClassName?: string;
  };

  const statItems: SessionStatItem[] = [];
  if (showBest && bestLapMs != null) {
    statItems.push({
      key: "best",
      label: "Best",
      value: formatLapMs(bestLapMs),
      valueClassName: getPodiumBestLapClassName(pos),
    });
  }
  if (showLaps) {
    statItems.push({
      key: "laps",
      label: "Laps",
      value: String(lapCount ?? 0),
    });
  }
  if (showTime && trackTime) {
    statItems.push({
      key: "time",
      label: "Time",
      value: trackTime,
    });
  }
  if (showCar) {
    statItems.push({
      key: "car",
      label: "Car",
      value: carLabel,
      valueClassName: "truncate",
    });
  }

  // Mobile 2+1 layout: first two stats on row 1, full-width stat on row 2.
  // Car is always the full-width row when present; otherwise the last stat is.
  const orderedStatItems =
    columns === 3 && showCar
      ? [
          ...statItems.filter((item) => item.key !== "car"),
          ...statItems.filter((item) => item.key === "car"),
        ]
      : statItems;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToSession}
      onMouseEnter={warmDetail}
      onFocus={warmDetail}
      onPointerDown={warmDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSession();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-2xl border border-apex-outline-variant/15 bg-apex-surface-container-low shadow-sm transition-colors hover:bg-apex-surface-container"
    >
      <div className="space-y-3 p-4 lg:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="font-apex-body text-[10px] text-apex-on-surface-variant">
            {timeAgo(createdAt)}
          </p>
          {logoSrc ? (
            <img
              src={logoSrc}
              alt=""
              className="h-5 w-auto max-w-[3.5rem] shrink-0 object-contain opacity-90 sm:h-7 sm:max-w-none"
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <SessionTypePill
            sessionType={sessionType}
            manualSessionKind={manualSessionKind}
          />
          <IngestBadge ingestSource={ingestSource} source={source} />
        </div>

        <div className="space-y-1">
          {city ? (
            <p className="font-apex-body text-[10px] font-medium uppercase tracking-wider text-apex-on-surface-variant">
              {city}
            </p>
          ) : null}
          <h3 className="font-apex-headline text-base font-bold leading-tight text-apex-on-surface lg:text-lg">
            {title}
          </h3>
        </div>

        {showPos && displayLabel ? (
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-apex-on-surface-variant">
                Position
              </p>
              <p className="font-apex-headline text-2xl font-bold leading-none text-apex-on-surface">
                {rank}
                {suffix ? (
                  <span className="text-base font-semibold text-apex-on-surface-variant">
                    {suffix}
                  </span>
                ) : null}
              </p>
            </div>
            {pos >= 1 && pos <= 3 && trophyClassName ? (
              <Trophy
                className={cn("size-8 shrink-0", trophyClassName)}
                aria-hidden
                fill="currentColor"
              />
            ) : null}
          </div>
        ) : isPractice ? (
          <p className="font-apex-body text-xs text-apex-on-surface-variant">
            Practice session
          </p>
        ) : null}

        {columns > 0 ? (
          <div
            className={cn(
              "grid gap-x-3 gap-y-2 border-t border-apex-outline-variant/10 pt-3 sm:gap-3",
              columns >= 4 && "grid-cols-2 sm:grid-cols-4",
              columns === 3 && "grid-cols-2 sm:grid-cols-3",
              columns === 2 && "grid-cols-2",
              columns === 1 && "grid-cols-1",
            )}
          >
            {orderedStatItems.map((item, index) => (
              <StatCell
                key={item.key}
                label={item.label}
                value={item.value}
                valueClassName={item.valueClassName}
                className={cn(
                  columns === 3 &&
                    index === orderedStatItems.length - 1 &&
                    "col-span-2 sm:col-span-1",
                )}
              />
            ))}
          </div>
        ) : null}

        <SessionCaption caption={caption} />
      </div>
    </article>
  );
}
