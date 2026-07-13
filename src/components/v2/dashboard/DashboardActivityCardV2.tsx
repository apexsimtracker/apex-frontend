import { useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect, useMemo } from "react";
import { Heart, MessageCircle, Share2, Trophy } from "lucide-react";
import SessionShareModalV2 from "@/components/v2/SessionShareModalV2";
import DashboardSessionApexPanelV2 from "@/components/v2/dashboard/DashboardSessionApexPanelV2";
import {
  parseTrackHeadline,
  splitPositionLabel,
} from "@/components/v2/dashboard/dashboardSessionDisplay";
import {
  getPodiumFastestLapClassName,
  getPodiumTrophyClassName,
} from "@/components/v2/dashboard/dashboardPodiumColors";
import { getDisciplineLogoSrc } from "@/components/v2/profile/profileDisciplineAssets";
import { SessionCommentsModalV2 } from "@/pages/v2/session/SessionCommentsModalV2";
import { useIsProUser } from "@/contexts/AuthContext";
import {
  formatLapMs,
  formatCarName,
  formatCompactCount,
  cn,
} from "@/lib/utils";
import { apiPost, API_BASE, resolveApiUrl } from "@/lib/api";
import { buildSessionShareText } from "@/lib/sessionShareText";
import { publicSessionUrl } from "@/lib/siteMeta";
import { getToken } from "@/auth/token";
import {
  displayPositionRank,
  getDisplayPosition,
  getSessionTypeTagStyle,
  isPracticeKind,
  shouldShowSessionPosition,
} from "@/lib/sessionKind";

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

function ManualPillV2() {
  return (
    <span className="inline-flex items-center rounded-v2-sm bg-v2-surface-container-highest px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-v2-on-surface-variant">
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
      <p className="mb-0.5 text-[9px] font-bold uppercase tracking-wider text-v2-on-surface-variant">
        {label}
      </p>
      <p
        className={cn(
          "font-v2-headline text-xs font-bold text-v2-on-surface lg:text-sm",
          valueClassName,
        )}
      >
        {value}
      </p>
    </div>
  );
}

