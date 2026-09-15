export type ApexAnalysisPayload =
  { locked: true; message: string } | { locked: false; insights: string[] };

/** Matches GET /api/sessions/:id `apexAnalysis` after subscription + owner gating. */

export type ApexAnalysisConfidence = "HIGH" | "MEDIUM" | "LOW";
export type ApexAnalysisInsightKind =
  "CORNER_DIAGNOSTIC" | "SESSION_TREND" | "SECTOR_FALLBACK";

export type ApexBrakingZoneEvidence = {
  type: "BRAKING_ZONE";
  targetLapNumber: number;
  referenceLapNumber: number;
  distanceStartM: number;
  distanceEndM: number;
  targetBrakeOnsetM: number;
  referenceBrakeOnsetM: number;
  targetMinimumSpeedKmh: number;
  referenceMinimumSpeedKmh: number;
  targetExitSpeedKmh: number;
  referenceExitSpeedKmh: number;
  zoneDeltaMs: number;
};

export type ApexSessionTrendEvidence = {
  type: "SESSION_TREND";
  metric: "BEST_LAP" | "CONSISTENCY";
  changeMs?: number;
  changePct?: number;
  changePoints?: number;
  observations: Array<{
    occurredAt: string;
    bestLapMs: number;
    consistencyScore: number | null;
  }>;
};

export type ApexSectorEvidence = {
  type: "SECTOR";
  sectorIndex: number;
  targetMs: number;
  baselineMs: number;
  deltaMs: number;
  timingSource: string;
};

export type ApexSessionSummaryEvidence = {
  type: "SESSION_SUMMARY";
  firstLapNumber: number;
  firstLapMs: number;
  bestLapNumber: number;
  bestLapMs: number;
  improvementMs: number;
};

export type ApexEvidence =
  | ApexBrakingZoneEvidence
  | ApexSessionTrendEvidence
  | ApexSectorEvidence
  | ApexSessionSummaryEvidence;

export type ApexCoachingInsight = {
  id: string;
  kind: ApexAnalysisInsightKind;
  headline: string;
  explanation: string;
  action: string;
  confidence: ApexAnalysisConfidence;
  evidence: ApexEvidence[];
  sectorIndex?: number;
  corner?: {
    id?: string;
    name?: string;
    distanceStartM?: number;
    distanceEndM?: number;
  };
};

export type ApexAnalysisResultV2 = {
  schemaVersion: 2;
  engineVersion: string;
  generatedAt: string;
  status: "READY" | "INSUFFICIENT_DATA" | "FAILED";
  targetLapNumber: number | null;
  reference?: {
    kind: "PRIOR_PERSONAL_BEST";
    sessionId: string;
    lapNumber: number;
    lapTimeMs: number;
  };
  insight: ApexCoachingInsight | null;
};

export type ApexAnalysisV2Payload =
  | { locked: true; message: string }
  | { locked: false; result: ApexAnalysisResultV2 | null };

export type ApexAnalysisV2FeedPayload = {
  locked: false;
  summary: {
    headline: string;
    kind: string;
    confidence: string;
  };
};

export type ApexAnalysisDisplay = {
  locked: boolean;
  message?: string;
  source: "v2" | "legacy" | "none";
  status: ApexAnalysisResultV2["status"] | null;
  targetLapNumber: number | null;
  insight: ApexCoachingInsight | null;
  legacyInsights: string[];
};

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = finiteNumber(value);
  return parsed != null && Number.isInteger(parsed) && parsed > 0
    ? parsed
    : null;
}

