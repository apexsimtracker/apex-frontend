import { describe, expect, it } from "vitest";
import {
  parseApexAnalysisDisplay,
  parseApexAnalysisV2Payload,
  parseApexFeedHeadline,
} from "./apexAnalysisDisplay";
import { parseSessionDetailApiResponse } from "./sessionDetailData";

describe("parseApexAnalysisDisplay", () => {
  it("reads insights from PRO gated object", () => {
    const result = parseApexAnalysisDisplay({
      locked: false,
      insights: ["Strong stint pace.", "Lap-time variance: 0.3s."],
    });
    expect(result.locked).toBe(false);
    expect(result.legacyInsights).toEqual([
      "Strong stint pace.",
      "Lap-time variance: 0.3s.",
    ]);
  });

  it("returns empty insights when payload is null", () => {
    expect(parseApexAnalysisDisplay(null).legacyInsights).toEqual([]);
  });

  it("reads FREE locked payload", () => {
    const result = parseApexAnalysisDisplay({
      locked: true,
      message: "Unlock Apex Analysis with Apex Pro",
    });
    expect(result.locked).toBe(true);
    expect(result.legacyInsights).toEqual([]);
  });

  it("prefers a valid V2 diagnostic and strips unknown evidence", () => {
    const result = parseApexAnalysisDisplay(
      { locked: false, insights: ["Legacy insight"] },
      {
        locked: false,
        result: {
          schemaVersion: 2,
          engineVersion: "diagnostic-2",
          generatedAt: "2026-09-15T10:00:00.000Z",
          status: "READY",
          targetLapNumber: 7,
          diagnostics: { eligibilityReason: "must stay internal" },
          insight: {
            id: "insight-1",
            kind: "SECTOR_FALLBACK",
            headline: "Protect the middle sector",
            explanation: "Most of the repeatable loss is in sector 4.",
            action: "Prioritize a clean exit.",
            confidence: "MEDIUM",
            sectorIndex: 4,
            evidence: [
              {
                type: "SECTOR",
                sectorIndex: 4,
                targetMs: 23100,
                baselineMs: 22600,
                deltaMs: 500,
                timingSource: "IRACING_NATIVE",
              },
              { type: "INTERNAL_DIAGNOSTIC", secret: "not user-visible" },
            ],
          },
        },
      },
    );

    expect(result.source).toBe("v2");
    expect(result.targetLapNumber).toBe(7);
    expect(result.insight?.headline).toBe("Protect the middle sector");
    expect(result.insight?.evidence).toEqual([
      {
        type: "SECTOR",
        sectorIndex: 4,
        targetMs: 23100,
        baselineMs: 22600,
        deltaMs: 500,
        timingSource: "IRACING_NATIVE",
      },
    ]);
    expect(JSON.stringify(result)).not.toContain("must stay internal");
    expect(JSON.stringify(result)).not.toContain("secret");
  });

  it("falls back to legacy when V2 is malformed", () => {
    const result = parseApexAnalysisDisplay(
      { locked: false, insights: ["Legacy survives"] },
      { locked: false, result: { schemaVersion: 99 } },
    );
    expect(result.source).toBe("legacy");
    expect(result.legacyInsights[0]).toBe("Legacy survives");
  });

  it("keeps safe non-ready statuses without exposing diagnostics", () => {
    const parsed = parseApexAnalysisV2Payload({
      locked: false,
      result: {
        schemaVersion: 2,
        engineVersion: "2.0",
        generatedAt: "2026-09-15T10:00:00.000Z",
        status: "FAILED",
        targetLapNumber: null,
        insight: null,
        diagnostics: { exception: "database details" },
      },
    });
    expect(parsed?.locked === false ? parsed.result?.status : null).toBe(
      "FAILED",
    );
    expect(JSON.stringify(parsed)).not.toContain("database details");
  });

  it("accepts backend braking and trend evidence shapes", () => {
    const parsed = parseApexAnalysisV2Payload({
      locked: false,
      result: {
        schemaVersion: 2,
        engineVersion: "2.0",
        generatedAt: "2026-09-15T10:00:00.000Z",
        status: "READY",
        targetLapNumber: 5,
        insight: {
          id: "braking-1",
          kind: "CORNER_DIAGNOSTIC",
          headline: "Release the brake sooner",
          explanation: "The comparison shows a slower minimum speed.",
          action: "Use a smoother release.",
          confidence: "HIGH",
          evidence: [
            {
              type: "BRAKING_ZONE",
              targetLapNumber: 5,
              referenceLapNumber: 3,
              distanceStartM: 100,
              distanceEndM: 180,
              targetBrakeOnsetM: 112,
              referenceBrakeOnsetM: 118,
              targetMinimumSpeedKmh: 82,
              referenceMinimumSpeedKmh: 87,
              targetExitSpeedKmh: 103,
              referenceExitSpeedKmh: 108,
              zoneDeltaMs: 240,
            },
            {
              type: "SESSION_TREND",
              metric: "BEST_LAP",
              changeMs: -300,
              observations: [
                {
                  sessionId: "not-projected-to-ui",
                  occurredAt: "2026-09-01T10:00:00.000Z",
                  bestLapMs: 90000,
                  consistencyScore: 91,
                },
              ],
            },
            {
              type: "SESSION_SUMMARY",
              firstLapNumber: 2,
              firstLapMs: 91000,
              bestLapNumber: 5,
              bestLapMs: 90000,
              improvementMs: 1000,
            },
          ],
        },
      },
    });
    const evidence =
      parsed?.locked === false ? parsed.result?.insight?.evidence : [];
    expect(evidence?.map((item) => item.type)).toEqual([
      "BRAKING_ZONE",
      "SESSION_TREND",
      "SESSION_SUMMARY",
    ]);
    expect(JSON.stringify(evidence)).not.toContain("not-projected-to-ui");
  });

  it("prefers the V2 feed headline and preserves legacy fallback", () => {
    expect(
      parseApexFeedHeadline(
        {
          locked: false,
          summary: {
            headline: "Brake earlier at Turn 4",
            kind: "CORNER_DIAGNOSTIC",
            confidence: "HIGH",
          },
        },
        { locked: false, insights: ["Legacy"] },
      ),
    ).toBe("Brake earlier at Turn 4");
    expect(
      parseApexFeedHeadline(null, {
        locked: false,
        insights: ["Legacy"],
      }),
    ).toBe("Legacy");
  });

  it("extracts the additive V2 sibling from session detail", () => {
    const parsed = parseSessionDetailApiResponse({
      session: { id: "session-1", track: "Spa", car: "GT3" },
      apexAnalysis: { locked: false, insights: ["Legacy"] },
      apexAnalysisV2: {
        locked: false,
        result: {
          schemaVersion: 2,
          engineVersion: "2.0",
          generatedAt: "2026-09-15T10:00:00.000Z",
          status: "INSUFFICIENT_DATA",
          targetLapNumber: null,
          insight: null,
        },
      },
    });
    expect(
      parsed.apexAnalysisV2?.locked === false
        ? parsed.apexAnalysisV2.result?.status
        : null,
    ).toBe("INSUFFICIENT_DATA");
  });
});
