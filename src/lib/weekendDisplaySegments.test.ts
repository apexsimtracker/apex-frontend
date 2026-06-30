import { describe, it, expect } from "vitest";
import { segmentWeekendSessionsForDisplay } from "./weekendDisplaySegments";
import type { SessionItem } from "./sessionTypes";

function session(
  id: string,
  overrides: Partial<SessionItem> = {},
): SessionItem {
  return {
    id,
    driverName: "Driver",
    track: "spa",
    car: "Ferrari",
    position: null,
    totalDrivers: null,
    createdAt: "2024-06-01T12:00:00Z",
    ...overrides,
  };
}

describe("segmentWeekendSessionsForDisplay", () => {
  it("returns empty array for no sessions", () => {
    expect(segmentWeekendSessionsForDisplay([])).toEqual([]);
  });

  it("groups consecutive practice sessions into a carousel", () => {
    const segments = segmentWeekendSessionsForDisplay([
      session("p1", { sessionType: "PRACTICE" }),
      session("p2", { sessionType: "PRACTICE" }),
      session("r", { sessionType: "RACE" }),
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      type: "carousel",
      kind: "PRACTICE",
      sessions: [{ id: "p1" }, { id: "p2" }],
    });
    expect(segments[1]).toMatchObject({ type: "single", session: { id: "r" } });
  });

  it("groups consecutive qualifying sessions into a carousel", () => {
    const segments = segmentWeekendSessionsForDisplay([
      session("r", { sessionType: "RACE" }),
      session("q1", { sessionType: "QUALIFYING" }),
      session("q2", { sessionType: "QUALIFYING" }),
    ]);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({ type: "single", session: { id: "r" } });
    expect(segments[1]).toMatchObject({
      type: "carousel",
      kind: "QUALIFYING",
      sessions: [{ id: "q1" }, { id: "q2" }],
    });
  });

  it("keeps single practice or qualifying as standalone cards", () => {
    const segments = segmentWeekendSessionsForDisplay([
      session("p", { sessionType: "PRACTICE" }),
      session("q", { sessionType: "QUALIFYING" }),
      session("r", { sessionType: "RACE" }),
    ]);

    expect(segments).toHaveLength(3);
    expect(segments.every((s) => s.type === "single")).toBe(true);
  });

  it("creates separate carousels for practice and qualifying blocks", () => {
    const segments = segmentWeekendSessionsForDisplay([
      session("p1", { sessionType: "PRACTICE" }),
      session("p2", { sessionType: "PRACTICE" }),
      session("q1", { sessionType: "QUALIFYING" }),
      session("q2", { sessionType: "QUALIFYING" }),
      session("r", { sessionType: "RACE" }),
    ]);

    expect(segments).toHaveLength(3);
    expect(segments[0]?.type).toBe("carousel");
    expect(segments[1]?.type).toBe("carousel");
    expect(segments[2]?.type).toBe("single");
  });
});
