import { describe, expect, it } from "vitest";
import {
  buildCanonicalUrl,
  buildPageTitle,
  clampMetaDescription,
  robotsNoindex,
} from "./seo";

describe("seo helpers", () => {
  it("buildPageTitle appends brand and respects max length", () => {
    expect(buildPageTitle("Leaderboards")).toBe("Leaderboards | Apex");
    const long = buildPageTitle("A".repeat(80));
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith("| Apex")).toBe(true);
  });

  it("clampMetaDescription truncates with ellipsis", () => {
    const long = "word ".repeat(40).trim();
    const out = clampMetaDescription(long, 80);
    expect(out.length).toBeLessThanOrEqual(80);
    expect(out.endsWith("…")).toBe(true);
  });

  it("buildCanonicalUrl normalizes paths", () => {
    expect(buildCanonicalUrl("/community")).toBe(
      "https://apexsimtracker.com/community",
    );
    expect(buildCanonicalUrl("/")).toBe("https://apexsimtracker.com/");
  });

  it("robotsNoindex respects nofollow flag", () => {
    expect(robotsNoindex()).toBe("noindex, nofollow");
    expect(robotsNoindex(false)).toBe("noindex, follow");
  });
});
