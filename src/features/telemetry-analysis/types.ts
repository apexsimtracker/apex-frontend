export type TelemetryEligibilityReason =
  | "MANUAL_SESSION"
  | "NOT_PRO"
  | "NO_DATA";

export type TelemetryLapSummary = {
  lapNumber: number;
  lapTimeMs: number;
  isValid: boolean;
  isBestLap: boolean;
  hasTraces: boolean;
  hasFuel: boolean;
  hasTyres: boolean;
  stintIndex?: number;
  isOutLap?: boolean;
};

export type TelemetrySummaryResponse = {
  eligible: boolean;
  eligibilityReason?: TelemetryEligibilityReason;
  hasProAccess: boolean;
  simKey: string;
  defaultLapNumber: number | null;
  laps: TelemetryLapSummary[];
  fuel: {
    tankCapacityL: number | null;
    avgFuelPerLapL: number | null;
    /** Projected remaining laps from current fuel / avg (preferred by UI). */
    projectedLaps?: number | null;
    /** Legacy: laps on a full tank. */
    projectedLapsFromFull: number | null;
    perLap: Array<{
      lapNumber: number;
      fuelLevelL: number | null;
      fuelUsedL: number | null;
    }>;
  } | null;
  tyres: {
    perLap: Array<{
      lapNumber: number;
      corners: { lf?: number; rf?: number; lr?: number; rr?: number };
      frontAvg: number | null;
      rearAvg: number | null;
      wear?: { lf?: number; rf?: number; lr?: number; rr?: number };
    }>;
  } | null;
  sessionMeta: {
    fuelTankCapacityL?: number;
    airTempC?: number;
    trackTempC?: number;
    humidityPct?: number;
    trackLengthKm?: number;
    sessionStartedAt?: string;
  } | null;
};

export type TelemetryTracesResponse = {
  lapNumber: number;
  compareLapNumber?: number;
  lapTimeMs: number;
  isValid: boolean;
  isBestLap: boolean;
  distanceM: number[];
  speedKmh: number[];
  throttlePct: number[];
  brakePct: number[];
  gear: number[];
  steeringDeg?: number[];
  rpm?: number[];
  clutchPct?: number[];
  deltaMs?: number[];
};
