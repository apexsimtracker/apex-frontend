import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Trophy } from "lucide-react";
import {
  parseTrackHeadline,
  splitPositionLabel,
} from "@/components/v2/dashboard/dashboardSessionDisplay";
import {
  getPodiumFastestLapClassName,
  getPodiumTrophyClassName,
} from "@/components/v2/dashboard/dashboardPodiumColors";
import { getDisciplineLogoSrc } from "@/components/v2/profile/profileDisciplineAssets";
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
import type { SessionsLibraryRow } from "@/lib/api";

function SessionTypePillV2({
  sessionType,
  manualSessionKind,
}: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}) {
  const style = getSessionTypeTagStyle({ sessionType, manualSessionKind });
  return (
    <span
      className="inline-flex items-center rounded-v2-sm px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider"
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

function IngestBadgeV2({
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
    <span className="inline-flex items-center rounded-v2-sm bg-v2-surface-container-highest px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-v2-on-surface-variant">
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
    <div className={className}>
      <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-v2-on-surface-variant">
        {label}
      </p>
      <p
        className={cn(
          "font-v2-headline text-sm font-bold text-v2-on-surface",
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

type MySessionCardV2Props = {
  session: SessionsLibraryRow;
};

export default function MySessionCardV2({ session }: MySessionCardV2Props) {
  const navigate = useNavigate();
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

  const goToSession = useCallback(() => {
    navigate(`/v2/sessions/${id}`);
  }, [navigate, id]);

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
  const showFastest = bestLapMs != null;
  const showLaps = true;
  const showCar = Boolean(carLabel);
  const showTime = Boolean(trackTime);
  const columns = [showFastest, showLaps, showCar, showTime].filter(
    Boolean,
  ).length;

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={goToSession}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToSession();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-2xl border border-v2-outline-variant/15 bg-v2-surface-container-low shadow-sm transition-colors hover:bg-v2-surface-container"
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {logoSrc ? (
              <img
                src={logoSrc}
                alt=""
                className="size-9 shrink-0 rounded-full object-contain"
              />
            ) : (
              <div className="size-9 shrink-0 rounded-full bg-v2-surface-container-high" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <SessionTypePillV2
                  sessionType={sessionType}
                  manualSessionKind={manualSessionKind}
                />
                <IngestBadgeV2
                  ingestSource={ingestSource}
                  source={source}
                />
              </div>
              <p className="mt-1 font-v2-body text-[10px] text-v2-on-surface-variant">
                {timeAgo(createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          {city ? (
            <p className="font-v2-body text-[10px] font-medium uppercase tracking-wider text-v2-on-surface-variant">
              {city}
            </p>
          ) : null}
          <h3 className="font-v2-headline text-lg font-bold leading-tight text-v2-on-surface">
            {title}
          </h3>
        </div>

        {showPos && displayLabel ? (
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
                Position
              </p>
              <p className="font-v2-headline text-3xl font-bold leading-none text-v2-on-surface">
                {rank}
                {suffix ? (
                  <span className="text-lg font-semibold text-v2-on-surface-variant">
                    {suffix}
                  </span>
                ) : null}
              </p>
            </div>
            {pos >= 1 && pos <= 3 && trophyClassName ? (
              <Trophy
                className={cn("size-10 shrink-0", trophyClassName)}
                aria-hidden
                fill="currentColor"
              />
            ) : null}
          </div>
        ) : isPractice ? (
          <p className="font-v2-body text-xs text-v2-on-surface-variant">
            Practice session
          </p>
        ) : null}

        {columns > 0 ? (
          <div
            className={cn(
              "grid gap-3 border-t border-v2-outline-variant/10 pt-4",
              columns >= 4 && "grid-cols-2 sm:grid-cols-4",
              columns === 3 && "grid-cols-3",
              columns === 2 && "grid-cols-2",
              columns === 1 && "grid-cols-1",
            )}
          >
            {showFastest && bestLapMs != null ? (
              <StatCell
                label="Fastest"
                value={formatLapMs(bestLapMs)}
                valueClassName={getPodiumFastestLapClassName(pos)}
              />
            ) : null}
            {showLaps ? (
              <StatCell label="Laps" value={String(lapCount ?? 0)} />
            ) : null}
            {showCar ? (
              <StatCell label="Car" value={carLabel} className="truncate" />
            ) : null}
            {showTime && trackTime ? (
              <StatCell label="Time" value={trackTime} />
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
