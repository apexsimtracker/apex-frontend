/**
 * Mirrors apex/src/lib/sessionLapStats.ts so admin/public UIs show the same sector splits
 * when DB rows omit sectors (telemetry ingest).
 */

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

  const s1Values = laps.map((l) => l.sector1Ms).filter((v): v is number => v != null && v > 0);
  const s2Values = laps.map((l) => l.sector2Ms).filter((v): v is number => v != null && v > 0);
  const s3Values = laps.map((l) => l.sector3Ms).filter((v): v is number => v != null && v > 0);

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
}): { s1: number; s2: number; s3: number } {
  const has =
    l.sector1Ms != null && l.sector2Ms != null && l.sector3Ms != null;
  if (has) {
    return { s1: l.sector1Ms!, s2: l.sector2Ms!, s3: l.sector3Ms! };
  }
  return generateSyntheticSectors(l.lapTimeMs);
}