function parseEvidence(value: unknown): ApexEvidence | null {
  const raw = record(value);
  const type = text(raw?.type ?? raw?.kind);
  if (!raw || !type) return null;

  if (type === "SESSION_TREND") {
    const metric =
      raw.metric === "BEST_LAP" || raw.metric === "CONSISTENCY"
        ? raw.metric
        : null;
    const observations = Array.isArray(raw.observations)
      ? raw.observations
          .map((item) => {
            const observation = record(item);
            const occurredAt = text(observation?.occurredAt);
            const bestLapMs = finiteNumber(observation?.bestLapMs);
            const consistencyScore =
              observation?.consistencyScore == null
                ? null
                : finiteNumber(observation.consistencyScore);
            return occurredAt &&
              bestLapMs != null &&
              (observation?.consistencyScore == null ||
                consistencyScore != null)
              ? { occurredAt, bestLapMs, consistencyScore }
              : null;
          })
          .filter(
            (
              item,
            ): item is {
              occurredAt: string;
              bestLapMs: number;
              consistencyScore: number | null;
            } => item != null,
          )
      : [];
    if (!metric || observations.length === 0) return null;
    const changeMs = finiteNumber(raw.changeMs);
    const changePct = finiteNumber(raw.changePct);
    const changePoints = finiteNumber(raw.changePoints);
    return {
      type,
      metric,
      observations,
      ...(changeMs != null ? { changeMs } : {}),
      ...(changePct != null ? { changePct } : {}),
      ...(changePoints != null ? { changePoints } : {}),
    };
  }

  if (type === "SECTOR") {
    const sectorIndex = positiveInteger(raw.sectorIndex);
    const targetMs = finiteNumber(raw.targetMs);
    const baselineMs = finiteNumber(raw.baselineMs);
    const deltaMs = finiteNumber(raw.deltaMs);
    const timingSource = text(raw.timingSource);
    return sectorIndex != null &&
      targetMs != null &&
      baselineMs != null &&
      deltaMs != null &&
      timingSource
      ? { type, sectorIndex, targetMs, baselineMs, deltaMs, timingSource }
      : null;
  }

  if (type === "SESSION_SUMMARY") {
    const firstLapNumber = positiveInteger(raw.firstLapNumber);
    const firstLapMs = finiteNumber(raw.firstLapMs);
    const bestLapNumber = positiveInteger(raw.bestLapNumber);
    const bestLapMs = finiteNumber(raw.bestLapMs);
    const improvementMs = finiteNumber(raw.improvementMs);
    return firstLapNumber != null &&
      firstLapMs != null &&
      bestLapNumber != null &&
      bestLapMs != null &&
      improvementMs != null
      ? {
          type,
          firstLapNumber,
          firstLapMs,
          bestLapNumber,
          bestLapMs,
          improvementMs,
        }
      : null;
  }

  if (type === "BRAKING_ZONE") {
    const targetLapNumber = positiveInteger(raw.targetLapNumber);
    const referenceLapNumber = positiveInteger(raw.referenceLapNumber);
    const distanceStartM = finiteNumber(raw.distanceStartM);
    const distanceEndM = finiteNumber(raw.distanceEndM);
    const targetBrakeOnsetM = finiteNumber(raw.targetBrakeOnsetM);
    const referenceBrakeOnsetM = finiteNumber(raw.referenceBrakeOnsetM);
    const targetMinimumSpeedKmh = finiteNumber(raw.targetMinimumSpeedKmh);
    const referenceMinimumSpeedKmh = finiteNumber(raw.referenceMinimumSpeedKmh);
    const targetExitSpeedKmh = finiteNumber(raw.targetExitSpeedKmh);
    const referenceExitSpeedKmh = finiteNumber(raw.referenceExitSpeedKmh);
    const zoneDeltaMs = finiteNumber(raw.zoneDeltaMs);
    return targetLapNumber != null &&
      referenceLapNumber != null &&
      distanceStartM != null &&
      distanceEndM != null &&
      targetBrakeOnsetM != null &&
      referenceBrakeOnsetM != null &&
      targetMinimumSpeedKmh != null &&
      referenceMinimumSpeedKmh != null &&
      targetExitSpeedKmh != null &&
      referenceExitSpeedKmh != null &&
      zoneDeltaMs != null
      ? {
          type,
          targetLapNumber,
          referenceLapNumber,
          distanceStartM,
          distanceEndM,
          targetBrakeOnsetM,
          referenceBrakeOnsetM,
          targetMinimumSpeedKmh,
          referenceMinimumSpeedKmh,
          targetExitSpeedKmh,
          referenceExitSpeedKmh,
          zoneDeltaMs,
        }
      : null;
  }

  return null;
}

function parseInsight(value: unknown): ApexCoachingInsight | null {
  const raw = record(value);
  if (!raw) return null;
  const id = text(raw.id);
  const kind = text(raw.kind);
  const headline = text(raw.headline);
  const explanation = text(raw.explanation);
  const action = text(raw.action);
  const confidence = text(raw.confidence);
  if (
    !id ||
    !headline ||
    !explanation ||
    !action ||
    !["CORNER_DIAGNOSTIC", "SESSION_TREND", "SECTOR_FALLBACK"].includes(
      kind ?? "",
    ) ||
    !["HIGH", "MEDIUM", "LOW"].includes(confidence ?? "")
  ) {
    return null;
  }

  const cornerRaw = record(raw.corner);
  const corner = cornerRaw
    ? {
        ...(text(cornerRaw.id) ? { id: text(cornerRaw.id)! } : {}),
        ...(text(cornerRaw.name) ? { name: text(cornerRaw.name)! } : {}),
        ...(finiteNumber(cornerRaw.distanceStartM) != null
          ? { distanceStartM: finiteNumber(cornerRaw.distanceStartM)! }
          : {}),
        ...(finiteNumber(cornerRaw.distanceEndM) != null
          ? { distanceEndM: finiteNumber(cornerRaw.distanceEndM)! }
          : {}),
      }
    : undefined;
  const sectorIndex = positiveInteger(raw.sectorIndex);

  return {
    id,
    kind: kind as ApexAnalysisInsightKind,
    headline,
    explanation,
    action,
    confidence: confidence as ApexAnalysisConfidence,
    evidence: Array.isArray(raw.evidence)
      ? raw.evidence
          .map(parseEvidence)
          .filter((item): item is ApexEvidence => item != null)
      : [],
    ...(sectorIndex != null ? { sectorIndex } : {}),
    ...(corner && Object.keys(corner).length > 0 ? { corner } : {}),
  };
}

