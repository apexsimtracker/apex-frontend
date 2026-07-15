/**
 * V2-only form schema for the forked Manual Entry (`/v2/manual`) page.
 *
 * Backend-bound fields (sim, track, car, session kind, position, grid size,
 * qualifying position, lap times, notes, conditions, per-lap sectors) are
 * validated here and submitted via ManualActivityFormV2 → POST manual-activity.
 *
 * The core object subset (sim/track/car/kind/positions/lapTime/notes) still
 * delegates to `createManualActivityFormSchema` so create rules stay aligned
 * with V1 for those fields.
 */
import { z } from "zod";
import {
  createManualActivityFormSchema,
  LAP_FORMAT_MSG,
} from "@/lib/validation/manualActivity";

/** Track conditions persisted on Session.conditions. */
export const MANUAL_V2_CONDITIONS = [
  { value: "DRY" as const, label: "Dry" },
  { value: "WET" as const, label: "Wet" },
  { value: "MIXED" as const, label: "Mixed" },
];

export type ManualV2Condition = "DRY" | "WET" | "MIXED";

const SECTOR_FORMAT_MSG =
  "Use ss.mmm (e.g. 26.452) or m:ss.mmm — three-digit milliseconds.";

/**
 * Parse a frontend-only sector time (`s1`/`s2`/`s3`) to milliseconds.
 *
 * Same `ss.mmm` / `m:ss.mmm` shape as strict lap times (exactly 3 ms digits,
 * comma→dot), but deliberately does NOT reuse `parseStrictManualLapTimeToMs`:
 * that parser enforces the full-lap floor (`MANUAL_LAP_MS_MIN` = 10s), which
 * would reject a legitimately-formatted sub-10s sector like "9.876".
 * Returns null for empty, partial, or invalid input (never throws).
 */
export function parseSectorTimeToMs(input: string): number | null {
  const s = input.trim().replace(",", ".");
  if (!s) return null;

  const withColon = /^(\d+):([0-5]\d)\.(\d{3})$/;
  const secondsOnly = /^(\d+)\.(\d{3})$/;

  const m1 = s.match(withColon);
  if (m1) {
    const total =
      parseInt(m1[1]!, 10) * 60_000 +
      parseInt(m1[2]!, 10) * 1_000 +
      parseInt(m1[3]!, 10);
    return Number.isFinite(total) && total > 0 ? total : null;
  }

  const m2 = s.match(secondsOnly);
  if (m2) {
    const total = parseInt(m2[1]!, 10) * 1_000 + parseInt(m2[2]!, 10);
    return Number.isFinite(total) && total > 0 ? total : null;
  }

  return null;
}

/** Frontend-only sector-time format check (UX validation for `s1`/`s2`/`s3`). */
export function isValidSectorTimeFormat(input: string): boolean {
  return parseSectorTimeToMs(input) != null;
}

const v2LapRowSchema = z.object({
  lapTime: z.string(),
  /** Optional sector times mapped to Lap.sector1/2/3Ms on submit. */
  s1: z.string(),
  s2: z.string(),
  s3: z.string(),
});

export function createManualActivityV2FormSchema(
  telemetryMinLapRows?: number | null,
) {
  const coreSchema = createManualActivityFormSchema(telemetryMinLapRows);

  return z
    .object({
      sim: z.string(),
      trackId: z.string(),
      carId: z.string(),
      manualSessionKind: z.string(),
      position: z.string(),
      totalDrivers: z.string(),
      qualifyingPosition: z.string(),
      laps: z.array(v2LapRowSchema),
      notes: z.string(),
      /** Persisted as Session.conditions. */
      conditions: z.enum(["DRY", "WET", "MIXED"]),
    })
    .superRefine((data, ctx) => {
      // Delegate shared validation to the V1 schema so create rules (positions,
      // grid size, lap format, caps) stay identical. Paths align 1:1.
      const coreResult = coreSchema.safeParse({
        sim: data.sim,
        trackId: data.trackId,
        carId: data.carId,
        manualSessionKind: data.manualSessionKind,
        position: data.position,
        totalDrivers: data.totalDrivers,
        qualifyingPosition: data.qualifyingPosition,
        laps: data.laps.map((row) => ({ lapTime: row.lapTime })),
        notes: data.notes,
      });
      if (!coreResult.success) {
        // Re-emit shared validation issues, preserving message + field path so
        // errors surface on the matching V2 inputs (lap indices align 1:1).
        for (const issue of coreResult.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: issue.path,
          });
        }
      }

      // Sector-time format validation (optional fields; empty is OK).
      data.laps.forEach((row, i) => {
        (["s1", "s2", "s3"] as const).forEach((sector) => {
          const raw = row[sector]?.trim() ?? "";
          if (!raw) return;
          if (!isValidSectorTimeFormat(raw)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: SECTOR_FORMAT_MSG,
              path: ["laps", i, sector],
            });
          }
        });
      });
    });
}

export const manualActivityV2FormSchema = createManualActivityV2FormSchema();

export type ManualActivityV2FormValues = z.infer<
  typeof manualActivityV2FormSchema
>;

export { LAP_FORMAT_MSG };
