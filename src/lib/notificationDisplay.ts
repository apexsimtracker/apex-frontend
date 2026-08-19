import type { NotificationItem } from "@/lib/api";

export const RICH_NOTIFICATION_TYPES = new Set<NotificationItem["type"]>([
  "SYSTEM_ANNOUNCEMENT",
  "CHALLENGE_STARTED",
  "CHALLENGE_ENDED",
  "CHALLENGE_WON",
  "CHALLENGE_BANNED",
  "CHALLENGE_REMOVED",
  "SUBSCRIPTION_ACTIVATED",
  "SUBSCRIPTION_CANCELLED",
  "SUBSCRIPTION_EXPIRED",
  "ACCOUNT_SUSPENDED",
]);

export function isRichNotification(notification: NotificationItem): boolean {
  return RICH_NOTIFICATION_TYPES.has(notification.type);
}

export function socialNotificationLabel(
  type: NotificationItem["type"],
): string {
  switch (type) {
    case "FOLLOW":
      return "started following you.";
    case "FOLLOW_REQUEST":
      return "requested to follow you.";
    case "FOLLOW_REQUEST_ACCEPTED":
      return "approved your follow request.";
    case "FOLLOW_REQUEST_DECLINED":
      return "declined your follow request.";
    case "REPLY":
      return "replied.";
    case "COMMENT":
    case "SESSION_COMMENT":
      return "commented on your session.";
    case "SESSION_LIKE":
      return "liked your session.";
    default:
      return "interacted with your activity.";
  }
}

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

/**
 * Short age for a notification row, e.g. "just now", "4h", "3d". Full
 * timestamps wrap onto a second line on phones and cost more room than they
 * are worth in a scannable list; the exact time stays in the `title`.
 */
export function notificationAge(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const elapsed = now - then;
  if (elapsed < MINUTE_MS) return "just now";
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)}m`;
  if (elapsed < DAY_MS) return `${Math.floor(elapsed / HOUR_MS)}h`;
  if (elapsed < WEEK_MS) return `${Math.floor(elapsed / DAY_MS)}d`;
  return new Date(then).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function socialNotificationLink(
  type: NotificationItem["type"],
  entityId: string | null,
): string | null {
  if (!entityId) return null;
  if (
    type === "SESSION_LIKE" ||
    type === "SESSION_COMMENT" ||
    type === "COMMENT"
  ) {
    return `/sessions/${entityId}`;
  }
  if (type === "REPLY") {
    return `/discussion/${entityId}`;
  }
  return null;
}
