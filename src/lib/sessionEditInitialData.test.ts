import { describe, it, expect } from "vitest";
import { manualActivityInitialFromPublicDetail } from "./sessionEditInitialData";

describe("manualActivityInitialFromPublicDetail", () => {
  it("prefills qual position from qualifyingPosition when position is null", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "QUALIFYING",
      position: null,
      qualifyingPosition: 3,
      totalDrivers: 24,
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
    });
    expect(initial.manualSessionKind).toBe("QUALIFY");
    expect(initial.position).toBe(3);
  });

  it("keeps race finish in position for race sessions", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "RACE",
      position: 2,
      qualifyingPosition: 5,
      totalDrivers: 24,
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
    });
    expect(initial.manualSessionKind).toBe("RACE");
    expect(initial.position).toBe(2);
    expect(initial.qualifyingPosition).toBe(5);
  });

  it("orders laps and aligns sectors with lapsMs", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "MANUAL_ACTIVITY",
      manualSessionKind: "PRACTICE",
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
      laps: [
        {
          lap: 2,
          timeMs: 95_000,
          sector1Ms: 30_000,
          sector2Ms: 31_000,
          sector3Ms: 34_000,
        },
        {
          lap: 1,
          lapTimeMs: 92_500,
          sector1Ms: 29_100,
          sector2Ms: null,
          sector3Ms: 31_200,
        },
      ],
    });

    expect(initial.lapsMs).toEqual([92_500, 95_000]);
    expect(initial.lapsSectorsMs).toEqual([
      { sector1Ms: 29_100, sector2Ms: null, sector3Ms: 31_200 },
      { sector1Ms: 30_000, sector2Ms: 31_000, sector3Ms: 34_000 },
    ]);
  });

  it("maps null/missing sectors to null without inventing times", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "RACE",
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
      laps: [{ lap: 1, timeMs: 90_000 }],
    });

    expect(initial.lapsMs).toEqual([90_000]);
    expect(initial.lapsSectorsMs).toEqual([
      { sector1Ms: null, sector2Ms: null, sector3Ms: null },
    ]);
  });

  it("omits lap and sector arrays when no valid lap times exist", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "RACE",
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
      bestLapMs: 91_000,
      laps: [{ lap: 1, sector1Ms: 30_000 }],
    });

    expect(initial.lapsMs).toBeUndefined();
    expect(initial.lapsSectorsMs).toBeUndefined();
    expect(initial.bestLapMs).toBe(91_000);
  });

  it("marks out-laps and preserves conditions for edit prefill", () => {
    const initial = manualActivityInitialFromPublicDetail({
      sessionType: "PRACTICE",
      simKey: "iracing",
      catalogTrackId: "spa",
      catalogCarId: "ferrari",
      conditions: "WET",
      laps: [
        { lap: 1, timeMs: 120_000, isOutLap: true },
        {
          lap: 2,
          timeMs: 91_000,
          isOutLap: true,
          hasTelemetryData: true,
          sector1Ms: 30_000,
          sector2Ms: 30_000,
          sector3Ms: 31_000,
        },
        { lap: 3, timeMs: 90_000, isOutLap: false },
      ],
    });
    expect(initial.conditions).toBe("WET");
    expect(initial.lapsIsOutLap).toEqual([true, true, false]);
    expect(initial.lapsCanEditOutLap).toEqual([false, true, false]);
    expect(initial.lapsMs).toEqual([120_000, 91_000, 90_000]);
  });

  it("locks lap rows for recorded sessions and frees them for manual entries", () => {
    const recorded = manualActivityInitialFromPublicDetail({
      sessionType: "PRACTICE",
      simKey: "iracing",
      catalogTrackId: "spa",
      laps: [{ lap: 1, timeMs: 90_000 }],
    });
    expect(recorded.lapRowsLocked).toBe(true);

    const manual = manualActivityInitialFromPublicDetail({
      sessionType: "MANUAL_ACTIVITY",
      manualSessionKind: "PRACTICE",
      simKey: "iracing",
      catalogTrackId: "spa",
      laps: [{ lap: 1, timeMs: 90_000 }],
    });
    expect(manual.lapRowsLocked).toBe(false);
  });
});
