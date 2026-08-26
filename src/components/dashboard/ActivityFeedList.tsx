import { lazy, Suspense, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import DashboardActivityCard from "@/components/dashboard/DashboardActivityCard";
import BundledActivityCard from "@/components/dashboard/BundledActivityCard";
import WeekendGroupHeader from "@/components/WeekendGroupHeader";
import { SessionCommentsModal } from "@/pages/session/SessionCommentsModal";
import type { ActivityFeedItem } from "@/lib/api/activityBilling";
import type { SessionItem } from "@/lib/sessionTypes";
import { segmentWeekendSessionsForDisplay } from "@/lib/weekendDisplaySegments";
import { bumpSessionCommentCountInCaches } from "@/lib/sessionSocialCache";
import { sessionDetailQueryKey } from "@/lib/sessions/sessionDetailPrefetch";
import { publicSessionUrl } from "@/lib/siteMeta";
import { buildSessionShareText } from "@/lib/sessionShareText";

const SessionShareModal = lazy(() =>
  import(
    /* webpackChunkName: "session-share" */ "@/components/SessionShareModal"
  ),
);

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
  trackName?: string | null;
  apexAnalysis?: { locked: false; insights: string[] } | null;
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
  currentUser?: { id: string; avatarUrl?: string | null } | null,
): { name: string; avatar: string | null } {
  const sessionOwnerId = getProfileOwnerId(session);
  const isCurrentUsersSession =
    Boolean(currentUser?.id) &&
    Boolean(sessionOwnerId) &&
    currentUser!.id === sessionOwnerId;
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
    currentUser?: { id: string; avatarUrl?: string | null } | null;
    onComment: (session: ActivityFeedSession) => void;
    onShare: (session: ActivityFeedSession) => void;
  },
) {
  const header = getActivityHeaderFromOwner(session, options.currentUser);
  const profileOwnerId = getProfileOwnerId(session);
  const isCurrentUsersSession =
    Boolean(options.currentUser?.id) &&
    Boolean(profileOwnerId) &&
    options.currentUser!.id === profileOwnerId;

  return (
    <DashboardActivityCard
      id={session.id}
      profileUserId={profileOwnerId}
      userName={header.name}
      userAvatar={header.avatar}
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
      trackName={session.trackName}
      position={session.position ?? null}
      qualifyingPosition={session.qualifyingPosition ?? null}
      totalRacers={session.totalDrivers ?? null}
      sessionType={session.sessionType}
      manualSessionKind={session.manualSessionKind ?? null}
      sim={session.sim}
      bestLapMs={session.bestLapMs}
      lapCount={session.lapCount}
      timestamp={timeAgo(session.createdAt)}
      apexAnalysis={
        isCurrentUsersSession ? (session.apexAnalysis ?? null) : null
      }
      caption={session.caption ?? null}
      likeCount={session.likeCount ?? 0}
      commentCount={session.commentCount ?? 0}
      likedByMe={Boolean(session.likedByMe)}
      onComment={() => options.onComment(session)}
      onShare={() => options.onShare(session)}
    />
  );
}

export type ActivityFeedListProps = {
  items: ActivityFeedItem[];
  currentUser?: { id: string; avatarUrl?: string | null } | null;
};

export default function ActivityFeedList({
  items,
  currentUser,
}: ActivityFeedListProps) {
  const queryClient = useQueryClient();
  const [commentsSessionId, setCommentsSessionId] = useState<string | null>(
    null,
  );
  const [shareSession, setShareSession] = useState<ActivityFeedSession | null>(
    null,
  );

  const openComments = useCallback((session: ActivityFeedSession) => {
    setCommentsSessionId(session.id);
  }, []);

  const openShare = useCallback((session: ActivityFeedSession) => {
    setShareSession(session);
  }, []);

  const cardOptions = {
    currentUser,
    onComment: openComments,
    onShare: openShare,
  };

  return (
    <>
      <div className="flex flex-col gap-5">
        {items.map((item) => {
          if (item.type === "standalone") {
            const session = item.session as ActivityFeedSession;
            return (
              <div key={getActivityFeedItemKey(item)}>
                {renderActivityCard(session, cardOptions)}
              </div>
            );
          }

          return (
            <div
              key={getActivityFeedItemKey(item)}
              className="overflow-hidden rounded-2xl border-2 border-apex-outline-variant/25 bg-apex-surface-container-low/40"
            >
              <WeekendGroupHeader
                group={item.group}
                className="mb-0 rounded-none border-0 border-b border-apex-outline-variant/20 bg-apex-surface-container-low/60"
              />
              <div className="flex flex-col gap-6 p-4 sm:p-5">
                {segmentWeekendSessionsForDisplay(
                  item.group.sessions as SessionItem[],
                ).map((segment) => {
                  if (segment.type === "single") {
                    const s = segment.session as ActivityFeedSession;
                    return (
                      <div key={s.id}>
                        {renderActivityCard(s, cardOptions)}
                      </div>
                    );
                  }

                  const carouselKey = `${segment.kind}-${segment.sessions.map((s) => s.id).join("-")}`;
                  return (
                    <BundledActivityCard
                      key={carouselKey}
                      sessions={segment.sessions}
                      overflowCount={0}
                      currentUser={currentUser}
                      onComment={(session) =>
                        openComments(session as ActivityFeedSession)
                      }
                      onShare={(session) =>
                        openShare(session as ActivityFeedSession)
                      }
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <SessionCommentsModal
        sessionId={commentsSessionId ?? ""}
        isOpen={Boolean(commentsSessionId)}
        onClose={() => setCommentsSessionId(null)}
        onCommentAdded={() => {
          if (!commentsSessionId) return;
          bumpSessionCommentCountInCaches(queryClient, commentsSessionId, 1);
        }}
        onCommentDeleted={(countDelta) => {
          if (!commentsSessionId) return;
          bumpSessionCommentCountInCaches(
            queryClient,
            commentsSessionId,
            -countDelta,
          );
        }}
        onRefreshSession={() => {
          if (!commentsSessionId) return;
          void queryClient.invalidateQueries({
            queryKey: sessionDetailQueryKey(commentsSessionId),
          });
        }}
      />

      {shareSession ? (
        <Suspense fallback={null}>
          <SessionShareModal
            open
            onOpenChange={(open) => {
              if (!open) setShareSession(null);
            }}
            shareUrl={publicSessionUrl(shareSession.id)}
            shareText={buildSessionShareText(shareSession)}
          />
        </Suspense>
      ) : null}
    </>
  );
}
