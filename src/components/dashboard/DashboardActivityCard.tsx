import { useNavigate } from "react-router-dom";
import { memo, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Trophy } from "lucide-react";
import DashboardSessionApexPanel from "@/components/dashboard/DashboardSessionApexPanel";
import {
  parseTrackHeadline,
  splitPositionLabel,
} from "@/components/dashboard/dashboardSessionDisplay";
import {
  getPodiumBestLapClassName,
  getPodiumTrophyClassName,
} from "@/components/dashboard/dashboardPodiumColors";
import { getDisciplineLogoSrc } from "@/components/profile/profileDisciplineAssets";
import { useIsProUser } from "@/contexts/AuthContext";
import { formatLapMs, formatCarName, cn } from "@/lib/utils";
import { resolveApiUrl } from "@/lib/api/config";
import {
  displayPositionRank,
  getDisplayPosition,
  getSessionTypeTagStyle,
  isPracticeKind,
  shouldShowSessionPosition,
} from "@/lib/sessionKind";
import SessionCaption from "@/components/sessions/SessionCaption";
import { preloadSessionDetail } from "@/routes/routePreload";
import { seedSessionDetailFromListItem } from "@/lib/sessions/sessionDetailPrefetch";

function isManualSessionItem(props: {
  sessionType?: string | null;
  source?: string | null;
}): boolean {
  const st = (props.sessionType ?? "").toString().trim().toUpperCase();
  if (st === "MANUAL_ACTIVITY") return true;
  const src = (props.source ?? "").toString().trim();
  if (src.toUpperCase() === "MANUAL_ACTIVITY") return true;
  if (src.toLowerCase() === "manual") return true;
  return false;
}

function hasValidRacePosition(
  position: unknown,
  totalRacers: unknown,
): boolean {
  const toNum = (raw: unknown): number => {
    if (raw == null || raw === "") return 0;
    const n = typeof raw === "number" ? raw : Number(String(raw).trim());
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.trunc(n);
  };
  return toNum(position) > 0 || toNum(totalRacers) > 0;
}

function hasFinishDataForLayout(props: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  position: number | null;
  qualifyingPosition?: number | null;
  totalRacers: number | null;
}): boolean {
  if (
    shouldShowSessionPosition({
      sessionType: props.sessionType,
      manualSessionKind: props.manualSessionKind,
      position: props.position,
      qualifyingPosition: props.qualifyingPosition,
      totalDrivers: props.totalRacers,
    })
  ) {
    return true;
  }
  if (hasValidRacePosition(props.position, props.totalRacers)) return true;
  const qp = props.qualifyingPosition;
  return qp != null && qp > 0;
}

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

function ManualPill() {
  return (
    <span className="inline-flex items-center rounded-apex-sm bg-apex-surface-container-highest px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-apex-on-surface-variant">
      Manual
    </span>
  );
}

type StatCellProps = {
  label: string;
  value: string;
  valueClassName?: string;
  className?: string;
};

function StatCell({ label, value, valueClassName, className }: StatCellProps) {
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

function DashboardPositionRow({
  sessionType,
  manualSessionKind,
  position,
  qualifyingPosition,
  totalRacers,
}: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  position: number | null;
  qualifyingPosition?: number | null;
  totalRacers: number | null;
}) {
  const displaySession = {
    sessionType,
    manualSessionKind,
    position,
    qualifyingPosition,
    totalDrivers: totalRacers,
  };

  if (!shouldShowSessionPosition(displaySession)) return null;

  const displayLabel = getDisplayPosition(displaySession);
  if (!displayLabel) return null;

  const pos = displayPositionRank(displaySession);
  const { rank, suffix } = splitPositionLabel(displayLabel);
  const trophyClassName = getPodiumTrophyClassName(pos);

  return (
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
  );
}

