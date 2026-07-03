/**
 * V2-only form schema for the forked Manual Entry (`/v2/manual`) page.
 *
 * The backend-bound fields (sim, track, car, session kind, position, grid size,
 * qualifying position, lap times, notes) reuse the shared V1 validation from
 * `createManualActivityFormSchema` verbatim — the core object subset is delegated
 * to that schema so create/submit behaviour stays identical to V1.
 *
 * FRONTEND-ONLY FIELDS (NOT linked to the backend):
 *   - `conditions` (Dry / Wet / Mixed)
 *   - per-lap sector times `s1` / `s2` / `s3`
 * These come from the Loveable manual-entry design. They are validated client-side
 * for UX only and MUST NOT be sent to the API (see ManualActivityFormV2 `handleValid`).
 * When the backend gains support for these, reconcile here and in the submit payload.
 */
import { z } from "zod";
import {
  createManualActivityFormSchema,
  LAP_FORMAT_MSG,
} from "@/lib/validation/manualActivity";

/** Frontend-only track conditions (not persisted to the backend). */
export const MANUAL_V2_CONDITIONS = [
  { value: "DRY" as const, label: "Dry" },
  { value: "WET" as const, label: "Wet" },
  { value: "MIXED" as const, label: "Mixed" },
];

export type ManualV2Condition = "DRY" | "WET" | "MIXED";

const SECTOR_FORMAT_MSG =
  "Use ss.mmm (e.g. 26.452) or m:ss.mmm — three-digit milliseconds.";

/**
 * Frontend-only sector-time format check (UX validation for `s1`/`s2`/`s3`).
 *
 * We deliberately do NOT reuse `parseStrictManualLapTimeToMs`: that parser
 * enforces the full-lap floor (`MANUAL_LAP_MS_MIN` = 10s), which would reject a
 * legitimately-formatted sub-10s sector like "9.876" and surface a misleading
 * "wrong format" error. Sectors are shorter than laps, so this only validates
 * the same `ss.mmm` / `m:ss.mmm` shape and requires a positive value.
 */
export function isValidSectorTimeFormat(input: string): boolean {
  const s = input.trim().replace(",", ".");
  if (!s) return false;

  const withColon = /^(\d+):([0-5]\d)\.(\d{3})$/;
  const secondsOnly = /^(\d+)\.(\d{3})$/;

  const m1 = s.match(withColon);
  if (m1) {
    const total =
      parseInt(m1[1]!, 10) * 60_000 +
      parseInt(m1[2]!, 10) * 1_000 +
      parseInt(m1[3]!, 10);
    return Number.isFinite(total) && total > 0;
  }

  const m2 = s.match(secondsOnly);
  if (m2) {
    const total = parseInt(m2[1]!, 10) * 1_000 + parseInt(m2[2]!, 10);
    return Number.isFinite(total) && total > 0;
  }

  return false;
}

const v2LapRowSchema = z.object({
  lapTime: z.string(),
  /** Frontend-only sector times — not sent to the backend. */
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
      /** Frontend-only — not persisted. */
      conditions: z.enum(["DRY", "WET", "MIXED"]),
    })
    .superRefine((data, ctx) => {
      // Delegate all backend-bound validation to the shared V1 schema so create
      // rules (positions, grid size, lap format, caps) stay identical. Paths align
      // because field names and lap indices match one-to-one.
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

      // Frontend-only sector-time format validation (UX only, never submitted).
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
