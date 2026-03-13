import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ActivityCard, { type SessionPatch } from "./ActivityCard";
import { type SessionItem } from "@/lib/groupSessions";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop";

type ActivityOwner = {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

function getActivityHeaderFromOwner(session: SessionItem): {
  name: string;
  avatar: string;
} {
  const owner = (session as unknown as { owner?: ActivityOwner }).owner;
  const name =
    (session as any).authorName?.trim() ||
    owner?.displayName?.trim() ||
    owner?.username?.trim() ||
    session.driverName ||
    "User";
  const avatar =
    ((session as any).authorAvatarUrl &&
    (session as any).authorAvatarUrl.trim().length > 0
      ? (session as any).authorAvatarUrl
      : owner?.avatarUrl && owner.avatarUrl.trim().length > 0
        ? owner.avatarUrl
        : undefined) || DEFAULT_AVATAR;
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
  const driverName = firstSession?.driverName ?? "Unknown Driver";

  return (
    <div
      className="bg-card/20 backdrop-blur-lg rounded-lg border border-white/6 overflow-hidden shadow-none hover:shadow-sm transition-all duration-300 mb-6"
      role="region"
      aria-label={`Bundle of ${sessions.length} sessions`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Carousel */}
      <div className="relative">
        {/* Carousel Controls */}
        <div className="absolute top-1/2 left-2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            aria-label="Previous session"
            className={`p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm transition-all ${
              currentIndex === 0
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-black/70 hover:border-white/20"
            }`}
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="absolute top-1/2 right-2 z-20 -translate-y-1/2">
          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === sessions.length - 1}
            aria-label="Next session"
            className={`p-1.5 rounded-full bg-black/50 border border-white/10 backdrop-blur-sm transition-all ${
              currentIndex === sessions.length - 1
                ? "opacity-30 cursor-not-allowed"
                : "hover:bg-black/70 hover:border-white/20"
            }`}
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Current Session Card */}
        <div className="px-2 py-2">
          <Link to={`/sessions/${currentSession.id}`} className="block">
            <ActivityCard
              id={currentSession.id}
            userName={getActivityHeaderFromOwner(currentSession).name}
            userAvatar={getActivityHeaderFromOwner(currentSession).avatar}
              game="—"
              car={currentSession.car ?? "—"}
              vehicleDisplay={currentSession.vehicleDisplay}
              track={currentSession.track ?? "—"}
              position={currentSession.position ?? null}
              totalRacers={currentSession.totalDrivers ?? null}
              sessionType={currentSession.sessionType}
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
          </Link>
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
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === currentIndex
                  ? "bg-primary w-3"
                  : "bg-white/30 hover:bg-white/50"
              }`}
            />
          ))}
          {overflowCount > 0 && (
            <Link
              to={`/user/${driverName.toLowerCase().replace(/\s+/g, "-")}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-2 text-xs text-white/40 hover:text-white/60"
            >
              +{overflowCount}
            </Link>
          )}
        </div>

        {/* Slide indicator */}
        <div className="absolute bottom-10 right-4 text-xs text-white/40">
          {currentIndex + 1}/{sessions.length}
        </div>
      </div>
    </div>
  );
}
