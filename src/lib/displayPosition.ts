import { isQualifyingKind, isRaceKind, effectiveQualifyingPosition } from "./sessionKind";

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
