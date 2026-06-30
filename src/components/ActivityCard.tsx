import { useNavigate } from "react-router-dom";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Heart, MessageCircle, Share2 } from "lucide-react";
import SimBadge from "./SimBadge";
import SessionTypeTag from "./SessionTypeTag";
import SessionShareModal from "@/components/SessionShareModal";
import {
  formatLapMs,
  formatCarName,
  formatCompactCount,
  cn,
} from "@/lib/utils";
import { apiPost, API_BASE, resolveApiUrl } from "@/lib/api";
import { SessionCommentsModal } from "@/components/SessionCommentsModal";
import { buildSessionShareText } from "@/lib/sessionShareText";
import { publicSessionUrl } from "@/lib/siteMeta";
import { getToken } from "@/auth/token";
import { getSimDisplayName } from "@/lib/sim";
import { formatTrackName } from "@/lib/tracks";
import {
  displayPositionRank,
  getDisplayPosition,
  shouldShowSessionPosition,
  isPracticeKind,
} from "@/lib/sessionKind";

/** Never show .ibt filename; use formatted track name or "Practice Session" */
function cleanTitle(item: ActivityCardItem): string {
  const t = (item.track ?? "").trim();
  if (t.toLowerCase().endsWith(".ibt")) return "Practice Session";
  if (t && t.toLowerCase() !== "unknown") return formatTrackName(t);
  return "Practice Session";
}

function formatSessionLapCountLabel(lapCount: number | undefined): string {
  const n = lapCount ?? 0;
  return `${n} lap${n === 1 ? "" : "s"}`;
}

function LapCountStat({ lapCount }: { lapCount?: number }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
        Laps
      </p>
      <p className="text-xs font-semibold tabular-nums text-white sm:text-sm">
        {lapCount ?? 0}
      </p>
    </div>
  );
}

/** Item shape for stats blocks and RaceCardContent */
interface ActivityCardItem {
  id: string;
  userName: string;
  userAvatar: string;
  game: string;
  car: string;
  vehicleDisplay?: string;
  track: string;
  position: number | null;
  qualifyingPosition?: number | null;
  totalRacers: number | null;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  sim?: string | null;
  source?: string | null;
  bestLapMs?: number | null;
  lapCount?: number;
  consistencyScore?: number | null;
  timestamp: string;
  likes: number;
  comments: number;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
}

/** Feed uses `source: "manual"`; detail APIs may use `MANUAL_ACTIVITY`. */
function isManualSessionItem(item: ActivityCardItem): boolean {
  const st = (item.sessionType ?? "").toString().trim().toUpperCase();
  if (st === "MANUAL_ACTIVITY") return true;
  const src = (item.source ?? "").toString().trim();
  if (src.toUpperCase() === "MANUAL_ACTIVITY") return true;
  if (src.toLowerCase() === "manual") return true;
  return false;
}

const getPodiumColor = (pos: number) => {
  if (pos === 1) return "text-gold bg-yellow-950/20 dark:bg-yellow-950/15";
  if (pos === 2) return "text-silver bg-gray-800/15 dark:bg-gray-800/20";
  if (pos === 3) return "text-bronze bg-orange-950/20 dark:bg-orange-950/15";
  return "";
};

/** Coerce session position / grid size from the API (sometimes string) for numeric comparisons and podium UI. */
function activityPositionValue(raw: unknown): number {
  if (raw == null || raw === "") return 0;
  const n = typeof raw === "number" ? raw : Number(String(raw).trim());
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.trunc(n);
}