export function parseApexAnalysisV2Payload(
  value: unknown,
): ApexAnalysisV2Payload | null {
  const payload = record(value);
  if (!payload || typeof payload.locked !== "boolean") return null;
  if (payload.locked) {
    const message = text(payload.message);
    return message ? { locked: true, message } : null;
  }
  if (payload.result == null) return { locked: false, result: null };

  const raw = record(payload.result);
  const engineVersion = text(raw?.engineVersion);
  const generatedAt = text(raw?.generatedAt);
  const status = text(raw?.status);
  if (
    !raw ||
    raw.schemaVersion !== 2 ||
    !engineVersion ||
    !generatedAt ||
    Number.isNaN(new Date(generatedAt).getTime()) ||
    !["READY", "INSUFFICIENT_DATA", "FAILED"].includes(status ?? "")
  ) {
    return null;
  }

  const targetLapNumber =
    raw.targetLapNumber == null ? null : positiveInteger(raw.targetLapNumber);
  if (raw.targetLapNumber != null && targetLapNumber == null) return null;

  const referenceRaw = record(raw.reference);
  const reference =
    referenceRaw?.kind === "PRIOR_PERSONAL_BEST" &&
    text(referenceRaw.sessionId) &&
    positiveInteger(referenceRaw.lapNumber) != null &&
    finiteNumber(referenceRaw.lapTimeMs) != null
      ? {
          kind: "PRIOR_PERSONAL_BEST" as const,
          sessionId: text(referenceRaw.sessionId)!,
          lapNumber: positiveInteger(referenceRaw.lapNumber)!,
          lapTimeMs: finiteNumber(referenceRaw.lapTimeMs)!,
        }
      : undefined;
  if (raw.reference != null && !reference) return null;
  const insight = parseInsight(raw.insight);
  if (
    (status === "READY" && !insight) ||
    (status !== "READY" && raw.insight != null)
  ) {
    return null;
  }

  return {
    locked: false,
    result: {
      schemaVersion: 2,
      engineVersion,
      generatedAt,
      status: status as ApexAnalysisResultV2["status"],
      targetLapNumber,
      ...(reference ? { reference } : {}),
      insight,
    },
  };
}

function parseLegacyPayload(value: unknown): ApexAnalysisPayload | null {
  const payload = record(value);
  if (!payload || typeof payload.locked !== "boolean") return null;
  if (payload.locked) {
    const message = text(payload.message);
    return message ? { locked: true, message } : null;
  }
  const insights = Array.isArray(payload.insights)
    ? payload.insights.map(text).filter((item): item is string => item != null)
    : [];
  return { locked: false, insights };
}

export function parseApexAnalysisDisplay(
  legacyPayload: unknown,
  v2Payload?: unknown,
): ApexAnalysisDisplay {
  const v2 = parseApexAnalysisV2Payload(v2Payload);
  if (v2?.locked === true) {
    return {
      locked: true,
      message: v2.message,
      source: "v2",
      status: null,
      targetLapNumber: null,
      insight: null,
      legacyInsights: [],
    };
  }
  if (v2?.locked === false) {
    return {
      locked: false,
      source: "v2",
      status: v2.result?.status ?? null,
      targetLapNumber: v2.result?.targetLapNumber ?? null,
      insight: v2.result?.insight ?? null,
      legacyInsights: [],
    };
  }

  const legacy = parseLegacyPayload(legacyPayload);
  if (legacy?.locked === true) {
    return {
      locked: true,
      message: legacy.message,
      source: "legacy",
      status: null,
      targetLapNumber: null,
      insight: null,
      legacyInsights: [],
    };
  }
  return {
    locked: false,
    source: legacy?.locked === false ? "legacy" : "none",
    status: null,
    targetLapNumber: null,
    insight: null,
    legacyInsights: legacy?.locked === false ? legacy.insights : [],
  };
}

export function parseApexFeedHeadline(
  v2Payload: unknown,
  legacyPayload: unknown,
): string | null {
  const v2 = record(v2Payload);
  const summary = record(v2?.summary);
  if (v2?.locked === false) {
    const headline = text(summary?.headline);
    if (headline) return headline;
  }
  const legacy = parseLegacyPayload(legacyPayload);
  return legacy?.locked === false ? (legacy.insights[0] ?? null) : null;
}
