import { useNavigate } from "react-router-dom";
import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Heart, MessageCircle, Share2, X } from "lucide-react";
import TrackMapSmall from "./TrackMapSmall";
import SimBadge from "./SimBadge";
import { formatLapMs, formatCarName } from "@/lib/utils";
import { apiGet, apiPost, API_BASE } from "@/lib/api";
import { formatSessionTypeUpper, getSimDisplayName } from "@/lib/sim";

const userNameToSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "-");
};

/** Never show .ibt filename; use track name or "Practice Session" */
function cleanTitle(item: ActivityCardItem): string {
  const t = (item.track ?? "").trim();
  if (t.toLowerCase().endsWith(".ibt")) return "Practice Session";
  if (t && t.toLowerCase() !== "unknown") return t;
  return "Practice Session";
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
  totalRacers: number | null;
  sessionType?: string | null;
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

const getPodiumColor = (pos: number) => {
  if (pos === 1) return "text-gold bg-yellow-950/20 dark:bg-yellow-950/15";
  if (pos === 2) return "text-silver bg-gray-800/15 dark:bg-gray-800/20";
  if (pos === 3) return "text-bronze bg-orange-950/20 dark:bg-orange-950/15";
  return "text-muted-foreground/70 bg-secondary/30";
};

type CommentItem = { id: string; body: string; createdAt?: string };

function CommentsModal({
  sessionId,
  isOpen,
  onClose,
  onCommentAdded,
  onRefreshSession,
}: {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded: () => void;
  onRefreshSession?: () => void;
}) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentPending, setCommentPending] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const loadComments = useCallback((sid: string) => {
    if (commentsLoading) return;
    setCommentsLoading(true);
    setCommentsError(null);
    const controller = new AbortController();
    fetch(`${API_BASE}/api/sessions/${sid}/comments`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load comments");
        return res.json();
      })
      .then((data: { comments?: CommentItem[] }) => {
        setComments(Array.isArray(data?.comments) ? data.comments : []);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setCommentsError("Can't load comments. Backend may be offline.");
      })
      .finally(() => {
        setCommentsLoading(false);
      });
    return controller;
  }, [commentsLoading]);

  useEffect(() => {
    if (!isOpen || !sessionId) return;
    setCommentText("");
    setCommentsError(null);
    const controller = loadComments(sessionId);
    return () => {
      controller?.abort();
    };
  }, [isOpen, sessionId]);

  const submitComment = useCallback(async () => {
    const body = commentText.trim();
    if (!body) return;
    if (commentPending) return;

    setCommentPending(true);
    setCommentError(null);

    try {
      const data = await apiPost<{ comment: CommentItem }>(
        `/api/sessions/${sessionId}/comments`,
        { body }
      );
      if (data?.comment) setComments((prev) => [...prev, data.comment]);
      setCommentText("");
      onCommentAdded();
      onRefreshSession?.();
    } catch {
      setCommentError("Can't post right now. Backend may be offline.");
    } finally {
      setCommentPending(false);
    }
  }, [commentText, sessionId, commentPending, onCommentAdded, onRefreshSession]);

  if (!isOpen) return null;
  if (typeof document === "undefined" || !document.body) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] rounded-t-lg sm:rounded-lg border border-white/10 bg-card/20 backdrop-blur-lg shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h3 className="text-sm font-semibold text-white">Comments</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-white/50 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {commentsLoading ? (
            <p className="text-xs text-zinc-500">Loading comments…</p>
          ) : commentsError ? (
            <div className="space-y-2">
              <p className="text-xs text-zinc-500">{commentsError}</p>
              <button
                type="button"
                onClick={() => loadComments(sessionId)}
                className="text-xs text-zinc-400 hover:text-zinc-300 underline"
              >
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-zinc-500">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm text-white/80">
                  <p>{c.body}</p>
                  {c.createdAt && (
                    <p className="text-xs text-white/50 mt-0.5">
                      {new Date(c.createdAt).toLocaleString()}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          <div className="flex gap-2">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                void submitComment();
              }
            }}
            placeholder="Add a comment..."
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          <button
            type="button"
            disabled={commentPending || !commentText.trim()}
            className={`rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/15 disabled:pointer-events-none ${commentPending || !commentText.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
            onClick={() => void submitComment()}
          >
            {commentPending ? "Posting…" : "Post"}
          </button>
          </div>
          {commentError && (
            <div className="text-xs text-red-400">{commentError}</div>
          )}
        </div>
      </div>
    </div>
  );

  try {
    return createPortal(modalContent, document.body);
  } catch {
    return null;
  }
}

/** Original race stats: POSITION row + BEST/FASTEST row + CAR row — do not change markup */
function OriginalRaceStats({ item }: { item: ActivityCardItem }) {
  const lapTimeDisplay = formatLapMs(item.bestLapMs);
  const pos = item.position ?? 0;
  const total = item.totalRacers ?? 0;
  return (
    <>
      {/* Podium Result - HERO with subtle styling */}
      <div
        className={`${getPodiumColor(pos)} rounded-lg p-3 mb-4 flex items-center justify-between`}
      >
        <div>
          <p className="text-xs font-medium text-white/70 uppercase mb-0.5">
            Position
          </p>
          <p
            className={`leading-tight ${pos <= 3 ? "text-lg sm:text-xl font-semibold" : "text-base sm:text-lg font-semibold"}`}
          >
            {pos}
            <span className="text-xs font-medium ml-0.5">/ {total}</span>
          </p>
        </div>
        {pos <= 3 && (
          <div className="text-xl sm:text-2xl flex-shrink-0">
            {pos === 1 && "🥇"}
            {pos === 2 && "🥈"}
            {pos === 3 && "🥉"}
          </div>
        )}
      </div>

      {/* Secondary Stats - Subtle */}
      <div className="grid grid-cols-2 gap-4">
        {/* Fastest Lap */}
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">
            {item.bestLapMs != null ? "Fastest" : "Best"}
          </p>
          <p className="text-xs sm:text-sm font-semibold text-white">
            {lapTimeDisplay}
          </p>
        </div>

        {/* Car */}
        <div>
          <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">
            Car
          </p>
          <p className="text-xs sm:text-sm font-semibold text-white truncate">
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
      <div className="rounded-lg border border-white/5 bg-white/5 px-4 py-3 flex items-center justify-between">
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
        <div className="text-xs uppercase tracking-wider text-white/50">Car</div>
        <div className="mt-1 font-semibold text-white">
          {item.vehicleDisplay ?? formatCarName(item.car)}
        </div>
      </div>
    </div>
  );
}

/** Manual activity: Sim • Track • Car (if present), Best Lap (if present), Position (if present). No lap count or telemetry stats. */
function ManualStatsBlock({ item }: { item: ActivityCardItem }) {
  const simName = getSimDisplayName(item.sim);
  const trackName = item.track ?? "—";
  const carName = item.vehicleDisplay ?? formatCarName(item.car);
  const parts = [simName, trackName];
  if (carName && carName !== "—") parts.push(carName);
  const metaLine = parts.join(" • ");

  return (
    <div>
      <div className="text-xs text-white/50 mb-3">{metaLine}</div>
      <div className="grid grid-cols-2 gap-4">
        {item.bestLapMs != null && (
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">
              Best Lap
            </p>
            <p className="text-xs sm:text-sm font-semibold text-white">
              {formatLapMs(item.bestLapMs)}
            </p>
          </div>
        )}
        {item.position != null && (
          <div>
            <p className="text-xs font-medium text-white/50 uppercase tracking-widest mb-1">
              Position
            </p>
            <p className="text-xs sm:text-sm font-semibold text-white">
              P{item.position}
              {item.totalRacers != null && (
                <span className="text-white/60"> / {item.totalRacers}</span>
              )}
            </p>
          </div>
        )}
      </div>
      {item.bestLapMs == null && item.position == null && (
        <div className="h-10" aria-hidden />
      )}
    </div>
  );
}

/** Full race card shell; stats area is either statsOverride (practice) or OriginalRaceStats (race) */
function RaceCardContent({
  item,
  statsOverride,
  likedByMe,
  likeCount,
  commentCount,
  likePending,
  onLikeClick,
  onCommentClick,
}: {
  item: ActivityCardItem;
  statsOverride?: React.ReactNode;
  likedByMe: boolean;
  likeCount: number;
  commentCount: number;
  likePending: boolean;
  onLikeClick: (e: React.MouseEvent) => void;
  onCommentClick: (e: React.MouseEvent) => void;
}) {
  const navigate = useNavigate();
  const isManual = item.source === "MANUAL_ACTIVITY";
  const isEmptySession = !isManual && (item.lapCount ?? 0) === 0;
  const isStrongSession =
    !isManual &&
    (item.lapCount ?? 0) > 5 &&
    (item.consistencyScore ?? 0) >= 80;
  return (
    <div className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 overflow-hidden shadow-none hover:shadow-sm active:bg-card/30 active:shadow-md transition-all duration-300 cursor-pointer mb-6">
        {/* Header with user info */}
        <div className="px-4 sm:px-5 py-3 sm:py-3.5">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/user/${userNameToSlug(item.userName)}`);
            }}
            className="w-full flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity group text-left"
          >
            <img
              src={item.userAvatar}
              alt={item.userName}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover group-hover:ring-1.5 group-hover:ring-primary transition-all flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white group-hover:text-primary transition-colors text-xs sm:text-sm">
                {item.userName}
              </p>
              <p className="text-xs text-white/50 mt-0.5">{item.timestamp}</p>
            </div>
          </button>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-5 pt-1.5 pb-4 sm:pt-1.5 sm:pb-5 flex gap-4 relative">
          {/* Left side - Stats and info */}
          <div className="flex-1 relative z-10">
            {/* Track and Game info */}
            <div className="mb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="text-xs uppercase tracking-wider font-medium text-[rgb(240,28,28)]">
                    {formatSessionTypeUpper(item.sessionType)}
                  </div>
                  <SimBadge sim={item.sim} />
                  {isManual && (
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium tracking-wide rounded border bg-white/5 text-white/60 border-white/10">
                      Manual
                    </span>
                  )}
                </div>
                {isStrongSession && (
                  <div className="mt-1 text-xs text-emerald-400">
                    Strong Session
                  </div>
                )}
                {isEmptySession && !isManual && (
                  <div className="mt-1 text-xs text-white/40">
                    No laps recorded
                  </div>
                )}
                <div className="mt-1.5 text-lg font-semibold text-white">
                  {cleanTitle(item)}
                </div>
              </div>
            </div>

            {/* Stats area: manual, practice override, or original race stats */}
            <div className={isEmptySession ? "opacity-60" : ""}>
              {isManual ? (
                <ManualStatsBlock item={item} />
              ) : (
                statsOverride ?? <OriginalRaceStats item={item} />
              )}
            </div>
          </div>

          {/* Right side - Track Map - Hidden on mobile */}
          <div className="hidden sm:flex items-start justify-end shrink-0 relative z-10 pt-0.5">
            <TrackMapSmall track={item.track} />
          </div>
        </div>

        {/* Footer with actions */}
        <div className="px-4 sm:px-5 py-2 sm:py-2.5 flex items-center justify-between border-t border-white/3 bg-white/2">
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
              className={`flex items-center gap-1 transition-colors group py-1 px-1 ${likedByMe ? "text-red-400 hover:text-red-300" : "text-white/60 hover:text-white/80"} ${likePending ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${likedByMe ? "fill-red-400" : "group-hover:fill-primary"}`}
              />
              <span className="text-xs">{likeCount}</span>
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
              className="flex items-center gap-1 text-white/60 hover:text-white/80 transition-colors py-1 px-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="text-xs text-white/60">{commentCount}</span>
            </button>
          </div>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="text-white/40 hover:text-white/60 transition-colors p-1"
          >
            <Share2 className="w-3.5 h-3.5" />
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
  userAvatar: string;
  game: string;
  car: string;
  vehicleDisplay?: string;
  track: string;
  position: number | null;
  totalRacers: number | null;
  sessionType?: "PRACTICE" | "RACE" | "QUALIFY" | "UNKNOWN";
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
}