/** Original race stats: POSITION row (only when valid) + BEST/FASTEST row + CAR row */
function OriginalRaceStats({ item }: { item: ActivityCardItem }) {
  const displaySession = {
    sessionType: item.sessionType,
    manualSessionKind: item.manualSessionKind,
    position: item.position,
    qualifyingPosition: item.qualifyingPosition,
    totalDrivers: item.totalRacers,
  };
  const displayLabel = getDisplayPosition(displaySession);
  const showPosition = shouldShowSessionPosition(displaySession);
  const pos = displayPositionRank(displaySession);
  const showBest = item.bestLapMs != null;
  const lapTimeDisplay = showBest ? formatLapMs(item.bestLapMs) : "";

  // If we only have Position + Car (no best lap), keep the layout balanced.
  if (showPosition && !showBest) {
    return (
      <div
        className={`grid ${(item.lapCount ?? 0) > 0 ? "grid-cols-3" : "grid-cols-2"} gap-4`}
      >
        <div
          className={`${getPodiumColor(pos)} flex items-center justify-between rounded-lg p-3`}
        >
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase text-white/70">
              Position
            </p>
            <p
              className={`leading-tight ${pos <= 3 && pos > 0 ? "text-lg font-semibold sm:text-xl" : "text-base font-semibold sm:text-lg"}`}
            >
              {displayLabel}
            </p>
          </div>
          {pos >= 1 && pos <= 3 && (
            <div className="shrink-0 text-xl sm:text-2xl" aria-hidden>
              {["🥇", "🥈", "🥉"][pos - 1]}
            </div>
          )}
        </div>

        {(item.lapCount ?? 0) > 0 && <LapCountStat lapCount={item.lapCount} />}

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
            Car
          </p>
          <p className="truncate text-xs font-semibold text-white sm:text-sm">
            {item.vehicleDisplay ?? formatCarName(item.car)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPosition && (
        <div
          className={`${getPodiumColor(pos)} mb-4 flex items-center justify-between rounded-lg p-3`}
        >
          <div>
            <p className="mb-0.5 text-xs font-medium uppercase text-white/70">
              Position
            </p>
            <p
              className={`leading-tight ${pos <= 3 && pos > 0 ? "text-lg font-semibold sm:text-xl" : "text-base font-semibold sm:text-lg"}`}
            >
              {displayLabel}
            </p>
          </div>
          {pos >= 1 && pos <= 3 && (
            <div className="shrink-0 text-xl sm:text-2xl" aria-hidden>
              {["🥇", "🥈", "🥉"][pos - 1]}
            </div>
          )}
        </div>
      )}

      {/* Secondary Stats - Subtle */}
      <div
        className={`grid ${
          showBest && (item.lapCount ?? 0) > 0
            ? "grid-cols-3"
            : showBest
              ? "grid-cols-2"
              : "grid-cols-1"
        } gap-4`}
      >
        {showBest && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
              Fastest
            </p>
            <p className="text-xs font-semibold text-white sm:text-sm">
              {lapTimeDisplay}
            </p>
          </div>
        )}

        {showBest && (item.lapCount ?? 0) > 0 && (
          <LapCountStat lapCount={item.lapCount} />
        )}

        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
            Car
          </p>
          <p className="truncate text-xs font-semibold text-white sm:text-sm">
            {item.vehicleDisplay ?? formatCarName(item.car)}
          </p>
        </div>
      </div>
    </>
  );
}

/** Practice-only stats: BEST LAP + LAPS in one pill, CAR below (no POSITION) */
function PracticeStatsBlock({ item }: { item: ActivityCardItem }) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-4 py-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-white/50">
            Best Lap
          </div>
          <div className="mt-0.5 text-lg font-semibold text-white">
            {formatLapMs(item.bestLapMs)}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs uppercase tracking-wider text-white/50">
            Laps
          </div>
          <div className="mt-0.5 text-lg font-semibold text-white">
            {item.lapCount ?? 0}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-white/50">
          Car
        </div>
        <div className="mt-1 font-semibold text-white">
          {item.vehicleDisplay ?? formatCarName(item.car)}
        </div>
      </div>
    </div>
  );
}

