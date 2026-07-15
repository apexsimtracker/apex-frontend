import { describe, expect, it } from "vitest";
import {
  isAgentOnlyTelemetryGate,
  isManualIngest,
  isManualIngestWithoutTraces,
  telemetryIngestSourceLabel,
} from "./telemetryEligibility";

describe("isManualIngestWithoutTraces", () => {
  it("treats form and JSON as without traces", () => {
    expect(isManualIngestWithoutTraces("manual_form")).toBe(true);
    expect(isManualIngestWithoutTraces("manual_upload_json")).toBe(true);
  });

  it("allows manual_upload_ibt through (traces may be present)", () => {
    expect(isManualIngestWithoutTraces("manual_upload_ibt")).toBe(false);
    expect(isManualIngestWithoutTraces("agent_upload")).toBe(false);
    expect(isManualIngestWithoutTraces(null)).toBe(false);
  });
});

describe("isAgentOnlyTelemetryGate", () => {
  it("gates form and JSON only", () => {
    expect(isAgentOnlyTelemetryGate("manual_form")).toBe(true);
    expect(isAgentOnlyTelemetryGate("manual_upload_json")).toBe(true);
    expect(isAgentOnlyTelemetryGate("manual_upload_ibt")).toBe(false);
    expect(isAgentOnlyTelemetryGate("agent_upload")).toBe(false);
  });
});

describe("isManualIngest", () => {
  it("still detects all manual ingest paths including IBT", () => {
    expect(isManualIngest("manual_form")).toBe(true);
    expect(isManualIngest("manual_upload_ibt")).toBe(true);
    expect(isManualIngest("manual_upload_json")).toBe(true);
    expect(isManualIngest("agent_upload")).toBe(false);
  });
});

describe("telemetryIngestSourceLabel", () => {
  it("labels agent vs IBT vs other ingest paths", () => {
    expect(telemetryIngestSourceLabel("agent_upload")).toBe("Agent session");
    expect(telemetryIngestSourceLabel("manual_upload_ibt")).toBe("IBT upload");
    expect(telemetryIngestSourceLabel("manual_upload_json")).toBe("JSON upload");
    expect(telemetryIngestSourceLabel("manual_form")).toBe("Manual session");
    expect(telemetryIngestSourceLabel(null)).toBe("Telemetry session");
  });
});