export default function ActivityCard(props: ActivityCardProps) {
  const isPractice =
    props.sessionType === "PRACTICE" ||
    props.sessionType === "UNKNOWN" ||
    props.sessionType == null;

  const [likedByMe, setLikedByMe] = useState(props.likedByMe ?? false);
  const [likeCount, setLikeCount] = useState(props.likeCount ?? props.likes ?? 0);
  const [commentCount, setCommentCount] = useState(
    props.commentCount ?? props.comments ?? 0
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [likePending, setLikePending] = useState(false);

  // Only sync from props when the card identity changes (different session)
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
          {}
        );
        const newLiked = Boolean(data.liked);
        const newCount = Number(data.likeCount ?? 0);
        setLikedByMe(newLiked);
        setLikeCount(newCount);
        if (props.onSessionPatch) {
          props.onSessionPatch(props.id, { likedByMe: newLiked, likeCount: newCount });
        }
      } catch {
        setLikedByMe(prevLiked);
        setLikeCount(prevCount);
      } finally {
        setLikePending(false);
      }
    },
    [props.id, props.onSessionPatch, likedByMe, likeCount, likePending]
  );

  const onCommentClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCommentsOpen(true);
  }, []);

  const onCommentAdded = useCallback(() => {
    setCommentCount((c) => {
      const next = c + 1;
      if (props.onSessionPatch) props.onSessionPatch(props.id, { commentCount: next });
      return next;
    });
  }, [props.id, props.onSessionPatch]);

  const refreshSessionSocial = useCallback(
    async (sid: string) => {
      try {
        const res = await fetch(`${API_BASE}/api/sessions/${sid}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
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
    [props.onSessionPatch]
  );

  const closeCommentsModal = useCallback(() => {
    setCommentsOpen(false);
    void refreshSessionSocial(props.id);
  }, [props.id, refreshSessionSocial]);

  const item: ActivityCardItem = {
    id: props.id,
    userName: props.userName,
    userAvatar: props.userAvatar,
    game: props.game,
    car: props.car,
    vehicleDisplay: props.vehicleDisplay,
    track: props.track,
    position: props.position,
    totalRacers: props.totalRacers,
    sessionType: props.sessionType,
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
        statsOverride={isPractice ? <PracticeStatsBlock item={item} /> : undefined}
        likedByMe={likedByMe}
        likeCount={likeCount}
        commentCount={commentCount}
        likePending={likePending}
        onLikeClick={onLikeClick}
        onCommentClick={onCommentClick}
      />
      <CommentsModal
        sessionId={props.id}
        isOpen={commentsOpen}
        onClose={closeCommentsModal}
        onCommentAdded={onCommentAdded}
        onRefreshSession={() => refreshSessionSocial(props.id)}
      />
    </>
  );
}
