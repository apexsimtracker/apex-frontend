import { describe, expect, it } from "vitest";
import { parseTrendInsight } from "./parseTrendInsight";

describe("parseTrendInsight", () => {
  it("splits stat lines from coaching takeaway", () => {
    const insight =
      "2 sessions this week vs 0 last. 11 laps this week vs 0 last. 15 min on track this week vs 0s last. You're putting in more seat time — keep the momentum.";

    expect(parseTrendInsight(insight)).toEqual({
      stats: [
        "2 sessions this week vs 0 last",
        "11 laps this week vs 0 last",
        "15 min on track this week vs 0s last",
      ],
      coaching: "You're putting in more seat time — keep the momentum.",
    });
  });

  it("handles sessions-only insight", () => {
    const insight =
      "1 sessions this week vs 2 last. Lighter week than last — sometimes rest is part of the plan.";

    expect(parseTrendInsight(insight)).toEqual({
      stats: ["1 sessions this week vs 2 last"],
      coaching: "Lighter week than last — sometimes rest is part of the plan.",
    });
  });

  it("falls back to coaching-only when no stat lines match", () => {
    const insight = "Custom insight without stat formatting.";

    expect(parseTrendInsight(insight)).toEqual({
      stats: [],
      coaching: "Custom insight without stat formatting.",
    });
  });
});
