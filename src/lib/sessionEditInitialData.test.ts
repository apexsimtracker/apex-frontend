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
});
