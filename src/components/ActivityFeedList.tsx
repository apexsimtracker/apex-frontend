import { Link } from "react-router-dom";
import ActivityCard, { type SessionPatch } from "@/components/ActivityCard";
import BundledActivityCard from "@/components/BundledActivityCard";
import WeekendGroupHeader from "@/components/WeekendGroupHeader";
import type { ActivityFeedItem } from "@/lib/api/activityBilling";
import type { SessionItem } from "@/lib/groupSessions";
import { segmentWeekendSessionsForDisplay } from "@/lib/weekendDisplaySegments";

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

function getActivityFeedItemKey(item: ActivityFeedItem): string {
  if (item.type === "standalone") {
    const session = item.session as { id?: string };
    return `standalone-${session.id ?? "unknown"}`;
  }
  const g = item.group;
  return `weekend-${g.authorId}-${g.trackKey}-${g.lastSessionAt}`;
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
  /** Server-grouped feed items (weekend groups + standalone sessions). */
  items: ActivityFeedItem[];
  onSessionPatch?: (sessionId: string, patch: SessionPatch) => void;
  /** When true, wrap each card in a Link to session detail (Sessions page). */
  linkCards?: boolean;
  currentUser?: { id: string; avatarUrl?: string | null } | null;
};

export default function ActivityFeedList({
  items,
  onSessionPatch,
  linkCards = false,
  currentUser,
}: ActivityFeedListProps) {
  return (
    <div className="flex flex-col gap-6 [&_.mb-6]:mb-0">
      {items.map((item) => {
        if (item.type === "standalone") {
          return (
            <div key={getActivityFeedItemKey(item)}>
              {renderActivityCard(item.session as ActivityFeedSession, {
                onSessionPatch,
                linkCards,
                currentUser,
              })}
            </div>
          );
        }

        return (
          <div
            key={getActivityFeedItemKey(item)}
            className="overflow-hidden rounded-lg border border-white/[0.07]"
          >
            <WeekendGroupHeader
              group={item.group}
              className="mb-0 rounded-none border-0 border-b border-white/8 bg-transparent"
            />
            <div className="flex flex-col gap-6 p-3 sm:p-4">
              {segmentWeekendSessionsForDisplay(item.group.sessions as SessionItem[]).map(
                (segment) => {
                  if (segment.type === "single") {
                    const s = segment.session as ActivityFeedSession;
                    return (
                      <div key={s.id}>
                        {renderActivityCard(s, {
                          onSessionPatch,
                          linkCards,
                          currentUser,
                        })}
                      </div>
                    );
                  }

                  const carouselKey = `${segment.kind}-${segment.sessions.map((s) => s.id).join("-")}`;
                  return (
                    <BundledActivityCard
                      key={carouselKey}
                      sessions={segment.sessions}
                      overflowCount={0}
                      onSessionPatch={onSessionPatch}
                    />
                  );
                }
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
