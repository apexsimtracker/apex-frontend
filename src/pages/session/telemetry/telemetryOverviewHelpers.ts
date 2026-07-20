import type {
  TelemetrySummaryResponse,
  TelemetryTracesResponse,
} from "@/features/telemetry-analysis/types";

/** Helpers used by the analysis overview card (kept out of SessionTelemetry chunk). */
export function telemetryOverviewFromTraces(
  traces: TelemetryTracesResponse | undefined | null,
): {
  topSpeedKmh: number | null;
  avgBrakePct: number | null;
  highestGear: number | null;
  topGearDistancePct: number | null;
} {
  if (!traces || traces.speedKmh.length === 0) {
    return {
      topSpeedKmh: null,
      avgBrakePct: null,
      highestGear: null,
      topGearDistancePct: null,
    };
  }
  let top = -Infinity;
  for (const v of traces.speedKmh) {
    if (Number.isFinite(v) && v > top) top = v;
  }
  let brakeSum = 0;
  let brakeN = 0;
  for (const v of traces.brakePct) {
    if (Number.isFinite(v)) {
      brakeSum += v;
      brakeN += 1;
    }
  }

  let highestGear: number | null = null;
  const gears = traces.gear ?? [];
  for (const g of gears) {
    if (typeof g === "number" && Number.isFinite(g) && g > 0) {
      if (highestGear == null || g > highestGear) highestGear = g;
    }
  }

  let topGearDistancePct: number | null = null;
  const dist = traces.distanceM ?? [];
  if (highestGear != null && dist.length >= 2 && gears.length === dist.length) {
    let total = 0;
    let inTop = 0;
    for (let i = 1; i < dist.length; i++) {
      const d0 = dist[i - 1]!;
      const d1 = dist[i]!;
      if (!Number.isFinite(d0) || !Number.isFinite(d1) || d1 <= d0) continue;
      const delta = d1 - d0;
      total += delta;
      const g = gears[i]!;
      if (g === highestGear) inTop += delta;
    }
    if (total > 0) {
      topGearDistancePct = (inTop / total) * 100;
    }
  }

  return {
    topSpeedKmh: Number.isFinite(top) ? top : null,
    avgBrakePct: brakeN > 0 ? brakeSum / brakeN : null,
    highestGear,
    topGearDistancePct,
  };
}

export function aggregateTyreWearPct(
  summary: TelemetrySummaryResponse | undefined | null,
): number | null {
  const rows = summary?.tyres?.perLap ?? [];
  const wears: number[] = [];
  for (const row of rows) {
    const w = row.wear;
    if (!w) continue;
    for (const v of [w.lf, w.rf, w.lr, w.rr]) {
      if (typeof v === "number" && Number.isFinite(v)) wears.push(v);
    }
  }
  if (wears.length === 0) return null;
  return wears.reduce((a, b) => a + b, 0) / wears.length;
}
