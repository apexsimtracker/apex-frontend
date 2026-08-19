import { describe, expect, it } from "vitest";
import { notificationAge, socialNotificationLink } from "./notificationDisplay";

describe("socialNotificationLink", () => {
  it("links session likes/comments to plural /sessions/:id", () => {
    expect(socialNotificationLink("SESSION_LIKE", "abc")).toBe("/sessions/abc");
    expect(socialNotificationLink("SESSION_COMMENT", "abc")).toBe(
      "/sessions/abc",
    );
    expect(socialNotificationLink("COMMENT", "abc")).toBe("/sessions/abc");
  });

  it("links replies to discussion detail", () => {
    expect(socialNotificationLink("REPLY", "disc-1")).toBe(
      "/discussion/disc-1",
    );
  });

  it("returns null without entityId", () => {
    expect(socialNotificationLink("SESSION_LIKE", null)).toBeNull();
  });
});

describe("notificationAge", () => {
  const now = new Date("2026-08-19T12:00:00.000Z").getTime();
  const ago = (ms: number) => new Date(now - ms).toISOString();

  it("collapses recent timestamps to a short age", () => {
    expect(notificationAge(ago(5_000), now)).toBe("just now");
    expect(notificationAge(ago(4 * 60_000), now)).toBe("4m");
    expect(notificationAge(ago(3 * 3_600_000), now)).toBe("3h");
    expect(notificationAge(ago(2 * 86_400_000), now)).toBe("2d");
  });

  it("falls back to a calendar date past a week", () => {
    const iso = ago(30 * 86_400_000);
    expect(notificationAge(iso, now)).toBe(
      new Date(iso).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
      }),
    );
  });

  it("returns an empty string for an unparseable date", () => {
    expect(notificationAge("not-a-date", now)).toBe("");
  });
});
