/**
 * Carousel for multiple practice or qualifying sessions within a race weekend group.
 */
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ActivityCard, { type SessionPatch } from "./ActivityCard";
import { type SessionItem } from "@/lib/groupSessions";
import { useAuth } from "@/contexts/AuthContext";

type ActivityOwner = {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

function getActivityHeaderFromOwner(
  session: SessionItem,
  currentUser?: { id: string; avatarUrl?: string | null } | null
): {
  name: string;
  avatar: string | null;
} {
  const owner = (session as unknown as { owner?: ActivityOwner }).owner;
  const sessionAny = session as any;
  const sessionOwnerId =
    sessionAny.authorId ??
    ((owner && typeof owner === "object" && "id" in owner && typeof (owner as any).id === "string")
      ? ((owner as any).id as string)
      : null);
  const isCurrentUsersSession =
    Boolean(currentUser?.id) && Boolean(sessionOwnerId) && currentUser!.id === sessionOwnerId;
  const name =
    sessionAny.authorName?.trim() ||
    owner?.displayName?.trim() ||
    owner?.username?.trim() ||
    session.driverName ||
    "—";
  const currentUserAvatar =
    currentUser?.avatarUrl && currentUser.avatarUrl.trim().length > 0
      ? currentUser.avatarUrl
      : null;
  const avatar =
    (isCurrentUsersSession && currentUserAvatar
      ? currentUserAvatar
      : sessionAny.authorAvatarUrl &&
    sessionAny.authorAvatarUrl.trim().length > 0
      ? sessionAny.authorAvatarUrl
      : owner?.avatarUrl && owner.avatarUrl.trim().length > 0
        ? owner.avatarUrl
        : null);
  return { name, avatar };
}

function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

interface BundledActivityCardProps {
  sessions: SessionItem[];
  overflowCount: number;
  onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
}

export default function BundledActivityCard({
  sessions,
  overflowCount,
  onSessionPatch,
}: BundledActivityCardProps) {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSession = sessions[currentIndex];

  const handlePrev = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i > 0 ? i - 1 : i));
    },
    []
  );

  const handleNext = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i < sessions.length - 1 ? i + 1 : i));
    },
    [sessions.length]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev(e);
      if (e.key === "ArrowRight") handleNext(e);
    },
    [handlePrev, handleNext]
  );

  const firstSession = sessions[0];
  const profileOwnerId = (() => {
    const s = firstSession as unknown as {
      authorId?: string | null;
      owner?: { id?: string | null };
    };
    if (typeof s.authorId === "string" && s.authorId.trim()) return s.authorId.trim();
    const oid = s.owner && typeof s.owner === "object" ? s.owner.id : null;
    return typeof oid === "string" && oid.trim() ? oid.trim() : null;
  })();

  const currentHeader = getActivityHeaderFromOwner(currentSession, user ?? null);

  return (
    <div
      className="border-white/6 mb-6 overflow-hidden rounded-lg border shadow-none transition-all duration-300 hover:shadow-sm"
      role="region"
      aria-label={`Bundle of ${sessions.length} sessions`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Carousel */}
      <div className="relative">
        {/* Carousel Controls */}
        <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous session"
            className={`rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-sm transition-all ${
              currentIndex === 0
                ? "cursor-not-allowed opacity-30"
                : "hover:border-white/20 hover:bg-black/70"
            }`}
          >
            <ChevronLeft className="size-4 text-white" />
          </button>
        </div>
        <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === sessions.length - 1}
            aria-label="Next session"
            className={`rounded-full border border-white/10 bg-black/50 p-1.5 backdrop-blur-sm transition-all ${
              currentIndex === sessions.length - 1
                ? "cursor-not-allowed opacity-30"
                : "hover:border-white/20 hover:bg-black/70"
            }`}
          >
            <ChevronRight className="size-4 text-white" />
          </button>
        </div>

        {/* Current Session Card */}
        <div className="p-2">
          <ActivityCard
            id={currentSession.id}
            profileUserId={profileOwnerId}
            userName={currentHeader.name}
            userAvatar={currentHeader.avatar}
            game="—"
            car={currentSession.car ?? "—"}
            vehicleDisplay={currentSession.vehicleDisplay}
            track={currentSession.track ?? "—"}
            position={currentSession.position ?? null}
            qualifyingPosition={currentSession.qualifyingPosition ?? null}
            totalRacers={currentSession.totalDrivers ?? null}
            sessionType={currentSession.sessionType}
            manualSessionKind={currentSession.manualSessionKind ?? null}
            sim={currentSession.sim}
            source={currentSession.source}
            bestLapMs={currentSession.bestLapMs}
            lapCount={currentSession.lapCount}
            consistencyScore={currentSession.consistencyScore}
            likeCount={currentSession.likeCount ?? 0}
            commentCount={currentSession.commentCount ?? 0}
            likedByMe={currentSession.likedByMe ?? false}
            score={0}
            timestamp={timeAgo(currentSession.createdAt)}
            likes={currentSession.likeCount ?? 0}
            comments={currentSession.commentCount ?? 0}
            onSessionPatch={onSessionPatch}
          />
        </div>

        {/* Dot Indicators */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {sessions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setCurrentIndex(i);
              }}
              aria-label={`Go to session ${i + 1}`}
              aria-current={i === currentIndex ? "true" : undefined}
              className={`size-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? "w-3 bg-primary"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
          {overflowCount > 0 &&
            (profileOwnerId ? (
              <Link
                to={`/user/${encodeURIComponent(profileOwnerId)}`}
                onClick={(e) => e.stopPropagation()}
                className="ml-2 text-xs text-white/40 hover:text-white/60"
              >
                +{overflowCount}
              </Link>
            ) : (
              <span className="ml-2 text-xs text-white/30">+{overflowCount}</span>
            ))}
        </div>

        {/* Slide indicator */}
        <div className="absolute bottom-10 right-4 text-xs text-white/40">
          {currentIndex + 1}/{sessions.length}
        </div>
      </div>
    </div>
  );
}
