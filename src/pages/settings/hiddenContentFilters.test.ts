import { describe, expect, it } from "vitest";
import { appDropdownContentClassName } from "@/components/app-ui/appButtonClasses";
import { cn } from "@/lib/utils";
import { HIDDEN_CONTENT_FILTERS } from "./hiddenContentFilters";

describe("moderation UI configuration", () => {
  it("renders the session-comment hidden-content filter", () => {
    expect(HIDDEN_CONTENT_FILTERS).toContainEqual({
      value: "SESSION_COMMENT",
      label: "Session comments",
    });
  });

  it("keeps portaled action menus above application modals", () => {
    const merged = cn("z-50", appDropdownContentClassName);
    expect(merged).toContain("z-[100]");
    expect(merged).not.toContain("z-50");
  });
});
