import { describe, expect, it } from "vitest";
import { commentModerationTargets } from "./commentModerationTargets";

describe("commentModerationTargets", () => {
  it.each([
    ["discussion", "DISCUSSION_COMMENT"],
    ["session", "SESSION_COMMENT"],
  ] as const)(
    "builds an explicit %s comment report target",
    (variant, contentType) => {
      expect(
        commentModerationTargets({
          variant,
          commentId: "reply-42",
          authorId: "author-7",
          deleted: false,
        }),
      ).toEqual({
        hide: {
          contentType,
          targetContentId: "reply-42",
        },
        report: {
          contentType,
          targetContentId: "reply-42",
          targetUserId: "author-7",
        },
      });
    },
  );

  it("omits moderation actions for a deleted comment", () => {
    expect(
      commentModerationTargets({
        variant: "session",
        commentId: "deleted-1",
        authorId: "author-1",
        deleted: true,
      }),
    ).toEqual({});
  });
});
