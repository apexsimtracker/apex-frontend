/**
 * Telemetry analysis UI eligibility gates.
 * Backend may still mark sessions eligible; these helpers control front-end short-circuits.
 */

/** True when session is a manual form or JSON upload (no driving traces expected). */
export function isManualIngestWithoutTraces(ingestPath?: string | null): boolean {
  const p = (ingestPath ?? "").trim().toLowerCase();
  return p === "manual_form" || p === "manual_upload_json";
}

/**
 * @deprecated Prefer {@link isManualIngestWithoutTraces} for chart gating.
 * Kept for callers that need "any non-agent manual path" including IBT.
 */
export function isManualIngest(ingestPath?: string | null): boolean {
  const p = (ingestPath ?? "").trim().toLowerCase();
  return (
    p === "manual_form" ||
    p === "manual_upload_ibt" ||
    p === "manual_upload_json"
  );
}

/** Block "install agent" empty state — form/JSON only; IBT with traces uses the API. */
export function isAgentOnlyTelemetryGate(ingestPath?: string | null): boolean {
  return isManualIngestWithoutTraces(ingestPath);
}

/** Short label for the telemetry analysis subtitle (e.g. "Agent session · iracing"). */
export function telemetryIngestSourceLabel(ingestPath?: string | null): string {
  const p = (ingestPath ?? "").trim().toLowerCase();
  if (p === "manual_upload_ibt") return "IBT upload";
  if (p === "manual_upload_json") return "JSON upload";
  if (p === "manual_form") return "Manual session";
  if (p === "agent_upload") return "Agent session";
  return "Telemetry session";
}
