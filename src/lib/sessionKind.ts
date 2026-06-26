/**
 * Client-side session kind helpers — mirrors backend `apex/src/lib/sessionKind.ts`.
 * Also hosts session type tag styles and display position helpers (single taxonomy module).
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

export type SessionTypeTagKind =
  | "RACE"
  | "QUALIFY"
  | "PRACTICE"
  | "WARMUP"
  | "UNKNOWN";

export type SessionTypeTagStyle = {
  label: SessionTypeTagKind;
  color: string;
  background: string;
};

export const SESSION_TYPE_TAG_STYLES: Record<
  SessionTypeTagKind,
  SessionTypeTagStyle
> = {
  RACE: {
    label: "RACE",
    color: "#E8172B",
    background: "rgba(232, 23, 43, 0.14)",
  },
  QUALIFY: {
    label: "QUALIFY",
    color: "#9B59FF",
    background: "rgba(155, 89, 255, 0.14)",
  },
  PRACTICE: {
    label: "PRACTICE",
    color: "#888888",
    background: "rgba(136, 136, 136, 0.14)",
  },
  WARMUP: {
    label: "WARMUP",
    color: "#F5C518",
    background: "rgba(245, 197, 24, 0.14)",
  },
  UNKNOWN: {
    label: "UNKNOWN",
    color: "#888888",
    background: "rgba(136, 136, 136, 0.14)",
  },
};

export function resolveSessionTypeTagKind(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): SessionTypeTagKind {
  if (isRaceKind(session)) return "RACE";
  if (isQualifyingKind(session)) return "QUALIFY";
  if (isWarmupKind(session)) return "WARMUP";
  if (isPracticeKind(session)) return "PRACTICE";
  return "UNKNOWN";
}

export function getSessionTypeTagStyle(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): SessionTypeTagStyle {
  return SESSION_TYPE_TAG_STYLES[resolveSessionTypeTagKind(session)];
}

export type DisplayPositionSession = {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  position?: number | null;
  qualifyingPosition?: number | null;
  totalDrivers?: number | null;
};

/** Race/qual result label for session cards and detail, or null for practice. */
export function getDisplayPosition(session: DisplayPositionSession): string | null {
  const total = session.totalDrivers;
  const suffix = total != null && total > 0 ? ` / ${total}` : "";

  if (isRaceKind(session) && session.position != null && session.position > 0) {
    return `P${session.position}${suffix}`;
  }

  if (isQualifyingKind(session)) {
    const qp = effectiveQualifyingPosition(session);
    if (qp != null && qp > 0) return `P${qp}${suffix}`;
  }

  return null;
}

/** True when race/qual sessions have a displayable finish position. */
export function shouldShowSessionPosition(session: DisplayPositionSession): boolean {
  return getDisplayPosition(session) != null;
}

/** Parse P{n} from getDisplayPosition for podium styling; returns 0 when not applicable. */
export function displayPositionRank(session: DisplayPositionSession): number {
  const label = getDisplayPosition(session);
  if (!label) return 0;
  const m = /^P(\d+)/.exec(label);
  if (!m) return 0;
  const n = parseInt(m[1]!, 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
