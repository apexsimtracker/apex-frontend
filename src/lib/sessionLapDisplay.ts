/**
 * Mirrors apex/src/lib/sessionLapStats.ts so admin/public UIs show the same sector splits
 * when DB rows omit sectors (telemetry ingest).
 */

const SECTOR_MIRROR_EPS_MS = 2;

function isMirroredSectorPair(s1Ms: number, s2Ms: number, epsMs = SECTOR_MIRROR_EPS_MS): boolean {
  return s1Ms > 0 && s2Ms > 0 && Math.abs(s1Ms - s2Ms) <= epsMs;
}

function sectorsSumMatchesLap(
  s1Ms: number,
  s2Ms: number,
  s3Ms: number,
  lapTimeMs: number,
  toleranceRatio = 0.02
): boolean {
  const sum = s1Ms + s2Ms + s3Ms;
  const tol = Math.max(100, Math.round(lapTimeMs * toleranceRatio));
  return Math.abs(sum - lapTimeMs) <= tol;
}

function validateSectorTripletForPersist(
  sector1Ms: number | null | undefined,
  sector2Ms: number | null | undefined,
  sector3Ms: number | null | undefined,
  lapTimeMs: number
): { s1: number; s2: number; s3: number } | null {
  if (
    sector1Ms == null ||
    sector2Ms == null ||
    sector3Ms == null ||
    sector1Ms <= 0 ||
    sector2Ms <= 0 ||
    sector3Ms <= 0
  ) {
    return null;
  }
  if (isMirroredSectorPair(sector1Ms, sector2Ms)) return null;
  if (!sectorsSumMatchesLap(sector1Ms, sector2Ms, sector3Ms, lapTimeMs)) return null;
  return { s1: sector1Ms, s2: sector2Ms, s3: sector3Ms };
}

function looksLikeSyntheticSectorSplit(
  sector1Ms: number,
  sector2Ms: number,
  sector3Ms: number,
  lapTimeMs: number
): boolean {
  if (!isMirroredSectorPair(sector1Ms, sector2Ms, 0)) return false;
  const expected = Math.round(lapTimeMs * 0.33);
  return sector1Ms === expected && sector2Ms === expected;
}

export function generateSyntheticSectors(lapTimeMs: number): {
  s1: number;
  s2: number;
  s3: number;
} {
  const s1 = Math.round(lapTimeMs * 0.33);
  const s2 = Math.round(lapTimeMs * 0.33);
  const s3 = lapTimeMs - s1 - s2;
  return { s1: Math.max(0, s1), s2: Math.max(0, s2), s3: Math.max(0, s3) };
}

/** Resolve display sectors and whether they are API-synthesized estimates. */
export function resolveEffectiveSectors(
  sector1Ms: number | null | undefined,
  sector2Ms: number | null | undefined,
  sector3Ms: number | null | undefined,
  lapTimeMs: number
): { sectors: { s1: number; s2: number; s3: number }; sectorsEstimated: boolean } {
  const validated = validateSectorTripletForPersist(
    sector1Ms,
    sector2Ms,
    sector3Ms,
    lapTimeMs
  );
  if (
    validated != null &&
    !looksLikeSyntheticSectorSplit(validated.s1, validated.s2, validated.s3, lapTimeMs)
  ) {
    return { sectors: validated, sectorsEstimated: false };
  }
  return { sectors: generateSyntheticSectors(lapTimeMs), sectorsEstimated: true };
}