function DashboardStatsRow({
  bestLapMs,
  lapCount,
  car,
  vehicleDisplay,
  showBest,
  showLaps,
  showCar,
  positionRank,
}: {
  bestLapMs?: number | null;
  lapCount?: number;
  car: string;
  vehicleDisplay?: string;
  showBest: boolean;
  showLaps: boolean;
  showCar: boolean;
  positionRank: number;
}) {
  const columns = [showBest, showLaps, showCar].filter(Boolean).length;
  if (columns === 0) return null;

  const carLabel = vehicleDisplay ?? formatCarName(car);
  const bestLapClassName = getPodiumBestLapClassName(positionRank);

  return (
    <div
      className={cn(
        "grid gap-x-3 gap-y-2 border-t border-apex-outline-variant/10 pt-3 sm:gap-3",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 2 && "grid-cols-2",
        columns === 1 && "grid-cols-1",
      )}
    >
      {showBest && bestLapMs != null && (
        <StatCell
          label="Best"
          value={formatLapMs(bestLapMs)}
          valueClassName={bestLapClassName}
        />
      )}
      {showLaps && <StatCell label="Laps" value={String(lapCount ?? 0)} />}
      {showCar && (
        <StatCell
          label="Car"
          value={carLabel}
          valueClassName="truncate"
          className={cn(columns === 3 && "col-span-2 sm:col-span-1")}
        />
      )}
    </div>
  );
}

export type DashboardActivityCardProps = {
  id: string;
  userName: string;
  userAvatar?: string | null;
  car: string;
  vehicleDisplay?: string;
  track: string;
  trackName?: string | null;
  position: number | null;
  qualifyingPosition?: number | null;
  totalRacers: number | null;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  sim?: string | null;
  source?: string | null;
  bestLapMs?: number | null;
  lapCount?: number;
  timestamp: string;
  profileUserId?: string | null;
  apexAnalysis?: { locked: false; insights: string[] } | null;
  caption?: string | null;
};

