/**
 * Builds {@link ManualActivityInitialData} for the shared ManualActivityForm used by
 * `/sessions/:id/edit` and admin session detail.
 */
import type { ManualActivityInitialData } from "@/components/ManualActivityForm";
import type { ManualActivitySim } from "@/lib/manualActivityData";
import { telemetrySessionTypeToFormKind } from "@/lib/sessionEditMapping";
import { effectiveQualifyingPosition } from "@/lib/sessionKind";
import type { AdminSessionDetail } from "@/lib/api/adminSessions";

export type ManualActivityLapSectorsMs = {
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
};

/** V2 edit prefill: V1 initial data plus optional per-lap sectors aligned with `lapsMs`. */
export type ManualActivityEditInitialData = ManualActivityInitialData & {
  lapsSectorsMs?: Array<ManualActivityLapSectorsMs | null> | null;
  /** Parallel to `lapsMs`: true when the lap is an iRacing out-lap. */
  lapsIsOutLap?: boolean[] | null;
  /** Out-laps are editable only when all real sectors and driving telemetry exist. */
  lapsCanEditOutLap?: boolean[] | null;
};

/** Session GET `/api/sessions/:id` payload used by EditActivity (subset). */
export type PublicSessionDetailForEdit = {
  simKey?: string | null;
  track?: string | null;
  catalogTrackId?: string | null;
  car?: string | null;
  catalogCarId?: string | null;
  trackName?: string | null;
  carName?: string | null;
  vehicleDisplay?: string | null;
  position?: number | null;
  totalDrivers?: number | null;
  qualifyingPosition?: number | null;
  manualSessionKind?: string | null;
  bestLapMs?: number | null;
  sessionType?: string | null;
  notes?: string | null;
  conditions?: "DRY" | "WET" | "MIXED" | null;
  laps?: Array<{
    lap?: number;
    timeMs?: number;
    lapTimeMs?: number;
    isOutLap?: boolean;
    hasTelemetryData?: boolean;
    canEditOutLap?: boolean;
    sector1Ms?: number | null;
    sector2Ms?: number | null;
    sector3Ms?: number | null;
  }>;
  lapCount?: number | null;
};

/**
 * Maps API/sim keys (`iracing`, `IRACING`, `f1_25`, `lmu`, …) to ManualActivityForm sim values.
 * Must cover every {@link ManualActivitySim}; unknown keys default to iRacing for backwards compatibility.
 */
export function simKeyToFormSim(
  k: string | undefined | null,
): ManualActivitySim {
  const u = (k ?? "").toLowerCase().replace(/-/g, "_");
  if (u === "f1_25" || u === "f125") return "F1_25";
  if (u === "lmu") return "LMU";
  if (u === "iracing") return "IRACING";
  return "IRACING";
}

function finiteOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function manualActivityInitialFromPublicDetail(
  data: PublicSessionDetailForEdit,
): ManualActivityEditInitialData {
  const lapsRaw = Array.isArray(data.laps) ? data.laps : [];
  const orderedLaps = [...lapsRaw]
    .filter((l) => l && typeof (l.timeMs ?? l.lapTimeMs) === "number")
    .sort((a, b) => (a.lap ?? 0) - (b.lap ?? 0));

  const lapsMs = orderedLaps.map((l) => Number(l.timeMs ?? l.lapTimeMs));
  const lapsSectorsMs: ManualActivityLapSectorsMs[] = orderedLaps.map((l) => ({
    sector1Ms: finiteOrNull(l.sector1Ms),
    sector2Ms: finiteOrNull(l.sector2Ms),
    sector3Ms: finiteOrNull(l.sector3Ms),
  }));
  const lapsIsOutLap = orderedLaps.map((l) => l.isOutLap === true);
  const lapsCanEditOutLap = orderedLaps.map(
    (l) =>
      l.isOutLap === true &&
      (l.canEditOutLap === true ||
        (l.hasTelemetryData === true &&
          finiteOrNull(l.sector1Ms) != null &&
          finiteOrNull(l.sector2Ms) != null &&
          finiteOrNull(l.sector3Ms) != null)),
  );

  const lapCountFromApi =
    typeof data.lapCount === "number" && Number.isFinite(data.lapCount)
      ? data.lapCount
      : 0;
  const telemetryMinLapRows =
    Math.max(lapsMs.length, lapCountFromApi) > 0
      ? Math.max(lapsMs.length, lapCountFromApi)
      : undefined;

  const st = String(data.sessionType ?? "").toUpperCase();

  let manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE";
  if (st === "MANUAL_ACTIVITY") {
    const k = String(data.manualSessionKind ?? "RACE").toUpperCase();
    manualSessionKind =
      k === "PRACTICE" || k === "QUALIFY" || k === "RACE" ? k : "RACE";
  } else {
    manualSessionKind = telemetrySessionTypeToFormKind(data.sessionType);
  }

  return {
    sim: simKeyToFormSim(data.simKey),
    catalogTrackId: data.catalogTrackId ?? data.track ?? "",
    catalogCarId: data.catalogCarId ?? "",
    trackNameHint: data.trackName ?? null,
    carNameHint: data.carName ?? data.vehicleDisplay ?? null,
    manualSessionKind,
    position:
      manualSessionKind === "QUALIFY"
        ? (effectiveQualifyingPosition({
            sessionType: data.sessionType,
            manualSessionKind,
            qualifyingPosition: data.qualifyingPosition,
            position: data.position,
          }) ?? data.position)
        : data.position,
    totalDrivers: data.totalDrivers,
    qualifyingPosition: data.qualifyingPosition,
    lapsMs: lapsMs.length > 0 ? lapsMs : undefined,
    lapsSectorsMs: lapsMs.length > 0 ? lapsSectorsMs : undefined,
    lapsIsOutLap: lapsMs.length > 0 ? lapsIsOutLap : undefined,
    lapsCanEditOutLap: lapsMs.length > 0 ? lapsCanEditOutLap : undefined,
    bestLapMs: lapsMs.length === 0 ? data.bestLapMs : undefined,
    notes: data.notes,
    conditions:
      data.conditions === "DRY" ||
      data.conditions === "WET" ||
      data.conditions === "MIXED"
        ? data.conditions
        : null,
    telemetryMinLapRows,
  };
}

export function manualActivityInitialFromAdminDetail(
  d: AdminSessionDetail,
): ManualActivityInitialData {
  const lapsMs = d.laps
    .slice()
    .sort((a, b) => a.lapNumber - b.lapNumber)
    .map((l) => l.lapTimeMs);

  const telemetryMinLapRows = d.laps.length > 0 ? d.laps.length : undefined;

  const st = String(d.sessionType ?? "").toUpperCase();

  let manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE";
  if (st === "MANUAL_ACTIVITY") {
    const k = String(d.manualSessionKind ?? "RACE").toUpperCase();
    manualSessionKind =
      k === "PRACTICE" || k === "QUALIFY" || k === "RACE" ? k : "RACE";
  } else {
    manualSessionKind = telemetrySessionTypeToFormKind(d.sessionType);
  }

  return {
    sim: simKeyToFormSim(d.sim),
    catalogTrackId: d.track,
    catalogCarId: d.car,
    trackNameHint: null,
    carNameHint: null,
    manualSessionKind,
    position:
      manualSessionKind === "QUALIFY"
        ? (effectiveQualifyingPosition({
            sessionType: d.sessionType,
            manualSessionKind,
            qualifyingPosition: d.qualifyingPosition,
            position: d.position,
          }) ?? d.position)
        : d.position,
    totalDrivers: d.totalDrivers,
    qualifyingPosition: d.qualifyingPosition,
    lapsMs: lapsMs.length > 0 ? lapsMs : undefined,
    notes: undefined,
    telemetryMinLapRows,
  };
}
