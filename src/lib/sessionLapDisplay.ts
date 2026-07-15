/**
 * Display helpers for session lap timing highlights from API payloads.
 * Highlight/minima math is computed at ingest on the backend (`timingDisplayCache`).
 * Purple = absolute session minimum; default = normal. Legacy "green" coerces to default.
 */

export type TimingHighlight = "purple" | "default";

export type SessionTimingMinima = {
  lapMs: number | null;
  s1Ms: number | null;
  s2Ms: number | null;
  s3Ms: number | null;
};

export type LapTimingHighlights = {
  lap: TimingHighlight;
  s1: TimingHighlight;
  s2: TimingHighlight;
  s3: TimingHighlight;
};

export const DEFAULT_LAP_TIMING_HIGHLIGHTS: LapTimingHighlights = {
  lap: "default",
  s1: "default",
  s2: "default",
  s3: "default",
};

export const EMPTY_SESSION_TIMING_MINIMA: SessionTimingMinima = {
  lapMs: null,
  s1Ms: null,
  s2Ms: null,
  s3Ms: null,
};

/** Coerce API/legacy highlight strings; unknown and legacy "green" → default. */
export function coerceTimingHighlight(raw: unknown): TimingHighlight {
  return raw === "purple" ? "purple" : "default";
}

function coerceLapHighlights(
  raw: LapTimingHighlights | { lap: unknown; s1?: unknown; s2?: unknown; s3?: unknown } | null | undefined
): LapTimingHighlights | null {
  if (!raw || raw.lap == null) return null;
  return {
    lap: coerceTimingHighlight(raw.lap),
    s1: "s1" in raw ? coerceTimingHighlight(raw.s1) : "default",
    s2: "s2" in raw ? coerceTimingHighlight(raw.s2) : "default",
    s3: "s3" in raw ? coerceTimingHighlight(raw.s3) : "default",
  };
}

/** Normalize GET /sessions/:id lap rows (lap/timeMs or lapNumber/lapTimeMs) for display helpers. */
export function coerceSessionDetailLaps(laps: unknown[]): {
  lap: number;
  lapNumber: number;
  lapTimeMs: number;
  timeMs: number;
  deltaMs?: number;
  isValid?: boolean;
  isBestLap?: boolean;
  isOutLap?: boolean;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  sectorsEstimated?: boolean;
  highlights?: LapTimingHighlights | { lap: LapTimingHighlights["lap"] } | null;
}[] {
  return laps.map((raw) => {
    const l = raw as Record<string, unknown>;
    const lapNumber =
      typeof l.lapNumber === "number"
        ? l.lapNumber
        : typeof l.lap === "number"
          ? l.lap
          : 0;
    const lapTimeMs =
      typeof l.lapTimeMs === "number"
        ? l.lapTimeMs
        : typeof l.timeMs === "number"
          ? l.timeMs
          : 0;
    const coerced = coerceLapHighlights(
      l.highlights as
        | LapTimingHighlights
        | { lap: unknown; s1?: unknown; s2?: unknown; s3?: unknown }
        | null
        | undefined
    );
    return {
      lap: lapNumber,
      lapNumber,
      lapTimeMs,
      timeMs: lapTimeMs,
      deltaMs: typeof l.deltaMs === "number" ? l.deltaMs : undefined,
      isValid: typeof l.isValid === "boolean" ? l.isValid : undefined,
      isBestLap: typeof l.isBestLap === "boolean" ? l.isBestLap : undefined,
      isOutLap: l.isOutLap === true ? true : undefined,
      sector1Ms: (l.sector1Ms as number | null | undefined) ?? null,
      sector2Ms: (l.sector2Ms as number | null | undefined) ?? null,
      sector3Ms: (l.sector3Ms as number | null | undefined) ?? null,
      sectorsEstimated:
        typeof l.sectorsEstimated === "boolean"
          ? l.sectorsEstimated
          : undefined,
      highlights: coerced,
    };
  });
}

export function timingHighlightClass(
  h: TimingHighlight,
  opts?: { isLapTime?: boolean },
): string {
  const semibold = opts?.isLapTime ? " font-semibold" : "";
  if (h === "purple") return `text-purple-400${semibold}`;
  return "text-white/80";
}

/** Build highlight map from API lap payloads when every lap includes highlights. */
export function buildHighlightMapFromLaps(
  laps: {
    lap: number;
    highlights?: LapTimingHighlights | { lap: unknown; s1?: unknown; s2?: unknown; s3?: unknown } | null;
  }[],
  opts?: { missingAsDefault?: boolean },
): Map<number, LapTimingHighlights> | null {
  if (laps.length === 0) return null;
  const map = new Map<number, LapTimingHighlights>();
  for (const l of laps) {
    const coerced = coerceLapHighlights(l.highlights ?? null);
    if (!coerced) {
      if (opts?.missingAsDefault) {
        map.set(l.lap, DEFAULT_LAP_TIMING_HIGHLIGHTS);
        continue;
      }
      return null;
    }
    map.set(l.lap, coerced);
  }
  return map.size === laps.length ? map : null;
}
