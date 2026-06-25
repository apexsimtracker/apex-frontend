import { describe, expect, it } from "vitest";
import { isManualIngest } from "./telemetryEligibility";

describe("isManualIngest", () => {
  it("treats explicit manual ingest paths as manual", () => {
    expect(isManualIngest("manual_form")).toBe(true);
    expect(isManualIngest("manual_upload_ibt")).toBe(true);
    expect(isManualIngest("manual_upload_json")).toBe(true);
  });

  it("does not treat null or agent paths as manual", () => {
    expect(isManualIngest(null)).toBe(false);
    expect(isManualIngest(undefined)).toBe(false);
    expect(isManualIngest("agent_upload")).toBe(false);
    expect(isManualIngest("legacy_laps_ibt")).toBe(false);
  });
});
