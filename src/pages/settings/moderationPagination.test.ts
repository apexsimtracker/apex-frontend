import { describe, expect, it } from "vitest";
import {
  clampModerationPage,
  pageAfterRemovingItem,
} from "./moderationPagination";

describe("moderation settings pagination", () => {
  it("clamps a stale page after an external row change", () => {
    expect(clampModerationPage(4, 2)).toBe(2);
    expect(clampModerationPage(2, 0)).toBe(1);
  });

  it("moves back after removing the only row on a later page", () => {
    expect(pageAfterRemovingItem(3, 1)).toBe(2);
    expect(pageAfterRemovingItem(3, 2)).toBe(3);
    expect(pageAfterRemovingItem(1, 1)).toBe(1);
  });
});
