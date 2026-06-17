/**
 * Client-side session kind helpers — mirrors backend `apex/src/lib/sessionKind.ts`.
 */

export function isRaceKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): boolean {
  const st = (session.sessionType ?? "").toUpperCase().trim();
  if (st === "RACE" || st === "SPRINT") return true;
  if (st === "MANUAL_ACTIVITY") {
    return (session.manualSessionKind ?? "").toUpperCase().trim() === "RACE";
  }
  return false;
}

export function isQualifyingKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): boolean {
  const st = (session.sessionType ?? "").toUpperCase().trim();
  if (st === "MANUAL_ACTIVITY") {
    return (session.manualSessionKind ?? "").toUpperCase().trim() === "QUALIFY";
  }
  return st === "QUALIFY" || st === "QUALIFYING" || st === "QUALI";
}

export function isWarmupKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): boolean {
  const st = (session.sessionType ?? "").toUpperCase().trim();
  if (st === "MANUAL_ACTIVITY") return false;
  return st === "WARMUP" || st === "WARM_UP";
}

export function isPracticeKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): boolean {
  const st = (session.sessionType ?? "").toUpperCase().trim();
  if (st === "MANUAL_ACTIVITY") {
    return (session.manualSessionKind ?? "").toUpperCase().trim() === "PRACTICE";
  }
  if (isWarmupKind(session)) return false;
  return st === "PRACTICE" || st === "UNKNOWN" || st === "" || st === "TIME_TRIAL" || st === "TIMETRIAL";
}

/** Qualifying finish position (qualifyingPosition preferred; legacy rows may use position). */
export function effectiveQualifyingPosition(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  qualifyingPosition?: number | null;
  position?: number | null;
}): number | null {
  if (!isQualifyingKind(session)) return null;
  const qp = session.qualifyingPosition;
  if (qp != null && qp >= 1) return qp;
  const pos = session.position;
  if (pos != null && pos >= 1) return pos;
  return null;
}
