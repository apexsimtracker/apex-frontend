import { formatLapMs, formatCarName } from "@/lib/utils";
import { formatTrackName } from "@/lib/tracks";
import { formatSessionType } from "@/lib/sim";

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
    (ms): ms is number => typeof ms === "number" && Number.isFinite(ms) && ms > 0
  );
}

/**
 * Consistency proxy: 100 − (stdDev/mean)×100, clamped 0..100.
 * Must stay aligned with backend `consistencyPct` in apex/src/lib/sessionLapStats.ts.
 */
export function calcConsistencyScore(lapTimes: number[]): number | null {
  const laps = sanitizeLapTimesForConsistency(lapTimes);
  if (laps.length < 3) return null;
  const mean = laps.reduce((a, b) => a + b, 0) / laps.length;
  if (mean <= 0) return null;
  const variance =
    laps.reduce((sum, t) => sum + (t - mean) ** 2, 0) / laps.length;
  const stdDev = Math.sqrt(variance);
  const pct = 100 - (stdDev / mean) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return Math.round(clamped);
}

/**
 * Share payload for multi-line Apex session text (clipboard + social).
 * Satisfied by session detail API rows and activity card props.
 */
export type SessionShareFields = {
  sessionType?: string | null;
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
export function resolveSessionFields(session: SessionShareFields & Record<string, unknown>): {
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
  const details = (s0.details ?? s.details) as Record<string, unknown> | undefined;
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
    s.track_display
  );
  const sim = pickFirstString(
    session.sim,
    session.game,
    s.game,
    s.gameName,
    s.simName,
    s.sim_name,
    s.sourceSim
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
    s.vehicle_name
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
    s.vehicle_name
  );
  return { track, sim, car, carRawForFormat };
}

/**
 * Same multi-line format as the session detail Share button (Apex — type @ track, car, best, laps, consistency).
 */
export function buildSessionShareText(session: SessionShareFields & Record<string, unknown>): string {
  const resolved = resolveSessionFields(session);
  const type = formatSessionType(session?.sessionType);
  const track = formatTrackName(resolved.track);
  const car =
    resolved.car ??
    (resolved.carRawForFormat ? formatCarName(resolved.carRawForFormat) : "Unknown Car");
  const laps = session?.lapCount ?? 0;
  const best = formatLapMs(session?.bestLapMs);
  const lapTimes = sanitizeLapTimesForConsistency(
    (session?.laps ?? []).map((l) => l.timeMs ?? 0)
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
