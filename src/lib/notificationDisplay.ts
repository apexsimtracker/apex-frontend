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

export function socialNotificationLabel(type: NotificationItem["type"]): string {
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

export function socialNotificationLink(
  type: NotificationItem["type"],
  entityId: string | null,
): string | null {
  if (!entityId) return null;
  if (type === "SESSION_LIKE" || type === "SESSION_COMMENT" || type === "COMMENT") {
    return `/v2/session/${entityId}`;
  }
  if (type === "REPLY") {
    return `/v2/community/discussions/${entityId}`;
  }
  return null;
}
