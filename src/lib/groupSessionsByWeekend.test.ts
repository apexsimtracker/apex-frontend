import { describe, it, expect } from "vitest";
import { groupSessionsByWeekend, WEEKEND_WINDOW_MS } from "./groupSessionsByWeekend";
import type { SessionItem } from "./groupSessions";

const createSession = (
  id: string,
  overrides: Partial<SessionItem> = {}
): SessionItem => ({
  id,
  driverName: "Test Driver",
  track: "Spa-Francorchamps",
  car: "Ferrari 488 GT3",
  position: 1,
  totalDrivers: 20,
  sessionType: "RACE",
  sim: "iRacing",
  bestLapMs: 120000,
  lapCount: 15,
  consistencyScore: 85,
  likeCount: 0,
  commentCount: 0,
  likedByMe: false,
  createdAt: new Date().toISOString(),
  authorId: "user-1",
  ...overrides,
});

describe("groupSessionsByWeekend", () => {
  it("returns empty array for empty input", () => {
    expect(groupSessionsByWeekend([])).toEqual([]);
  });

  it("groups same author + track across midnight within 48h", () => {
    const sessions = [
      createSession("qual", {
        sessionType: "QUALIFYING",
        createdAt: "2024-06-08T20:00:00Z",
      }),
      createSession("race", {
        sessionType: "RACE",
        createdAt: "2024-06-09T14:00:00Z",
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("weekend");
    if (result[0].type === "weekend") {
      expect(result[0].group.sessions).toHaveLength(2);
      expect(result[0].group.hasQualifying).toBe(true);
      expect(result[0].group.hasRace).toBe(true);
      expect(result[0].group.weekendSummary).toBe("Qualifying · Race");
    }
  });

  it("splits same author + track when more than 48h apart", () => {
    const gapMs = WEEKEND_WINDOW_MS + 60 * 60 * 1000;
    const base = new Date("2024-06-01T12:00:00Z").getTime();

    const sessions = [
      createSession("1", { createdAt: new Date(base).toISOString() }),
      createSession("2", { createdAt: new Date(base + gapMs).toISOString() }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === "standalone")).toBe(true);
  });

  it("starts new group after complete P+Q+R cycle", () => {
    const base = new Date("2024-06-01T10:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("p", {
        sessionType: "PRACTICE",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("q", {
        sessionType: "QUALIFYING",
        createdAt: new Date(base + hour).toISOString(),
      }),
      createSession("r", {
        sessionType: "RACE",
        createdAt: new Date(base + 2 * hour).toISOString(),
      }),
      createSession("p2", {
        sessionType: "PRACTICE",
        createdAt: new Date(base + 3 * hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(2);
    if (result[0].type === "weekend" && result[1].type === "weekend") {
      expect(result[0].group.sessions).toHaveLength(1);
      expect(result[0].group.sessions[0].id).toBe("p2");
      expect(result[1].group.sessions).toHaveLength(3);
    }
  });

  it("does not group sessions from different authors at same track", () => {
    const base = new Date("2024-06-01T14:00:00Z").getTime();

    const sessions = [
      createSession("a", {
        authorId: "user-a",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("b", {
        authorId: "user-b",
        createdAt: new Date(base + 30 * 60 * 1000).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === "standalone")).toBe(true);
    if (result[0].type === "standalone" && result[1].type === "standalone") {
      expect(result[0].session.authorId).not.toBe(result[1].session.authorId);
    }
  });

  it("treats missing track as standalone", () => {
    const sessions = [
      createSession("1", { track: null }),
      createSession("2", { track: "unknown" }),
      createSession("3", { track: "session.ibt" }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(3);
    expect(result.every((r) => r.type === "standalone")).toBe(true);
  });

  it("emits single session as standalone (no weekend header)", () => {
    const result = groupSessionsByWeekend([createSession("solo")]);
    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("standalone");
  });

  it("shows P + R pills only when practice and race exist without qual", () => {
    const base = new Date("2024-06-01T10:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("p", {
        sessionType: "PRACTICE",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("r", {
        sessionType: "RACE",
        createdAt: new Date(base + hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    if (result[0].type === "weekend") {
      expect(result[0].group.hasPractice).toBe(true);
      expect(result[0].group.hasRace).toBe(true);
      expect(result[0].group.hasQualifying).toBe(false);
      expect(result[0].group.weekendSummary).toBe("Practice · Race");
    }
  });

  it("sorts sessions within group Race → Qualifying → Practice", () => {
    const base = new Date("2024-06-01T10:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("p", {
        sessionType: "PRACTICE",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("q", {
        sessionType: "QUALIFYING",
        createdAt: new Date(base + hour).toISOString(),
      }),
      createSession("r", {
        sessionType: "RACE",
        createdAt: new Date(base + 2 * hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    if (result[0]?.type === "weekend") {
      expect(result[0].group.sessions.map((s) => s.id)).toEqual(["r", "q", "p"]);
    }
  });

  it("does not group same author + track when cars differ", () => {
    const base = new Date("2024-06-01T12:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("ferrari", {
        car: "Ferrari 488 GT3",
        sessionType: "QUALIFYING",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("porsche", {
        car: "Porsche 911 GT3 R",
        sessionType: "RACE",
        createdAt: new Date(base + hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === "standalone")).toBe(true);
  });

  it("merges track aliases (spa vs Spa-Francorchamps) within 48h", () => {
    const base = new Date("2024-06-01T12:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("spa-short", {
        track: "spa",
        sessionType: "QUALIFYING",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("spa-long", {
        track: "Spa-Francorchamps",
        sessionType: "RACE",
        createdAt: new Date(base + hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("weekend");
    if (result[0].type === "weekend") {
      expect(result[0].group.sessions).toHaveLength(2);
      expect(result[0].group.trackKey).toBe("spa-francorchamps");
    }
  });

  it("splits different tracks for same author within 48h", () => {
    const base = new Date("2024-06-01T12:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("monza", {
        track: "Monza",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("spa", {
        track: "Spa-Francorchamps",
        createdAt: new Date(base + hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(2);
    expect(result.every((r) => r.type === "standalone")).toBe(true);
  });

  it("treats missing authorId as standalone", () => {
    const sessions = [
      createSession("no-author", {
        authorId: undefined,
        track: "Monza",
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("standalone");
  });

  it("includes warmup in sessions but not in P/Q/R pills", () => {
    const base = new Date("2024-06-01T10:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("w", {
        sessionType: "WARMUP",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("r", {
        sessionType: "RACE",
        createdAt: new Date(base + hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    if (result[0].type === "weekend") {
      expect(result[0].group.sessions).toHaveLength(2);
      expect(result[0].group.hasPractice).toBe(false);
      expect(result[0].group.hasQualifying).toBe(false);
      expect(result[0].group.hasRace).toBe(true);
      expect(result[0].group.weekendSummary).toBe("Race");
    }
  });

  it("uses manualSessionKind for MANUAL_ACTIVITY P/Q/R flags", () => {
    const base = new Date("2024-06-01T10:00:00Z").getTime();
    const hour = 60 * 60 * 1000;

    const sessions = [
      createSession("mp", {
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "PRACTICE",
        createdAt: new Date(base).toISOString(),
      }),
      createSession("mq", {
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "QUALIFY",
        createdAt: new Date(base + hour).toISOString(),
      }),
      createSession("mr", {
        sessionType: "MANUAL_ACTIVITY",
        manualSessionKind: "RACE",
        createdAt: new Date(base + 2 * hour).toISOString(),
      }),
    ];

    const result = groupSessionsByWeekend(sessions);
    expect(result).toHaveLength(1);
    if (result[0].type === "weekend") {
      expect(result[0].group.hasPractice).toBe(true);
      expect(result[0].group.hasQualifying).toBe(true);
      expect(result[0].group.hasRace).toBe(true);
      expect(result[0].group.weekendSummary).toBe("Practice · Qualifying · Race");
    }
  });
});
