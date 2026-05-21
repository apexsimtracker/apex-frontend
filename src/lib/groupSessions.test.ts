import { describe, it, expect } from "vitest";
import {
  groupSessions,
  aggregateBundleStats,
  type SessionItem,
} from "./groupSessions";

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
  ...overrides,
});

describe("groupSessions", () => {
  it("returns empty array for empty input", () => {
    expect(groupSessions([])).toEqual([]);
  });

  it("returns single activity for one session", () => {
    const session = createSession("1");
    const result = groupSessions([session]);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("single");
    if (result[0].type === "single") {
      expect(result[0].session.id).toBe("1");
    }
  });

  it("groups sessions with same sim/track/car within time window", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { createdAt: new Date(baseTime).toISOString() }),
      createSession("2", { createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString() }), // +30min
      createSession("3", { createdAt: new Date(baseTime + 60 * 60 * 1000).toISOString() }), // +1h
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bundle");
    if (result[0].type === "bundle") {
      expect(result[0].sessions).toHaveLength(3);
    }
  });

  it("does NOT group sessions more than 2 hours apart", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { createdAt: new Date(baseTime).toISOString() }),
      createSession("2", { createdAt: new Date(baseTime + 3 * 60 * 60 * 1000).toISOString() }), // +3h
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === "single")).toBe(true);
  });

  it("does NOT group sessions on different calendar days", () => {
    const sessions = [
      createSession("1", { createdAt: "2024-01-15T23:00:00Z" }),
      createSession("2", { createdAt: "2024-01-16T00:30:00Z" }), // Different day
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === "single")).toBe(true);
  });

  it("does NOT group sessions with different tracks", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { 
        track: "Spa-Francorchamps",
        createdAt: new Date(baseTime).toISOString() 
      }),
      createSession("2", { 
        track: "Monza",
        createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString() 
      }),
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
  });

  it("does NOT group sessions with different sims", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { 
        sim: "iRacing",
        createdAt: new Date(baseTime).toISOString() 
      }),
      createSession("2", { 
        sim: "ACC",
        createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString() 
      }),
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
  });

  it("treats sessions with missing track as standalone", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { 
        track: null,
        createdAt: new Date(baseTime).toISOString() 
      }),
      createSession("2", { 
        track: "Spa-Francorchamps",
        createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString() 
      }),
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
    expect(result.every(r => r.type === "single")).toBe(true);
  });

  it("treats sessions with .ibt filename as standalone", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { 
        track: "some_session.ibt",
        createdAt: new Date(baseTime).toISOString() 
      }),
      createSession("2", { 
        track: "Spa-Francorchamps",
        createdAt: new Date(baseTime + 30 * 60 * 1000).toISOString() 
      }),
    ];
    
    const result = groupSessions(sessions);
    
    expect(result).toHaveLength(2);
  });

  it("caps bundles at MAX_BUNDLE_SIZE with overflow count", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = Array.from({ length: 8 }, (_, i) =>
      createSession(`${i + 1}`, {
        createdAt: new Date(baseTime + i * 10 * 60 * 1000).toISOString(), // 10min apart
      })
    );
    
    const result = groupSessions(sessions, { maxBundleSize: 5 });
    
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("bundle");
    if (result[0].type === "bundle") {
      expect(result[0].sessions).toHaveLength(5);
      expect(result[0].overflowCount).toBe(3);
    }
  });

  it("sorts results by most recent session", () => {
    const sessions = [
      createSession("1", { createdAt: "2024-01-15T10:00:00Z" }),
      createSession("2", { 
        track: "Monza",
        createdAt: "2024-01-15T14:00:00Z" 
      }),
      createSession("3", { createdAt: "2024-01-15T08:00:00Z" }),
    ];
    
    const result = groupSessions(sessions);
    
    // Session 2 (Monza, 14:00) should be first
    expect(result[0].type).toBe("single");
    if (result[0].type === "single") {
      expect(result[0].session.id).toBe("2");
    }
  });

  it("handles custom time window", () => {
    const baseTime = new Date("2024-01-15T14:00:00Z").getTime();
    
    const sessions = [
      createSession("1", { createdAt: new Date(baseTime).toISOString() }),
      createSession("2", { createdAt: new Date(baseTime + 90 * 60 * 1000).toISOString() }), // +90min
    ];
    
    // With 1 hour window, they should NOT group
    const result1h = groupSessions(sessions, { timeWindowMs: 60 * 60 * 1000 });
    expect(result1h).toHaveLength(2);
    
    // With 2 hour window, they SHOULD group
    const result2h = groupSessions(sessions, { timeWindowMs: 2 * 60 * 60 * 1000 });
    expect(result2h).toHaveLength(1);
    expect(result2h[0].type).toBe("bundle");
  });
});

describe("aggregateBundleStats", () => {
  it("aggregates lap counts", () => {
    const sessions = [
      createSession("1", { lapCount: 10 }),
      createSession("2", { lapCount: 15 }),
      createSession("3", { lapCount: 12 }),
    ];
    
    const stats = aggregateBundleStats(sessions);
    expect(stats.totalLaps).toBe(37);
  });

  it("finds best lap time", () => {
    const sessions = [
      createSession("1", { bestLapMs: 125000 }),
      createSession("2", { bestLapMs: 120000 }),
      createSession("3", { bestLapMs: 122000 }),
    ];
    
    const stats = aggregateBundleStats(sessions);
    expect(stats.bestLapMs).toBe(120000);
  });

  it("calculates average lap time", () => {
    const sessions = [
      createSession("1", { bestLapMs: 120000 }),
      createSession("2", { bestLapMs: 130000 }),
    ];
    
    const stats = aggregateBundleStats(sessions);
    expect(stats.avgLapMs).toBe(125000);
  });

  it("handles null lap times", () => {
    const sessions = [
      createSession("1", { bestLapMs: 120000 }),
      createSession("2", { bestLapMs: null }),
    ];
    
    const stats = aggregateBundleStats(sessions);
    expect(stats.bestLapMs).toBe(120000);
  });

  it("calculates time range", () => {
    const sessions = [
      createSession("1", { createdAt: "2024-01-15T14:00:00Z" }),
      createSession("2", { createdAt: "2024-01-15T15:30:00Z" }),
      createSession("3", { createdAt: "2024-01-15T14:45:00Z" }),
    ];
    
    const stats = aggregateBundleStats(sessions);
    expect(stats.startTime.toISOString()).toBe("2024-01-15T14:00:00.000Z");
    expect(stats.endTime.toISOString()).toBe("2024-01-15T15:30:00.000Z");
  });
});
