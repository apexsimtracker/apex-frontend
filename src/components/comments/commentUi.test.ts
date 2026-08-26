import { describe, expect, it } from "vitest";
import {
  canEditThreadComment,
  canReplyToThreadComment,
  commentDeleteCountDelta,
  deletedCommentCopy,
  nextRepliesLabel,
} from "./commentUi";

const comment = {
  id: "comment-1",
  body: "Current",
  createdAt: new Date().toISOString(),
};

describe("comment UI rules", () => {
  it("disables editing after the one allowed edit", () => {
    expect(canEditThreadComment(comment, true)).toBe(true);
    expect(
      canEditThreadComment(
        { ...comment, editedAt: new Date().toISOString() },
        true,
      ),
    ).toBe(false);
  });

  it("blocks replies to deleted comments and signed-out visitors", () => {
    expect(canReplyToThreadComment(comment, true)).toBe(true);
    expect(canReplyToThreadComment(comment, false)).toBe(false);
    expect(
      canReplyToThreadComment(
        { ...comment, deletedAt: new Date().toISOString() },
        true,
      ),
    ).toBe(false);
  });

  it("renders an author-aware child tombstone", () => {
    expect(deletedCommentCopy(true, "Alex Driver")).toBe(
      "Alex Driver deleted a reply.",
    );
    expect(deletedCommentCopy(false, "Alex Driver")).toBe(
      "This comment was deleted.",
    );
  });

  it("labels five-more continuation and the final partial batch", () => {
    expect(nextRepliesLabel(false, 12, 1)).toBe("View 5 more replies");
    expect(nextRepliesLabel(false, 12, 11)).toBe("View 1 more reply");
    expect(nextRepliesLabel(true, 12, 1)).toBe("Loading replies…");
  });

  it("counts 1 + visible replies when a root thread is deleted", () => {
    expect(commentDeleteCountDelta(undefined)).toBe(1);
    expect(
      commentDeleteCountDelta({
        replyCount: 14,
        replies: [{ deletedAt: null }, { deletedAt: "x" }],
      }),
    ).toBe(1 + 1 + 12);
    expect(
      commentDeleteCountDelta({
        replyCount: 2,
        replies: [{ deletedAt: null }, { deletedAt: null }],
      }),
    ).toBe(3);
  });
});
