import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashboardActivityCard from "@/components/dashboard/DashboardActivityCard";
import { type SessionItem } from "@/lib/sessionTypes";

type ActivityOwner = {
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

function getActivityHeaderFromOwner(
  session: SessionItem,
  currentUser?: { id: string; avatarUrl?: string | null } | null,
): {
  name: string;
  avatar: string | null;
} {
  const owner = (session as unknown as { owner?: ActivityOwner }).owner;
  const sessionAny = session as SessionItem & {
    authorId?: string | null;
    authorName?: string | null;
    authorAvatarUrl?: string | null;
  };
  const sessionOwnerId =
    sessionAny.authorId ??
    (owner &&
    typeof owner === "object" &&
    "id" in owner &&
    typeof (owner as { id?: string | null }).id === "string"
      ? ((owner as { id?: string | null }).id as string)
      : null);
  const isCurrentUsersSession =
    Boolean(currentUser?.id) &&
    Boolean(sessionOwnerId) &&
    currentUser!.id === sessionOwnerId;
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
    isCurrentUsersSession && currentUserAvatar
      ? currentUserAvatar
      : sessionAny.authorAvatarUrl &&
          sessionAny.authorAvatarUrl.trim().length > 0
        ? sessionAny.authorAvatarUrl
        : owner?.avatarUrl && owner.avatarUrl.trim().length > 0
          ? owner.avatarUrl
          : null;
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
  currentUser?: { id: string; avatarUrl?: string | null } | null;
}

export default function BundledActivityCard({
  sessions,
  overflowCount,
  currentUser,
}: BundledActivityCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentSession = sessions[currentIndex];

  const handlePrev = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i > 0 ? i - 1 : i));
    },
    [],
  );

  const handleNext = useCallback(
    (e: React.MouseEvent | React.KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentIndex((i) => (i < sessions.length - 1 ? i + 1 : i));
    },
    [sessions.length],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowLeft") handlePrev(e);
      if (e.key === "ArrowRight") handleNext(e);
    },
    [handlePrev, handleNext],
  );

  const firstSession = sessions[0];
  const profileOwnerId = (() => {
    const s = firstSession as SessionItem & {
      authorId?: string | null;
      owner?: { id?: string | null };
    };
    if (typeof s.authorId === "string" && s.authorId.trim())
      return s.authorId.trim();
    const oid = s.owner && typeof s.owner === "object" ? s.owner.id : null;
    return typeof oid === "string" && oid.trim() ? oid.trim() : null;
  })();

  const currentHeader = getActivityHeaderFromOwner(
    currentSession,
    currentUser ?? null,
  );

  const sessionAny = currentSession as SessionItem & {
    carName?: string | null;
    trackName?: string | null;
    apexAnalysis?: { locked: false; insights: string[] } | null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-apex-outline-variant/10 bg-apex-surface-container-low"
      role="region"
      aria-label={`Bundle of ${sessions.length} sessions`}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="absolute left-2 top-1/2 z-20 -translate-y-1/2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          aria-label="Previous session"
          className={`rounded-full border border-apex-outline-variant/20 bg-apex-background/80 p-1.5 backdrop-blur-sm transition-all ${
            currentIndex === 0
              ? "cursor-not-allowed opacity-30"
              : "hover:border-apex-outline-variant/40 hover:bg-apex-background"
          }`}
        >
          <ChevronLeft className="size-4 text-apex-on-surface" />
        </button>
      </div>
      <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2">
        <button
          type="button"
          onClick={handleNext}
          disabled={currentIndex === sessions.length - 1}
          aria-label="Next session"
          className={`rounded-full border border-apex-outline-variant/20 bg-apex-background/80 p-1.5 backdrop-blur-sm transition-all ${
            currentIndex === sessions.length - 1
              ? "cursor-not-allowed opacity-30"
              : "hover:border-apex-outline-variant/40 hover:bg-apex-background"
          }`}
        >
          <ChevronRight className="size-4 text-apex-on-surface" />
        </button>
      </div>

      <div className="p-2">
        <DashboardActivityCard
          id={currentSession.id}
          profileUserId={profileOwnerId}
          userName={currentHeader.name}
          userAvatar={currentHeader.avatar}
          car={currentSession.car ?? "—"}
          vehicleDisplay={currentSession.vehicleDisplay}
          track={currentSession.track ?? "—"}
          trackName={sessionAny.trackName}
          position={currentSession.position ?? null}
          qualifyingPosition={currentSession.qualifyingPosition ?? null}
          totalRacers={currentSession.totalDrivers ?? null}
          sessionType={currentSession.sessionType}
          manualSessionKind={currentSession.manualSessionKind ?? null}
          sim={currentSession.sim}
          source={currentSession.source}
          bestLapMs={currentSession.bestLapMs}
          lapCount={currentSession.lapCount}
          timestamp={timeAgo(currentSession.createdAt)}
          apexAnalysis={sessionAny.apexAnalysis ?? null}
        />
      </div>

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
                ? "w-3 bg-apex-primary"
                : "bg-apex-on-surface-variant/40 hover:bg-apex-on-surface-variant/60"
            }`}
          />
        ))}
        {overflowCount > 0 &&
          (profileOwnerId ? (
            <Link
              to={`/user/${encodeURIComponent(profileOwnerId)}`}
              onClick={(e) => e.stopPropagation()}
              className="ml-2 text-xs text-apex-on-surface-variant hover:text-apex-on-surface"
            >
              +{overflowCount}
            </Link>
          ) : (
            <span className="ml-2 text-xs text-apex-on-surface-variant/60">
              +{overflowCount}
            </span>
          ))}
      </div>

      <div className="absolute bottom-10 right-4 text-xs text-apex-on-surface-variant/60">
        {currentIndex + 1}/{sessions.length}
      </div>
    </div>
  );
}
