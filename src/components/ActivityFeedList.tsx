import { Link } from "react-router-dom";
import ActivityCard, { type SessionPatch } from "@/components/ActivityCard";
import WeekendGroupHeader from "@/components/WeekendGroupHeader";
import {
  groupSessionsByWeekend,
  getWeekendFeedItemKey,
} from "@/lib/groupSessionsByWeekend";
import type { SessionItem } from "@/lib/groupSessions";

type ActivityOwner = {
  id?: string | null;
  displayName?: string | null;
  username?: string | null;
  avatarUrl?: string | null;
};

export type ActivityFeedSession = SessionItem & {
  authorId?: string | null;
  authorName?: string | null;
  authorAvatarUrl?: string | null;
  owner?: ActivityOwner;
  carName?: string | null;
};

function timeAgo(createdAt: string | Date): string {
  const date = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  if (sec < 2592000) return `${Math.floor(sec / 86400)}d ago`;
  return date.toLocaleDateString();
}

function getProfileOwnerId(session: ActivityFeedSession): string | null {
  if (typeof session.authorId === "string" && session.authorId.trim()) {
    return session.authorId.trim();
  }
  const oid = session.owner?.id;
  return typeof oid === "string" && oid.trim() ? oid.trim() : null;
}

function getActivityHeaderFromOwner(
  session: ActivityFeedSession,
  currentUser?: { id: string; avatarUrl?: string | null } | null
): { name: string; avatar: string | null } {
  const sessionOwnerId = getProfileOwnerId(session);
  const isCurrentUsersSession =
    Boolean(currentUser?.id) && Boolean(sessionOwnerId) && currentUser!.id === sessionOwnerId;
  const name =
    session.authorName?.trim() ||
    session.owner?.displayName?.trim() ||
    session.owner?.username?.trim() ||
    session.driverName ||
    "—";
  const currentUserAvatar =
    currentUser?.avatarUrl && currentUser.avatarUrl.trim().length > 0
      ? currentUser.avatarUrl
      : null;
  const avatar =
    isCurrentUsersSession && currentUserAvatar
      ? currentUserAvatar
      : session.authorAvatarUrl && session.authorAvatarUrl.trim().length > 0
        ? session.authorAvatarUrl
        : session.owner?.avatarUrl && session.owner.avatarUrl.trim().length > 0
          ? session.owner.avatarUrl
          : null;
  return { name, avatar };
}

function renderActivityCard(
  session: ActivityFeedSession,
  options: {
    onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
    linkCards: boolean;
    currentUser?: { id: string; avatarUrl?: string | null } | null;
  }
) {
  const header = getActivityHeaderFromOwner(session, options.currentUser);
  const profileOwnerId = getProfileOwnerId(session);

  const card = (
    <ActivityCard
      id={session.id}
      profileUserId={profileOwnerId}
      userName={header.name}
      userAvatar={header.avatar}
      game="—"
      car={session.car ?? "—"}
      vehicleDisplay={
        session.vehicleDisplay ??
        (typeof session.carName === "string" ? session.carName : undefined)
      }
      source={
        session.source ??
        (session.sessionType === "MANUAL_ACTIVITY" ? "manual" : "telemetry")
      }
      track={session.track ?? "—"}
      position={session.position ?? null}
      qualifyingPosition={session.qualifyingPosition ?? null}
      totalRacers={session.totalDrivers ?? null}
      sessionType={session.sessionType}
      manualSessionKind={session.manualSessionKind ?? null}
      sim={session.sim}
      bestLapMs={session.bestLapMs}
      lapCount={session.lapCount}
      consistencyScore={session.consistencyScore}
      likeCount={session.likeCount ?? 0}
      commentCount={session.commentCount ?? 0}
      likedByMe={session.likedByMe ?? false}
      score={0}
      timestamp={timeAgo(session.createdAt)}
      likes={session.likeCount ?? 0}
      comments={session.commentCount ?? 0}
      onSessionPatch={options.onSessionPatch}
    />
  );

  if (options.linkCards) {
    return (
      <Link to={`/sessions/${session.id}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}

export type ActivityFeedListProps = {
  sessions: ActivityFeedSession[];
  onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
  /** When true, wrap each card in a Link to session detail (Sessions page). */
  linkCards?: boolean;
  currentUser?: { id: string; avatarUrl?: string | null } | null;
};

export default function ActivityFeedList({
  sessions,
  onSessionPatch,
  linkCards = false,
  currentUser,
}: ActivityFeedListProps) {
  // Weekend groups are computed on loaded sessions only (infinite-query pages). A weekend
  // split across "Load more" may show incomplete headers until the next page is fetched.
  const items = groupSessionsByWeekend(sessions);

  return (
    <>
      {items.map((item) => {
        if (item.type === "standalone") {
          return (
            <div key={getWeekendFeedItemKey(item)}>
              {renderActivityCard(item.session as ActivityFeedSession, {
                onSessionPatch,
                linkCards,
                currentUser,
              })}
            </div>
          );
        }

        return (
          <div key={getWeekendFeedItemKey(item)} className="mb-2">
            <WeekendGroupHeader group={item.group} />
            {item.group.sessions.map((session) => (
              <div key={session.id}>
                {renderActivityCard(session as ActivityFeedSession, {
                  onSessionPatch,
                  linkCards,
                  currentUser,
                })}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}