/** Manual activity: Sim • Track • Car (if present), Best Lap (if present), Position (if present). */
function ManualStatsBlock({ item }: { item: ActivityCardItem }) {
  const simName = getSimDisplayName(item.sim);
  const trackName = formatTrackName(item.track);
  const carName = item.vehicleDisplay ?? formatCarName(item.car);
  const parts = [simName, trackName];
  if (carName && carName !== "—") parts.push(carName);
  const metaLine = parts.join(" • ");
  const showLaps = (item.lapCount ?? 0) > 0;

  return (
    <div>
      <div className="mb-3 text-xs text-white/50">{metaLine}</div>
      <div
        className={`grid gap-4 ${
          showLaps && item.bestLapMs != null
            ? "grid-cols-3"
            : showLaps || item.bestLapMs != null
              ? "grid-cols-2"
              : "grid-cols-1"
        }`}
      >
        {item.bestLapMs != null && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
              Best Lap
            </p>
            <p className="text-xs font-semibold text-white sm:text-sm">
              {formatLapMs(item.bestLapMs)}
            </p>
          </div>
        )}
        {showLaps && <LapCountStat lapCount={item.lapCount} />}
        {shouldShowSessionPosition({
          sessionType: item.sessionType,
          manualSessionKind: item.manualSessionKind,
          position: item.position,
          qualifyingPosition: item.qualifyingPosition,
          totalDrivers: item.totalRacers,
        }) &&
          (() => {
            const displaySession = {
              sessionType: item.sessionType,
              manualSessionKind: item.manualSessionKind,
              position: item.position,
              qualifyingPosition: item.qualifyingPosition,
              totalDrivers: item.totalRacers,
            };
            const displayLabel = getDisplayPosition(displaySession);
            const pos = displayPositionRank(displaySession);
            return (
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-widest text-white/50">
                  Position
                </p>
                <div
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-lg py-2",
                    getPodiumColor(pos),
                    pos <= 3 && pos > 0 && "px-4",
                  )}
                >
                  <p className="text-xs font-semibold text-white sm:text-sm">
                    {displayLabel}
                  </p>
                  {pos >= 1 && pos <= 3 && (
                    <span className="shrink-0 text-lg" aria-hidden>
                      {["🥇", "🥈", "🥉"][pos - 1]}
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
      </div>
      {item.bestLapMs == null &&
        !shouldShowSessionPosition({
          sessionType: item.sessionType,
          manualSessionKind: item.manualSessionKind,
          position: item.position,
          qualifyingPosition: item.qualifyingPosition,
          totalDrivers: item.totalRacers,
        }) && <div className="h-10" aria-hidden />}
    </div>
  );
}

/** Full race card shell; stats area is either statsOverride (practice) or OriginalRaceStats (race) */
function RaceCardContent({
  item,
  profileUserId,
  statsOverride,
  likedByMe,
  likeCount,
  commentCount,
  likePending,
  onLikeClick,
  onCommentClick,
  onShareClick,
}: {
  item: ActivityCardItem;
  /** When set, avatar + name navigate here; clicks stop propagation so the card shell opens the session only for other areas. */
  profileUserId?: string | null;
  statsOverride?: React.ReactNode;
  likedByMe: boolean;
  likeCount: number;
  commentCount: number;
  likePending: boolean;
  onLikeClick: (e: React.MouseEvent) => void;
  onCommentClick: (e: React.MouseEvent) => void;
  onShareClick: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const goToSession = () => navigate(`/sessions/${item.id}`);
  const handleShellClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if ((e.target as HTMLElement).closest("[data-feed-profile-header]")) return;
    goToSession();
  };
  const isManual = isManualSessionItem(item);
  /** Telemetry/practice rows with no laps; false for manual so we don't show "No laps recorded" on manual cards. */
  const isEmptySession = !isManual && (item.lapCount ?? 0) === 0;
  const isStrongSession =
    !isManual && (item.lapCount ?? 0) > 5 && (item.consistencyScore ?? 0) >= 75;

  const avatarSrc = resolveApiUrl(item.userAvatar);

  return (
    <div
      className="border-white/6 mb-6 cursor-pointer overflow-hidden rounded-lg border bg-card/20 shadow-none backdrop-blur-lg transition-all duration-300 hover:shadow-sm active:bg-card/30 active:shadow-md"
      onClick={handleShellClick}
    >
      {/* Header with user info */}
      <div className="px-4 py-2.5 sm:px-5 sm:py-3">
        {profileUserId ? (
          <div className="w-full">
            <button
              type="button"
              data-feed-profile-header
              className="-mx-1 flex max-w-full items-center gap-2 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-white/5 sm:gap-3"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${encodeURIComponent(profileUserId)}`);
              }}
            >
              {avatarSrc && avatarSrc.trim().length > 0 ? (
                <img
                  src={avatarSrc}
                  alt={item.userName}
                  className="size-8 shrink-0 rounded-full object-cover sm:size-9"
                />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80 sm:size-9">
                  {(item.userName || "?")
                    .trim()
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((p) => p[0]?.toUpperCase() ?? "")
                    .join("") || "?"}
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="min-w-0 truncate text-xs font-medium text-white sm:text-sm">
                  {item.userName}
                </p>

                <p className="mt-0.5 text-xs text-white/50">{item.timestamp}</p>
              </div>
            </button>
          </div>
        ) : (
          <div className="flex w-full items-center gap-2 sm:gap-3">
            {avatarSrc && avatarSrc.trim().length > 0 ? (
              <img
                src={avatarSrc}
                alt={item.userName}
                className="size-8 shrink-0 rounded-full object-cover sm:size-9"
              />
            ) : (
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/80 sm:size-9">
                {(item.userName || "?")
                  .trim()
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? "")
                  .join("") || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white sm:text-sm">
                {item.userName}
              </p>
              <p className="mt-0.5 text-xs text-white/50">{item.timestamp}</p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative flex gap-4 px-4 pb-3 pt-1 sm:px-5 sm:pb-4 sm:pt-1">
        {/* Left side - Stats and info */}
        <div className="relative z-10 flex-1">
          {/* Track and Game info */}
          <div className="mb-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SessionTypeTag
                  sessionType={item.sessionType}
                  manualSessionKind={item.manualSessionKind}
                />
                <SimBadge sim={item.sim} />
                {isManual && (
                  <span className="inline-flex items-center rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-white/60">
                    Manual
                  </span>
                )}
              </div>
              {isStrongSession && (
                <div className="mt-1 text-xs text-emerald-400">
                  Strong Session
                </div>
              )}
              {isEmptySession && (
                <div className="mt-1 text-xs text-white/40">
                  No laps recorded
                </div>
              )}
              <div className="mt-1.5 text-lg font-semibold text-white">
                {cleanTitle(item)}
              </div>
              {(item.lapCount ?? 0) > 0 && (
                <div className="mt-1 text-xs font-medium tabular-nums text-white/50">
                  {formatSessionLapCountLabel(item.lapCount)}
                </div>
              )}
            </div>
          </div>

          {/* Stats area: manual, practice override, or original race stats */}
          <div className={isEmptySession ? "opacity-60" : ""}>
            {isManual ? (
              <ManualStatsBlock item={item} />
            ) : (
              (statsOverride ?? <OriginalRaceStats item={item} />)
            )}
          </div>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="border-white/3 bg-white/2 flex items-center justify-between border-t px-4 py-2 sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            disabled={likePending}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              void onLikeClick(e);
            }}
            className={`group flex items-center gap-1 p-1 transition-colors ${likedByMe ? "text-red-400 hover:text-red-300" : "text-white/60 hover:text-white/80"} ${likePending ? "cursor-not-allowed opacity-50" : ""}`}
          >
            <Heart
              className={`size-3.5 ${likedByMe ? "fill-red-400" : "group-hover:fill-primary"}`}
            />
            <span className="text-xs">{formatCompactCount(likeCount)}</span>
          </button>
          <button
            type="button"
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCommentClick(e);
            }}
            className="flex items-center gap-1 p-1 text-white/60 transition-colors hover:text-white/80"
          >
            <MessageCircle className="size-3.5" />
            <span className="text-xs text-white/60">
              {formatCompactCount(commentCount)}
            </span>
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onShareClick(e);
          }}
          className="p-1 text-white/40 transition-colors hover:text-white/60"
          aria-label="Share"
        >
          <Share2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

export type SessionPatch = Partial<{
  likedByMe: boolean;
  likeCount: number;
  commentCount: number;
}>;

interface ActivityCardProps {
  id: string;
  userName: string;
  userAvatar?: string | null;
  game: string;
  car: string;
  vehicleDisplay?: string;
  track: string;
  position: number | null;
  qualifyingPosition?: number | null;
  totalRacers: number | null;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  sim?: string | null;
  source?: string | null;
  bestLapMs?: number | null;
  lapCount?: number;
  consistencyScore?: number | null;
  likeCount?: number;
  commentCount?: number;
  likedByMe?: boolean;
  score: number;
  timestamp: string;
  likes: number;
  comments: number;
  onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
  /** Activity / session owner id for linking avatar + name to `/user/:id`. */
  profileUserId?: string | null;
}

/** True when position/total represent a valid race result (legacy feed rows). */
function hasValidRacePosition(
  position: unknown,
  totalRacers: unknown,
): boolean {
  const pos = activityPositionValue(position);
  const total = activityPositionValue(totalRacers);
  return pos > 0 || total > 0;
}

/** Feed may map UNKNOWN → PRACTICE while still carrying finish data — keep race stats + medals. */
function hasFinishDataForLayout(props: ActivityCardProps): boolean {
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

export default function ActivityCard(props: ActivityCardProps) {
  const isPractice =
    !hasFinishDataForLayout(props) &&
    isPracticeKind({
      sessionType: props.sessionType,
      manualSessionKind: props.manualSessionKind,
    });

  const [likedByMe, setLikedByMe] = useState(props.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(
    props.likeCount ?? props.likes ?? 0,
  );
  const [commentCount, setCommentCount] = useState(
    props.commentCount ?? props.comments ?? 0,
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const shareUrl = useMemo(() => publicSessionUrl(props.id), [props.id]);

  const shareText = useMemo(
    () =>
      buildSessionShareText({
        sessionType: props.sessionType,
        track: props.track,
        car: props.car,
        vehicleDisplay: props.vehicleDisplay,
        lapCount: props.lapCount,
        bestLapMs: props.bestLapMs,
        consistencyScore: props.consistencyScore,
        sim: props.sim,
        source: props.source,
      }),
    [
      props.sessionType,
      props.track,
      props.car,
      props.vehicleDisplay,
      props.lapCount,
      props.bestLapMs,
      props.consistencyScore,
      props.sim,
      props.source,
    ],
  );

  const onShareClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalOpen(true);
  }, []);

  // Only sync from props when the card identity changes (different session)
  /* eslint-disable react-hooks/exhaustive-deps -- deliberate: sync local state on session id only; callbacks use stable prop subset */
  useEffect(() => {
    setLikedByMe(props.likedByMe ?? false);
    setLikeCount(props.likeCount ?? props.likes ?? 0);
    setCommentCount(props.commentCount ?? props.comments ?? 0);
  }, [props.id]);

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
          `/api/sessions/${props.id}/like`,
          {},
        );
        const newLiked = Boolean(data.liked);
        const newCount = Number(data.likeCount ?? 0);
        setLikedByMe(newLiked);
        setLikeCount(newCount);
        if (props.onSessionPatch) {
          props.onSessionPatch(props.id, {
            likedByMe: newLiked,
            likeCount: newCount,
          });
        }
      } catch {
        setLikedByMe(prevLiked);
        setLikeCount(prevCount);
      } finally {
        setLikePending(false);
      }
    },
    [props.id, props.onSessionPatch, likedByMe, likeCount, likePending],
  );

  const onCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsOpen(true);
  }, []);

  const onCommentAdded = useCallback(() => {
    setCommentCount((c) => {
      const next = c + 1;
      if (props.onSessionPatch)
        props.onSessionPatch(props.id, { commentCount: next });
      return next;
    });
  }, [props.id, props.onSessionPatch]);

  const refreshSessionSocial = useCallback(
    async (sid: string) => {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const token = getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/api/sessions/${sid}`, {
          method: "GET",
          headers,
        });
        if (!res.ok) return;
        const data = await res.json();
        const s = data.session ?? data;
        props.onSessionPatch?.(sid, {
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
    [props.onSessionPatch],
  );
  /* eslint-enable react-hooks/exhaustive-deps */

  const closeCommentsModal = useCallback(() => {
    setCommentsOpen(false);
    void refreshSessionSocial(props.id);
  }, [props.id, refreshSessionSocial]);

  const item: ActivityCardItem = {
    id: props.id,
    userName: props.userName,
    userAvatar: props.userAvatar ?? "",
    game: props.game,
    car: props.car,
    vehicleDisplay: props.vehicleDisplay,
    track: props.track,
    position: props.position,
    qualifyingPosition: props.qualifyingPosition,
    totalRacers: props.totalRacers,
    sessionType: props.sessionType,
    manualSessionKind: props.manualSessionKind,
    sim: props.sim,
    source: props.source,
    bestLapMs: props.bestLapMs,
    lapCount: props.lapCount,
    consistencyScore: props.consistencyScore,
    timestamp: props.timestamp,
    likes: likeCount,
    comments: commentCount,
    likeCount,
    commentCount,
    likedByMe,
  };

  return (
    <>
      <RaceCardContent
        item={item}
        profileUserId={props.profileUserId}
        statsOverride={
          isPractice ? <PracticeStatsBlock item={item} /> : undefined
        }
        likedByMe={likedByMe}
        likeCount={likeCount}
        commentCount={commentCount}
        likePending={likePending}
        onLikeClick={onLikeClick}
        onCommentClick={onCommentClick}
        onShareClick={onShareClick}
      />
      <SessionCommentsModal
        sessionId={props.id}
        isOpen={commentsOpen}
        onClose={closeCommentsModal}
        onCommentAdded={onCommentAdded}
        onRefreshSession={() => refreshSessionSocial(props.id)}
      />
      <SessionShareModal
        open={shareModalOpen}
        onOpenChange={setShareModalOpen}
        shareUrl={shareUrl}
        shareText={shareText}
      />
    </>
  );
}
