import { describe, expect, it } from "vitest";
import { parseApexAnalysisDisplay } from "./apexAnalysisDisplay";

describe("parseApexAnalysisDisplay", () => {
  it("reads insights from PRO gated object", () => {
    const result = parseApexAnalysisDisplay({
      locked: false,
      insights: ["Strong stint pace.", "Lap-time variance: 0.3s."],
    });
    expect(result.locked).toBe(false);
    expect(result.insights).toEqual([
      "Strong stint pace.",
      "Lap-time variance: 0.3s.",
    ]);
  });

  it("returns empty insights when payload is null", () => {
    expect(parseApexAnalysisDisplay(null).insights).toEqual([]);
  });

  it("reads FREE locked payload", () => {
    const result = parseApexAnalysisDisplay({
      locked: true,
      message: "Unlock Apex Analysis with Apex Pro",
    });
    expect(result.locked).toBe(true);
    expect(result.insights).toEqual([]);
  });
});