export default memo(function DashboardActivityCard(
  props: DashboardActivityCardProps,
) {
  const {
    id,
    userName,
    userAvatar,
    car,
    vehicleDisplay,
    track,
    trackName,
    position,
    qualifyingPosition,
    totalRacers,
    sessionType,
    manualSessionKind,
    sim,
    bestLapMs,
    lapCount,
    timestamp,
    profileUserId,
    apexAnalysis,
    caption,
  } = props;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isPro = useIsProUser();
  const isManual = isManualSessionItem(props);
  const isPractice =
    !hasFinishDataForLayout(props) &&
    isPracticeKind({
      sessionType: props.sessionType,
      manualSessionKind: props.manualSessionKind,
    });

  const embeddedInsight =
    isPro && apexAnalysis?.insights?.length ? apexAnalysis.insights[0] : null;

  const warmDetail = useCallback(() => {
    void preloadSessionDetail();
    seedSessionDetailFromListItem(queryClient, {
      id,
      createdAt: timestamp,
      track,
      trackName,
      car,
      vehicleDisplay,
      sim,
      sessionType,
      manualSessionKind,
      position,
      qualifyingPosition,
      totalDrivers: totalRacers,
      bestLapMs,
      lapCount,
      caption,
      source: props.source,
      userId: profileUserId,
    });
  }, [
    queryClient,
    id,
    timestamp,
    track,
    trackName,
    car,
    vehicleDisplay,
    sim,
    sessionType,
    manualSessionKind,
    position,
    qualifyingPosition,
    totalRacers,
    bestLapMs,
    lapCount,
    caption,
    props.source,
    profileUserId,
  ]);

  const goToSession = useCallback(() => {
    warmDetail();
    navigate(`/sessions/${id}`, { state: { from: "home" } });
  }, [navigate, id, warmDetail]);

  const handleShellClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("[data-feed-profile-header]"))
        return;
      goToSession();
    },
    [goToSession],
  );

  const avatarSrc = resolveApiUrl(userAvatar);
  const disciplineLogo = sim ? getDisciplineLogoSrc(sim) : null;
  const { city, title: trackTitle } = parseTrackHeadline(track, trackName);

  const showPosition = shouldShowSessionPosition({
    sessionType,
    manualSessionKind,
    position,
    qualifyingPosition,
    totalDrivers: totalRacers,
  });

  const positionRank = showPosition
    ? displayPositionRank({
        sessionType,
        manualSessionKind,
        position,
        qualifyingPosition,
        totalDrivers: totalRacers,
      })
    : 0;

  const showBest = bestLapMs != null;
  const showLaps = (lapCount ?? 0) > 0 || isPractice || isManual;
  const showCar = Boolean(
    (vehicleDisplay ?? formatCarName(car)) && formatCarName(car) !== "—",
  );

  const statsShowBest = showBest;
  const statsShowLaps = showLaps;
  const statsShowCar = showCar || isManual || isPractice;

  return (
    <article
      className="cursor-pointer overflow-hidden rounded-2xl border border-apex-outline-variant/10 bg-apex-surface-container-low transition-colors hover:bg-apex-surface-container-low/90"
      onClick={handleShellClick}
      onMouseEnter={warmDetail}
      onFocus={warmDetail}
      onPointerDown={warmDetail}
    >
      <div className="space-y-3 p-4 lg:p-5">
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            {profileUserId ? (
              <button
                type="button"
                data-feed-profile-header
                className="flex min-w-0 items-center gap-3 text-left"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/user/${encodeURIComponent(profileUserId)}`);
                }}
              >
                {avatarSrc && avatarSrc.trim().length > 0 ? (
                  <img
                    src={avatarSrc}
                    alt={userName}
                    className="size-9 shrink-0 overflow-hidden rounded-full border border-apex-outline-variant/20 object-cover"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-apex-outline-variant/20 bg-apex-surface-container-high text-xs font-semibold text-apex-on-surface-variant">
                    {(userName || "?")
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("") || "?"}
                  </div>
                )}
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-xs font-bold text-apex-on-surface">
                    {userName}
                  </span>
                  <span className="text-[10px] text-apex-on-surface-variant">
                    {timestamp}
                  </span>
                </div>
              </button>
            ) : (
              <>
                {avatarSrc && avatarSrc.trim().length > 0 ? (
                  <img
                    src={avatarSrc}
                    alt={userName}
                    className="size-9 shrink-0 overflow-hidden rounded-full border border-apex-outline-variant/20 object-cover"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-apex-outline-variant/20 bg-apex-surface-container-high text-xs font-semibold text-apex-on-surface-variant">
                    {(userName || "?")
                      .trim()
                      .split(" ")
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase() ?? "")
                      .join("") || "?"}
                  </div>
                )}
                <div className="flex min-w-0 flex-col leading-tight">
                  <span className="truncate text-xs font-bold text-apex-on-surface">
                    {userName}
                  </span>
                  <span className="text-[10px] text-apex-on-surface-variant">
                    {timestamp}
                  </span>
                </div>
              </>
            )}
          </div>
          {disciplineLogo ? (
            <img
              src={disciplineLogo}
              alt=""
              className="h-5 w-auto max-w-[3.5rem] shrink-0 object-contain opacity-90 sm:h-7 sm:max-w-none"
            />
          ) : null}
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <SessionTypePill
              sessionType={sessionType}
              manualSessionKind={manualSessionKind}
            />
            {isManual ? <ManualPill /> : null}
          </div>
          <div>
            {city ? (
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-apex-on-surface-variant">
                {city}
              </p>
            ) : null}
            <h3 className="font-apex-headline text-lg font-bold leading-tight text-apex-on-surface lg:text-xl">
              {trackTitle}
            </h3>
          </div>
        </div>

        {showPosition ? (
          <DashboardPositionRow
            sessionType={sessionType}
            manualSessionKind={manualSessionKind}
            position={position}
            qualifyingPosition={qualifyingPosition}
            totalRacers={totalRacers}
          />
        ) : null}

        <DashboardStatsRow
          bestLapMs={bestLapMs}
          lapCount={lapCount}
          car={car}
          vehicleDisplay={vehicleDisplay}
          showBest={statsShowBest}
          showLaps={statsShowLaps}
          showCar={statsShowCar}
          positionRank={positionRank}
        />

        <SessionCaption caption={caption} />
      </div>

      {embeddedInsight ? (
        <DashboardSessionApexPanel insight={embeddedInsight} />
      ) : null}
    </article>
  );
});
