import { describe, expect, it } from "vitest";
import {
  COMMENT_REPLIES_PAGE_SIZE,
  mergeCommentReplies,
  nextCommentRepliesOffset,
  preserveLoadedReplies,
} from "./replyPagination";

describe("replyPagination", () => {
  it("loads five replies at a time", () => {
    expect(COMMENT_REPLIES_PAGE_SIZE).toBe(5);
  });

  it("continues from the exact number of loaded replies", () => {
    expect(nextCommentRepliesOffset(1)).toBe(1);
    expect(nextCommentRepliesOffset(6)).toBe(6);
    expect(nextCommentRepliesOffset(51)).toBe(51);
  });

  it("appends unique replies in order", () => {
    const merged = mergeCommentReplies(
      [{ id: "a" }, { id: "b" }],
      [{ id: "b" }, { id: "c" }],
    );
    expect(merged.map((row) => row.id)).toEqual(["a", "b", "c"]);
  });

  it("preserves replies loaded across repeated five-more requests on refetch", () => {
    const cachedReplies = Array.from({ length: 16 }, (_, index) => ({
      id: `reply-${index}`,
    }));
    const roots = preserveLoadedReplies(
      [
        {
          id: "root",
          replies: [{ id: "reply-0" }],
          replyCount: 21,
          hasMoreReplies: true,
        },
      ],
      [
        {
          id: "root",
          replies: cachedReplies,
          replyCount: 21,
          hasMoreReplies: true,
        },
      ],
    );

    expect(roots[0].replies).toHaveLength(16);
    expect(roots[0].hasMoreReplies).toBe(true);
  });

  it("takes fresh matching rows and drops optimistic placeholders", () => {
    const roots = preserveLoadedReplies(
      [
        {
          id: "root",
          body: "Root",
          replies: [{ id: "reply-1", body: "Fresh" }],
          replyCount: 2,
        },
      ],
      [
        {
          id: "root",
          body: "Root",
          replies: [
            { id: "temp-1", body: "Pending" },
            { id: "reply-1", body: "Cached" },
            { id: "reply-2", body: "Older" },
          ],
          replyCount: 2,
        },
      ],
    );

    expect(roots[0].replies).toEqual([
      { id: "reply-1", body: "Fresh" },
      { id: "reply-2", body: "Older" },
    ]);
    expect(roots[0].hasMoreReplies).toBe(false);
  });
});
