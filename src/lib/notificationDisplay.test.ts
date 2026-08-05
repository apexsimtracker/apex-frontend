import { describe, expect, it } from "vitest";
import { socialNotificationLink } from "./notificationDisplay";

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
