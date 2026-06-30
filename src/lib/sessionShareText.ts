import { formatLapMs, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { formatSessionType } from "@/lib/sim";
import {
  resolveSessionTypeTagKind,
  SESSION_TYPE_TAG_STYLES,
  type SessionTypeTagKind,
} from "@/lib/sessionKind";

const SESSION_KIND_FRIENDLY: Record<SessionTypeTagKind, string> = {
  RACE: "Race",
  QUALIFY: "Qualifying",
  PRACTICE: "Practice",
  WARMUP: "Warmup",
  UNKNOWN: "Unknown",
};

function formatSessionKindLabel(session: {
  sessionType?: string | null;
  manualSessionKind?: string | null;
}): string {
  const st = (session.sessionType ?? "").trim().toUpperCase();
  // Manual rows use manualSessionKind; tag kind collapses sprint into race for badges only.
  if (st === "MANUAL_ACTIVITY") {
    const kind = resolveSessionTypeTagKind(session);
    return SESSION_KIND_FRIENDLY[kind] ?? SESSION_TYPE_TAG_STYLES[kind].label;
  }
  return formatSessionType(session.sessionType);
}

function pickFirstString(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === "string") {
      const t = c.trim();
      if (t && t !== "—") return t;
    }
  }
  return null;
}

/** Finite lap times > 0 ms — matches backend `sanitizeLaps`. */
export function sanitizeLapTimesForConsistency(lapTimes: number[]): number[] {
  return lapTimes.filter(
    (ms): ms is number =>
      typeof ms === "number" && Number.isFinite(ms) && ms > 0,
  );
}

/** Gap-to-best tier thresholds (seconds). Must match backend CONSISTENCY_GAP_TIERS. */
const CONSISTENCY_GAP_TIERS: { maxGapSec: number; score: number }[] = [
  { maxGapSec: 0.2, score: 97.5 },
  { maxGapSec: 0.3, score: 90 },
  { maxGapSec: 0.4, score: 82.5 },
  { maxGapSec: 0.5, score: 77.5 },
  { maxGapSec: 0.8, score: 70 },
  { maxGapSec: 1.0, score: 55 },
  { maxGapSec: 1.2, score: 45 },
  { maxGapSec: 1.5, score: 30 },
  { maxGapSec: 2.0, score: 20 },
  { maxGapSec: 3.0, score: 10 },
];

function lapConsistencyScore(gapToBestSec: number): number {
  if (gapToBestSec <= 0) return 100;
  for (const tier of CONSISTENCY_GAP_TIERS) {
    if (gapToBestSec <= tier.maxGapSec) return tier.score;
  }
  return 5;
}

/**
 * Session consistency: mean of per-lap gap-to-best tier scores, clamped 0..100.
 * Must stay aligned with backend `consistencyPct` in apex/src/lib/sessionLapStats.ts.
 */
export function calcConsistencyScore(lapTimes: number[]): number | null {
  const laps = sanitizeLapTimesForConsistency(lapTimes);
  if (laps.length < 3) return null;
  const bestLapMs = Math.min(...laps);
  if (bestLapMs <= 0) return null;
  const scores = laps.map((lap) =>
    lapConsistencyScore((lap - bestLapMs) / 1000),
  );
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const clamped = Math.max(0, Math.min(100, avg));
  return Math.round(clamped);
}

/**
 * Share payload for multi-line Apex session text (clipboard + social).
 * Satisfied by session detail API rows and activity card props.
 */
export type SessionShareFields = {
  sessionType?: string | null;
  manualSessionKind?: string | null;
  track?: string | null;
  trackName?: string | null;
  car?: string | null;
  carName?: string | null;
  vehicleDisplay?: string | null;
  game?: string | null;
  sim?: string | null;
  lapCount?: number | null;
  bestLapMs?: number | null;
  laps?: { timeMs?: number }[] | null;
  /** When lap times are unavailable (feed), use precomputed consistency if present. */
  consistencyScore?: number | null;
};

/** Track/car/sim resolution for share text and session header (same rules as detail page). */
export function resolveSessionFields(
  session: SessionShareFields & Record<string, unknown>,
): {
  track: string | null;
  sim: string | null;
  car: string | null;
  carRawForFormat: string | null;
} {
  const s0 = session as Record<string, unknown>;
  const s =
    s0 && typeof s0.session === "object" && s0.session !== null
      ? (s0.session as Record<string, unknown>)
      : s0;
  const meta = (s0.meta ?? s.meta) as Record<string, unknown> | undefined;
  const details = (s0.details ?? s.details) as
    | Record<string, unknown>
    | undefined;
  const track = pickFirstString(
    session.track,
    session.trackName,
    s.trackName,
    s.track_name,
    meta?.track,
    meta?.trackName,
    meta?.track_name,
    details?.track,
    details?.trackName,
    details?.track_name,
    s.circuit,
    s.circuitName,
    s.circuit_name,
    s.trackDisplay,
    s.track_display,
  );
  const sim = pickFirstString(
    session.sim,
    session.game,
    s.game,
    s.gameName,
    s.simName,
    s.sim_name,
    s.sourceSim,
  );
  const car = pickFirstString(
    session.vehicleDisplay,
    s.vehicleDisplay,
    s.vehicle_display,
    session.car,
    session.carName,
    s.carName,
    s.car_name,
    meta?.car,
    meta?.carName,
    meta?.car_name,
    details?.car,
    details?.carName,
    details?.car_name,
    details?.vehicle,
    details?.vehicleName,
    details?.vehicle_name,
    s.vehicle,
    s.vehicleName,
    s.vehicle_name,
  );
  const carRawForFormat = pickFirstString(
    session.car,
    s.carName,
    s.car_name,
    meta?.car,
    meta?.carName,
    meta?.car_name,
    details?.car,
    details?.carName,
    details?.car_name,
    s.vehicle,
    s.vehicleName,
    s.vehicle_name,
  );
  return { track, sim, car, carRawForFormat };
}

/**
 * Same multi-line format as the session detail Share button (Apex — type @ track, car, best, laps, consistency).
 */
export function buildSessionShareText(
  session: SessionShareFields & Record<string, unknown>,
): string {
  const resolved = resolveSessionFields(session);
  const type = formatSessionKindLabel({
    sessionType: session?.sessionType,
    manualSessionKind: (session as { manualSessionKind?: string | null })
      .manualSessionKind,
  });
  const track = formatTrackName(resolved.track);
  const car =
    resolved.car ??
    (resolved.carRawForFormat
      ? formatCarName(resolved.carRawForFormat)
      : "Unknown Car");
  const laps = session?.lapCount ?? 0;
  const best = formatLapMs(session?.bestLapMs);
  const lapTimes = sanitizeLapTimesForConsistency(
    (session?.laps ?? []).map((l) => l.timeMs ?? 0),
  );
  let consistency = calcConsistencyScore(lapTimes);
  if (
    consistency == null &&
    session.consistencyScore != null &&
    Number.isFinite(session.consistencyScore)
  ) {
    consistency = Math.round(session.consistencyScore);
  }
  const consistencyText = consistency == null ? "—" : `${consistency}/100`;
  return [
    `Apex — ${type} @ ${track}`,
    `Car: ${car}`,
    `Best: ${best}`,
    `Laps: ${laps}`,
    `Consistency: ${consistencyText}`,
  ].join("\n");
}
