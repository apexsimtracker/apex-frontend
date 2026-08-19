import { describe, expect, it } from "vitest";
import { manualActivityFormSchema } from "./manualActivitySchema";

const EMPTY_FORM = {
  sim: "",
  trackId: "",
  carId: "",
  manualSessionKind: "RACE",
  position: "",
  totalDrivers: "",
  qualifyingPosition: "",
  laps: [{ lapTime: "", s1: "", s2: "", s3: "" }],
  caption: "",
  conditions: "DRY" as const,
};

function issuePaths(input: unknown): string[] {
  const result = manualActivityFormSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((issue) => issue.path.join("."));
}

describe("manualActivityFormSchema", () => {
  it("reports sim, track and the missing lap together on an empty form", () => {
    const paths = issuePaths(EMPTY_FORM);
    expect(paths).toContain("sim");
    expect(paths).toContain("trackId");
    expect(paths).toContain("laps");
  });

  it("keeps the per-row format error instead of the array-level lap error", () => {
    const paths = issuePaths({
      ...EMPTY_FORM,
      sim: "iracing",
      trackId: "monza",
      laps: [{ lapTime: "not a time", s1: "", s2: "", s3: "" }],
    });
    expect(paths).toContain("laps.0.lapTime");
    expect(paths).not.toContain("laps");
  });

  it("accepts a single valid lap", () => {
    const paths = issuePaths({
      ...EMPTY_FORM,
      sim: "iracing",
      trackId: "monza",
      laps: [{ lapTime: "1:32.456", s1: "", s2: "", s3: "" }],
    });
    expect(paths).toEqual([]);
  });
});
