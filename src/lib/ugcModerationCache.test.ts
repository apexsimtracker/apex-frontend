import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import {
  applyOptimisticBlock,
  applyOptimisticHide,
  rollbackUgcModerationCache,
  snapshotUgcModerationCache,
} from "./ugcModerationCache";

describe("ugc moderation cache helpers", () => {
  it("removes hidden discussion comments and nested replies", () => {
    const queryClient = new QueryClient();
    const key = ["discussion", "comments", "discussion-1", 1, "desc"];
    queryClient.setQueryData(key, {
      items: [
        {
          id: "root",
          author: { id: "user-1" },
          replies: [{ id: "reply", author: { id: "user-2" } }],
          replyCount: 1,
        },
      ],
      total: 1,
    });

    applyOptimisticHide(queryClient, "DISCUSSION_COMMENT", "reply");

    expect(queryClient.getQueryData(key)).toMatchObject({
      items: [{ id: "root", replies: [], replyCount: 0 }],
      total: 1,
    });
  });

  it("removes a blocked author from comment caches and masks their profile", () => {
    const queryClient = new QueryClient();
    const commentsKey = [
      "sessions",
      "session-1",
      "modal-comments",
      1,
      5,
      "all",
      "",
    ];
    queryClient.setQueryData(commentsKey, {
      comments: [
        { id: "blocked", userId: "user-1", replies: [] },
        { id: "kept", userId: "user-2", replies: [] },
      ],
      total: 2,
    });
    queryClient.setQueryData(["profile", "publicPreview", "user-1"], {
      id: "user-1",
      avatarUrl: "/avatar.png",
      bio: "Public bio",
      viewerHasAccess: true,
      blockedByMe: false,
    });

    applyOptimisticBlock(queryClient, "user-1");

    expect(queryClient.getQueryData(commentsKey)).toMatchObject({
      comments: [{ id: "kept" }],
      total: 1,
    });
    expect(
      queryClient.getQueryData(["profile", "publicPreview", "user-1"]),
    ).toMatchObject({
      avatarUrl: null,
      bio: null,
      viewerHasAccess: false,
      blockedByMe: true,
    });
  });

  it("restores snapshotted moderation data after a failed mutation", async () => {
    const queryClient = new QueryClient();
    const key = ["discussion", "comments", "discussion-1", 1, "desc"];
    const original = {
      items: [{ id: "comment-1", author: { id: "user-1" } }],
      total: 1,
    };
    queryClient.setQueryData(key, original);

    const snapshot = await snapshotUgcModerationCache(queryClient);
    applyOptimisticHide(queryClient, "DISCUSSION_COMMENT", "comment-1");
    rollbackUgcModerationCache(queryClient, snapshot);

    expect(queryClient.getQueryData(key)).toEqual(original);
  });
});