export function computeIdealLap(
  laps: {
    lapTimeMs: number;
    sector1Ms: number | null;
    sector2Ms: number | null;
    sector3Ms: number | null;
  }[]
): {
  lapTimeMs: number;
  sector1Ms: number;
  sector2Ms: number;
  sector3Ms: number;
} | null {
  if (laps.length === 0) return null;

  const s1Values: number[] = [];
  const s2Values: number[] = [];
  const s3Values: number[] = [];

  for (const lap of laps) {
    const valid = validateSectorTripletForPersist(
      lap.sector1Ms,
      lap.sector2Ms,
      lap.sector3Ms,
      lap.lapTimeMs
    );
    if (valid) {
      s1Values.push(valid.s1);
      s2Values.push(valid.s2);
      s3Values.push(valid.s3);
    }
  }

  if (s1Values.length === 0 || s2Values.length === 0 || s3Values.length === 0) {
    const bestLapTime = Math.min(...laps.map((l) => l.lapTimeMs));
    const synthetic = generateSyntheticSectors(bestLapTime);
    return {
      lapTimeMs: bestLapTime,
      sector1Ms: synthetic.s1,
      sector2Ms: synthetic.s2,
      sector3Ms: synthetic.s3,
    };
  }

  const bestS1 = Math.min(...s1Values);
  const bestS2 = Math.min(...s2Values);
  const bestS3 = Math.min(...s3Values);

  return {
    lapTimeMs: bestS1 + bestS2 + bestS3,
    sector1Ms: bestS1,
    sector2Ms: bestS2,
    sector3Ms: bestS3,
  };
}

export function effectiveLapSectors(l: {
  lapTimeMs: number;
  sector1Ms: number | null;
  sector2Ms: number | null;
  sector3Ms: number | null;
}): { s1: number; s2: number; s3: number; sectorsEstimated: boolean } {
  const { sectors, sectorsEstimated } = resolveEffectiveSectors(
    l.sector1Ms,
    l.sector2Ms,
    l.sector3Ms,
    l.lapTimeMs
  );
  return { ...sectors, sectorsEstimated };
}

export type TimingHighlight = "purple" | "green" | "default";

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

export type NormalizedLapInput = {
  lap: number;
  timeMs: number;
  isValid?: boolean;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  sectorsEstimated?: boolean;
};

function isQualifyingLapTime(l: NormalizedLapInput): boolean {
  return Number.isFinite(l.timeMs) && l.timeMs > 0 && l.isValid !== false;
}

function isQualifyingSector(v: number | null | undefined): v is number {
  return v != null && Number.isFinite(v) && v > 0;
}

function isQualifyingLapForSectorStats(l: NormalizedLapInput): boolean {
  return l.isValid !== false;
}

/** Absolute session-wide minima for lap and sector times (valid laps / positive sectors only). */
export function computeSessionTimingMinima(
  laps: NormalizedLapInput[]
): SessionTimingMinima {
  const qualifyingLapTimes = laps
    .filter(isQualifyingLapTime)
    .map((l) => l.timeMs);
  const lapMs =
    qualifyingLapTimes.length > 0 ? Math.min(...qualifyingLapTimes) : null;

  const s1Values = laps
    .filter(isQualifyingLapForSectorStats)
    .map((l) => l.sector1Ms)
    .filter(isQualifyingSector);
  const s2Values = laps
    .filter(isQualifyingLapForSectorStats)
    .map((l) => l.sector2Ms)
    .filter(isQualifyingSector);
  const s3Values = laps
    .filter(isQualifyingLapForSectorStats)
    .map((l) => l.sector3Ms)
    .filter(isQualifyingSector);

  return {
    lapMs,
    s1Ms: s1Values.length > 0 ? Math.min(...s1Values) : null,
    s2Ms: s2Values.length > 0 ? Math.min(...s2Values) : null,
    s3Ms: s3Values.length > 0 ? Math.min(...s3Values) : null,
  };
}

function resolveHighlight(
  timeMs: number | null | undefined,
  sessionMin: number | null,
  isMilestone: boolean,
  qualifies: boolean
): TimingHighlight {
  if (!qualifies) return "default";
  if (timeMs == null || !Number.isFinite(timeMs) || timeMs <= 0) return "default";
  if (sessionMin != null && timeMs === sessionMin) return "purple";
  if (isMilestone) return "green";
  return "default";
}

