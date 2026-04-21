import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  acceptFollowRequest,
  ApiError,
  clearNotifications,
  declineFollowRequest,
  getNotifications,
  listFollowRequests,
  markNotificationsRead,
  resolveApiUrl,
  type NotificationItem,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const NOTIFICATIONS_KEY = ["notifications"] as const;
const FOLLOW_REQUESTS_KEY = ["followRequests", "incoming"] as const;

export function NotificationsBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"activity" | "requests">("activity");
  const [actionId, setActionId] = useState<string | null>(null);
  const [markingViewed, setMarkingViewed] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    const openHandler = () => {
      setTab("requests");
      setOpen(true);
    };
    window.addEventListener("apex:open-notifications", openHandler);
    return () => window.removeEventListener("apex:open-notifications", openHandler);
  }, []);

  const notifQuery = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: getNotifications,
    staleTime: 15_000,
  });

  const requestsQuery = useQuery({
    queryKey: FOLLOW_REQUESTS_KEY,
    queryFn: listFollowRequests,
    enabled: open,
    staleTime: 15_000,
  });

  const notifications = notifQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const showBadge =
    user?.showNotificationBadge !== false && unreadCount > 0;

  const onOpenChange = useCallback((next: boolean) => {
    setOpen(next);
  }, []);

  const handleMarkAllViewed = useCallback(async () => {
    setMarkingViewed(true);
    try {
      await markNotificationsRead();
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      toast.success("Marked all notifications as viewed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update notifications.");
    } finally {
      setMarkingViewed(false);
    }
  }, [queryClient]);

  const handleClearAll = useCallback(async () => {
    setClearing(true);
    try {
      const { deleted } = await clearNotifications();
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      toast.success(
        deleted === 0 ? "No notifications to clear." : `Cleared ${deleted} notification${deleted === 1 ? "" : "s"}.`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not clear notifications.");
    } finally {
      setClearing(false);
    }
  }, [queryClient]);

  const handleAccept = async (requestId: string) => {
    setActionId(requestId);
    try {
      await acceptFollowRequest(requestId);
      await queryClient.invalidateQueries({ queryKey: FOLLOW_REQUESTS_KEY });
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
      await queryClient.invalidateQueries({ queryKey: ["profile", "followList"] });
      await queryClient.invalidateQueries({ queryKey: ["userProfile"] });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not approve request.";
      toast.error(msg);
      void queryClient.invalidateQueries({ queryKey: FOLLOW_REQUESTS_KEY });
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    } finally {
      setActionId(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionId(requestId);
    try {
      await declineFollowRequest(requestId);
      await queryClient.invalidateQueries({ queryKey: FOLLOW_REQUESTS_KEY });
      await queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Could not decline request.";
      toast.error(msg);
      void queryClient.invalidateQueries({ queryKey: FOLLOW_REQUESTS_KEY });
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });
    } finally {
      setActionId(null);
    }
  };

  const footerBusy = markingViewed || clearing;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative rounded-lg p-2 transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
        aria-label="Notifications"
        title="Notifications"
      >
        <Bell className="size-5 text-foreground/70 transition-colors hover:text-foreground" />
        {showBadge ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold leading-none text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[85vh] max-w-lg flex-col gap-0 overflow-hidden border-white/10 bg-card p-0">
          <DialogHeader className="shrink-0 border-b border-white/10 px-6 py-4">
            <DialogTitle>Notifications</DialogTitle>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("activity")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "activity"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Activity
              </button>
              <button
                type="button"
                onClick={() => setTab("requests")}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  tab === "requests"
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Follow requests
                {(requestsQuery.data?.requests.length ?? 0) > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                    {requestsQuery.data?.requests.length}
                  </span>
                )}
              </button>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
            {tab === "activity" ? (
              <NotificationList
                notifications={notifications}
                loading={notifQuery.isPending}
                actionId={actionId}
                onAcceptRequest={handleAccept}
                onDeclineRequest={handleDecline}
              />
            ) : (
              <FollowRequestsPanel
                loading={requestsQuery.isPending}
                requests={requestsQuery.data?.requests ?? []}
                actionId={actionId}
                onAccept={handleAccept}
                onDecline={handleDecline}
              />
            )}
          </div>

          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-white/10 bg-card/95 px-6 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={footerBusy || notifications.length === 0}
              onClick={() => void handleMarkAllViewed()}
            >
              {markingViewed ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Mark all as viewed
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="text-destructive hover:bg-destructive/15 hover:text-destructive"
              disabled={footerBusy || notifications.length === 0}
              onClick={() => void handleClearAll()}
            >
              {clearing ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Clear notifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function NotificationList({
  notifications,
  loading,
  actionId,
  onAcceptRequest,
  onDeclineRequest,
}: {
  notifications: NotificationItem[];
  loading: boolean;
  actionId: string | null;
  onAcceptRequest: (requestId: string) => void;
  onDeclineRequest: (requestId: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (notifications.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">No notifications yet.</p>
    );
  }
  return (
    <ul className="space-y-3">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={cn(
            "flex gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3",
            !n.read && "border-primary/20"
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">{n.actor.displayName}</span>{" "}
              {n.type === "FOLLOW" && "started following you."}
              {n.type === "FOLLOW_REQUEST" && "requested to follow you."}
              {n.type === "FOLLOW_REQUEST_ACCEPTED" && "approved your follow request."}
              {n.type === "REPLY" && "replied."}
              {n.type === "COMMENT" && "commented."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(n.createdAt).toLocaleString()}
            </p>
            {n.type === "FOLLOW_REQUEST" && n.entityId ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="gap-1"
                  disabled={actionId === n.entityId}
                  onClick={() => onAcceptRequest(n.entityId!)}
                >
                  {actionId === n.entityId ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Check className="size-3.5" />
                  )}
                  Approve
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={actionId === n.entityId}
                  onClick={() => onDeclineRequest(n.entityId!)}
                >
                  <X className="size-3.5" />
                  Decline
                </Button>
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

function FollowRequestsPanel({
  loading,
  requests,
  actionId,
  onAccept,
  onDecline,
}: {
  loading: boolean;
  requests: {
    id: string;
    createdAt: string;
    follower: { id: string; displayName: string; avatarUrl: string | null };
  }[];
  actionId: string | null;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (requests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No pending follow requests.
      </p>
    );
  }
  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const avatar = resolveApiUrl(r.follower.avatarUrl);
        const busy = actionId === r.id;
        return (
          <li
            key={r.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
          >
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="size-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
              />
            ) : (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                {(r.follower.displayName ?? "?").slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">{r.follower.displayName}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                className="gap-1"
                disabled={busy}
                onClick={() => void onAccept(r.id)}
              >
                {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1"
                disabled={busy}
                onClick={() => void onDecline(r.id)}
              >
                <X className="size-3.5" />
                Decline
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
