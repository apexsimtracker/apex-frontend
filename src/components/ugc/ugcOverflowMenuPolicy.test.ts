import { describe, expect, it } from "vitest";
import { getUgcOverflowMenuPolicy } from "./ugcOverflowMenuPolicy";

describe("getUgcOverflowMenuPolicy", () => {
  it("enables actions from target presence alone", () => {
    expect(
      getUgcOverflowMenuPolicy({
        signedIn: true,
        isOwn: false,
        hideTargetContentId: "content-1",
        authorId: "author-1",
        showBlock: true,
        reportEnabled: true,
        reportContentType: "SESSION",
        reportTargetContentId: "content-1",
        reportTargetUserId: "author-1",
      }),
    ).toEqual({
      canHide: true,
      canBlock: true,
      canReport: true,
      canRender: true,
    });
  });

  it("respects ownership, authentication, and explicit action settings", () => {
    expect(
      getUgcOverflowMenuPolicy({
        signedIn: true,
        isOwn: true,
        authorId: "author-1",
        showBlock: false,
        reportEnabled: false,
        reportContentType: "USER",
        reportTargetUserId: "author-1",
      }),
    ).toEqual({
      canHide: false,
      canBlock: false,
      canReport: false,
      canRender: false,
    });
  });
});