/**
 * Per-lap highlight map: purple = session absolute min, green = chronological
 * session PB milestone (superseded by a later lap), default = normal.
 */
export function computeSessionLapHighlights(
  laps: NormalizedLapInput[]
): Map<number, LapTimingHighlights> {
  const minima = computeSessionTimingMinima(laps);
  const sorted = [...laps].sort((a, b) => a.lap - b.lap);

  let runningBestLap = Infinity;
  let runningBestS1 = Infinity;
  let runningBestS2 = Infinity;
  let runningBestS3 = Infinity;

  const result = new Map<number, LapTimingHighlights>();

  for (const l of sorted) {
    let lapMilestone = false;
    let s1Milestone = false;
    let s2Milestone = false;
    let s3Milestone = false;

    if (isQualifyingLapTime(l) && l.timeMs < runningBestLap) {
      lapMilestone = Number.isFinite(runningBestLap);
      runningBestLap = l.timeMs;
    }
    if (
      isQualifyingLapForSectorStats(l) &&
      isQualifyingSector(l.sector1Ms) &&
      l.sector1Ms < runningBestS1
    ) {
      s1Milestone = Number.isFinite(runningBestS1);
      runningBestS1 = l.sector1Ms;
    }
    if (
      isQualifyingLapForSectorStats(l) &&
      isQualifyingSector(l.sector2Ms) &&
      l.sector2Ms < runningBestS2
    ) {
      s2Milestone = Number.isFinite(runningBestS2);
      runningBestS2 = l.sector2Ms;
    }
    if (
      isQualifyingLapForSectorStats(l) &&
      isQualifyingSector(l.sector3Ms) &&
      l.sector3Ms < runningBestS3
    ) {
      s3Milestone = Number.isFinite(runningBestS3);
      runningBestS3 = l.sector3Ms;
    }

    result.set(l.lap, {
      lap: resolveHighlight(l.timeMs, minima.lapMs, lapMilestone, isQualifyingLapTime(l)),
      s1: resolveHighlight(
        l.sector1Ms,
        minima.s1Ms,
        s1Milestone,
        isQualifyingLapForSectorStats(l)
      ),
      s2: resolveHighlight(
        l.sector2Ms,
        minima.s2Ms,
        s2Milestone,
        isQualifyingLapForSectorStats(l)
      ),
      s3: resolveHighlight(
        l.sector3Ms,
        minima.s3Ms,
        s3Milestone,
        isQualifyingLapForSectorStats(l)
      ),
    });
  }

  return result;
}

export function timingHighlightClass(
  h: TimingHighlight,
  opts?: { isLapTime?: boolean }
): string {
  const semibold = opts?.isLapTime ? " font-semibold" : "";
  switch (h) {
    case "purple":
      return `text-purple-400${semibold}`;
    case "green":
      return `text-lime-400${semibold}`;
    default:
      return "text-white/80";
  }
}

/** Build highlight map from API lap payloads when every lap includes highlights. */
export function buildHighlightMapFromLaps(
  laps: { lap: number; highlights?: LapTimingHighlights | { lap: TimingHighlight } | null }[],
  opts?: { missingAsDefault?: boolean }
): Map<number, LapTimingHighlights> | null {
  if (laps.length === 0) return null;
  const map = new Map<number, LapTimingHighlights>();
  for (const l of laps) {
    const h = l.highlights;
    if (!h || h.lap == null) {
      if (opts?.missingAsDefault) {
        map.set(l.lap, DEFAULT_LAP_TIMING_HIGHLIGHTS);
        continue;
      }
      return null;
    }
    map.set(l.lap, {
      lap: h.lap,
      s1: "s1" in h && h.s1 ? h.s1 : "default",
      s2: "s2" in h && h.s2 ? h.s2 : "default",
      s3: "s3" in h && h.s3 ? h.s3 : "default",
    });
  }
  return map.size === laps.length ? map : null;
}
