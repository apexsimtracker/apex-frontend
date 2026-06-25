/** True when session detail `ingestPath` indicates a manual (non-agent) upload path. */
export function isManualIngest(ingestPath?: string | null): boolean {
  const p = (ingestPath ?? "").trim().toLowerCase();
  return (
    p === "manual_form" ||
    p === "manual_upload_ibt" ||
    p === "manual_upload_json"
  );
}
