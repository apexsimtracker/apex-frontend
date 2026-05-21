/**
 * Mirrors apex/src/lib/sessionEditMapping.ts — maps telemetry session types to manual form kinds.
 */

export type ManualSessionKindForm = "PRACTICE" | "QUALIFY" | "RACE";

export function telemetrySessionTypeToFormKind(
  sessionType: string | null | undefined
): ManualSessionKindForm {
  const u = (sessionType ?? "").toUpperCase().trim();
  if (u === "RACE" || u === "SPRINT") return "RACE";
  if (u === "QUALIFYING" || u === "QUALIFY" || u === "QUALI") return "QUALIFY";
  return "PRACTICE";
}