function DashboardPositionRowV2({
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
        <p className="mb-0.5 text-[9px] font-bold uppercase tracking-widest text-v2-on-surface-variant">
          Position
        </p>
        <p className="font-v2-headline text-2xl font-bold leading-none text-v2-on-surface">
          {rank}
          {suffix ? (
            <span className="text-base font-semibold text-v2-on-surface-variant">
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

function DashboardStatsRowV2({
  bestLapMs,
  lapCount,
  car,
  vehicleDisplay,
  showFastest,
  showLaps,
  showCar,
  positionRank,
}: {
  bestLapMs?: number | null;
  lapCount?: number;
  car: string;
  vehicleDisplay?: string;
  showFastest: boolean;
  showLaps: boolean;
  showCar: boolean;
  positionRank: number;
}) {
  const columns = [showFastest, showLaps, showCar].filter(Boolean).length;
  if (columns === 0) return null;

  const carLabel = vehicleDisplay ?? formatCarName(car);
  const fastestLapClassName = getPodiumFastestLapClassName(positionRank);

  return (
    <div
      className={cn(
        "grid gap-x-3 gap-y-2 border-t border-v2-outline-variant/10 pt-3 sm:gap-3",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 2 && "grid-cols-2",
        columns === 1 && "grid-cols-1",
      )}
    >
      {showFastest && bestLapMs != null && (
        <StatCell
          label="Fastest"
          value={formatLapMs(bestLapMs)}
          valueClassName={fastestLapClassName}
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

export type SessionPatch = Partial<{
  likedByMe: boolean;
  likeCount: number;
  commentCount: number;
}>;

export type DashboardActivityCardV2Props = {
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
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  timestamp: string;
  profileUserId?: string | null;
  onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
  apexAnalysis?: { locked: false; insights: string[] } | null;
};

export default function DashboardActivityCardV2(
  props: DashboardActivityCardV2Props,
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
    source,
    bestLapMs,
    lapCount,
    likedByMe: likedByMeProp,
    likeCount: likeCountProp,
    commentCount: commentCountProp,
    timestamp,
    profileUserId,
    onSessionPatch,
    apexAnalysis,
  } = props;

  const navigate = useNavigate();
  const isPro = useIsProUser();
  const isManual = isManualSessionItem(props);
  const isPractice =
    !hasFinishDataForLayout(props) &&
    isPracticeKind({
      sessionType: props.sessionType,
      manualSessionKind: props.manualSessionKind,
    });

  const [likedByMe, setLikedByMe] = useState(likedByMeProp ?? false);
  const [likeCount, setLikeCount] = useState(likeCountProp ?? 0);
  const [commentCount, setCommentCount] = useState(commentCountProp ?? 0);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const embeddedInsight =
    isPro && apexAnalysis?.insights?.length ? apexAnalysis.insights[0] : null;

  const shareUrl = useMemo(() => publicSessionUrl(id), [id]);
  const shareText = useMemo(
    () =>
      buildSessionShareText({
        sessionType,
        track,
        car,
        vehicleDisplay,
        lapCount,
        bestLapMs,
        sim,
        source,
      }),
    [sessionType, track, car, vehicleDisplay, lapCount, bestLapMs, sim, source],
  );

  useEffect(() => {
    setLikedByMe(likedByMeProp ?? false);
    setLikeCount(likeCountProp ?? 0);
    setCommentCount(commentCountProp ?? 0);
  }, [id, likedByMeProp, likeCountProp, commentCountProp]);

  const goToSession = useCallback(() => {
    navigate(`/v2/sessions/${id}`);
  }, [navigate, id]);

  const handleShellClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("[data-feed-profile-header]"))
        return;
      goToSession();
    },
    [goToSession],
  );

  const onLikeClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (likePending) return;
      setLikePending(true);

      const prevLiked = likedByMe;
      const prevCount = likeCount;
      const nextLiked = !prevLiked;
      setLikedByMe(nextLiked);
      setLikeCount(Math.max(0, prevCount + (nextLiked ? 1 : -1)));

      try {
        const data = await apiPost<{ liked: boolean; likeCount: number }>(
          `/api/sessions/${id}/like`,
          {},
        );
        const newLiked = Boolean(data.liked);
        const newCount = Number(data.likeCount ?? 0);
        setLikedByMe(newLiked);
        setLikeCount(newCount);
        onSessionPatch?.(id, {
          likedByMe: newLiked,
          likeCount: newCount,
        });
      } catch {
        setLikedByMe(prevLiked);
        setLikeCount(prevCount);
      } finally {
        setLikePending(false);
      }
    },
    [id, onSessionPatch, likedByMe, likeCount, likePending],
  );

  const onCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsOpen(true);
  }, []);

  const onShareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalOpen(true);
  }, []);

  const onCommentAdded = useCallback(() => {
    setCommentCount((c) => {
      const next = c + 1;
      onSessionPatch?.(id, { commentCount: next });
      return next;
    });
  }, [id, onSessionPatch]);

  const refreshSessionSocial = useCallback(
    async (sid: string) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = getToken();
        if (token) headers.Authorization = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/sessions/${sid}`, {
          method: "GET",
          headers,
        });
        if (!res.ok) return;
        const data = await res.json();
        const s = data.session ?? data;
        onSessionPatch?.(sid, {
          likeCount: Number(s.likeCount ?? 0),
          commentCount: Number(s.commentCount ?? 0),
          likedByMe: Boolean(s.likedByMe),
        });
        setLikeCount(Number(s.likeCount ?? 0));
        setCommentCount(Number(s.commentCount ?? 0));
        setLikedByMe(Boolean(s.likedByMe));
      } catch {
        // ignore
      }
    },
    [onSessionPatch],
  );

  const closeCommentsModal = useCallback(() => {
    setCommentsOpen(false);
    void refreshSessionSocial(id);
  }, [id, refreshSessionSocial]);

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

  const showFastest = bestLapMs != null;
  const showLaps = (lapCount ?? 0) > 0 || isPractice || isManual;
  const showCar = Boolean(
    (vehicleDisplay ?? formatCarName(car)) && formatCarName(car) !== "—",
  );

  const statsShowFastest = showFastest;
  const statsShowLaps = showLaps;
  const statsShowCar = showCar || isManual || isPractice;

  return (
    <>
      <article
        className="cursor-pointer overflow-hidden rounded-2xl border border-v2-outline-variant/10 bg-v2-surface-container-low transition-colors hover:bg-v2-surface-container-low/90"
        onClick={handleShellClick}
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
                    navigate(`/v2/user/${encodeURIComponent(profileUserId)}`);
                  }}
                >
                  {avatarSrc && avatarSrc.trim().length > 0 ? (
                    <img
                      src={avatarSrc}
                      alt={userName}
                      className="size-9 shrink-0 overflow-hidden rounded-full border border-v2-outline-variant/20 object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-v2-outline-variant/20 bg-v2-surface-container-high text-xs font-semibold text-v2-on-surface-variant">
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
                    <span className="truncate text-xs font-bold text-v2-on-surface">
                      {userName}
                    </span>
                    <span className="text-[10px] text-v2-on-surface-variant">
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
                      className="size-9 shrink-0 overflow-hidden rounded-full border border-v2-outline-variant/20 object-cover"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-v2-outline-variant/20 bg-v2-surface-container-high text-xs font-semibold text-v2-on-surface-variant">
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
                    <span className="truncate text-xs font-bold text-v2-on-surface">
                      {userName}
                    </span>
                    <span className="text-[10px] text-v2-on-surface-variant">
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
              <SessionTypePillV2
                sessionType={sessionType}
                manualSessionKind={manualSessionKind}
              />
              {isManual ? <ManualPillV2 /> : null}
            </div>
            <div>
              {city ? (
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-v2-on-surface-variant">
                  {city}
                </p>
              ) : null}
              <h3 className="font-v2-headline text-lg font-bold leading-tight text-v2-on-surface lg:text-xl">
                {trackTitle}
              </h3>
            </div>
          </div>

          {showPosition ? (
            <DashboardPositionRowV2
              sessionType={sessionType}
              manualSessionKind={manualSessionKind}
              position={position}
              qualifyingPosition={qualifyingPosition}
              totalRacers={totalRacers}
            />
          ) : null}

          <DashboardStatsRowV2
            bestLapMs={bestLapMs}
            lapCount={lapCount}
            car={car}
            vehicleDisplay={vehicleDisplay}
            showFastest={statsShowFastest}
            showLaps={statsShowLaps}
            showCar={statsShowCar}
            positionRank={positionRank}
          />

          <div className="flex items-center justify-between border-t border-v2-outline-variant/10 pt-2">
            <div className="flex items-center gap-5 text-v2-on-surface-variant">
              <button
                type="button"
                disabled={likePending}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => void onLikeClick(e)}
                className={cn(
                  "flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:text-v2-on-surface",
                  likedByMe && "text-v2-error",
                  likePending && "cursor-not-allowed opacity-50",
                )}
              >
                <Heart
                  className={cn("size-[18px]", likedByMe && "fill-current")}
                />
                <span>{formatCompactCount(likeCount)}</span>
              </button>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onCommentClick}
                className="flex items-center gap-1.5 text-[11px] font-medium transition-colors hover:text-v2-on-surface"
              >
                <MessageCircle className="size-[18px]" />
                <span>{formatCompactCount(commentCount)}</span>
              </button>
            </div>
            <button
              type="button"
              onClick={onShareClick}
              className="text-v2-on-surface-variant transition-colors hover:text-v2-on-surface"
              aria-label="Share"
            >
              <Share2 className="size-[18px]" />
            </button>
          </div>
        </div>

        {embeddedInsight ? (
          <DashboardSessionApexPanelV2 insight={embeddedInsight} />
        ) : null}
      </article>

      <SessionCommentsModalV2
        sessionId={id}
        isOpen={commentsOpen}
        onClose={closeCommentsModal}
        onCommentAdded={onCommentAdded}
        onRefreshSession={() => refreshSessionSocial(id)}
      />
      <SessionShareModalV2
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        shareText={shareText}
      />
    </>
  );
}
