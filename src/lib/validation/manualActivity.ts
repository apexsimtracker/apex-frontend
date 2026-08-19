import { z } from "zod";
import { parseStrictManualLapTimeToMs } from "@/lib/utils";

/** Aligned with apex/src/routes/manualActivity.ts POSITION_* / TOTAL_DRIVERS_* */
export const MANUAL_ACTIVITY_POSITION_MIN = 1;
export const MANUAL_ACTIVITY_POSITION_MAX = 999;
export const MANUAL_ACTIVITY_TOTAL_DRIVERS_MIN = 1;
export const MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX = 999;

/** Aligned with apex MANUAL_LAPS_MAX */
export const MANUAL_LAPS_MAX_IRACING = 250;
export const MANUAL_LAPS_MAX_F1_25 = 100;
/** Aligned with apex MANUAL_LAPS_MAX.lmu */
export const MANUAL_LAPS_MAX_LMU = 100;

/** Aligned with apex SESSION_CAPTION_MAX_LENGTH */
export const SESSION_CAPTION_MAX_LENGTH = 280;

const LAP_FORMAT_MSG =
  "Use exactly: m:ss.mmm (e.g. 1:32.456 or 0:59.900) or ss.mmm (e.g. 92.456). Seconds must be two digits with a colon; milliseconds must be three digits.";

/** Mirrors the backend gate in apex/src/lib/sessionLapGate.ts. */
const NO_VALID_LAP_MSG = "At least one valid lap time is required";

export function getManualLapMaxForSim(sim: string): number {
  const s = sim.trim().toUpperCase();
  if (s === "F1_25") return MANUAL_LAPS_MAX_F1_25;
  if (s === "LMU") return MANUAL_LAPS_MAX_LMU;
  return MANUAL_LAPS_MAX_IRACING;
}

/** Used when sim not chosen yet (allow UI to show add until sim selected). */
export function getManualLapMaxForSimOrDefault(
  sim: string | undefined | null,
): number {
  if (!sim?.trim()) return MANUAL_LAPS_MAX_IRACING;
  return getManualLapMaxForSim(sim);
}

/**
 * Catalogue cap for new manual sessions, raised to at least `telemetryMinLapRows` when editing
 * an existing telemetry session that already has more laps than the manual-entry limit.
 */
export function effectiveManualLapMaxForForm(
  sim: string,
  telemetryMinLapRows?: number | null,
): number {
  const base = getManualLapMaxForSimOrDefault(sim);
  if (telemetryMinLapRows != null && Number.isFinite(telemetryMinLapRows)) {
    return Math.max(base, Math.floor(telemetryMinLapRows));
  }
  return base;
}

const lapRowSchema = z.object({
  lapTime: z.string(),
});

export function createManualActivityFormSchema(
  telemetryMinLapRows?: number | null,
) {
  return z
    .object({
      sim: z.string(),
      trackId: z.string(),
      carId: z.string(),
      /** PRACTICE | QUALIFY | RACE */
      manualSessionKind: z.string(),
      position: z.string(),
      totalDrivers: z.string(),
      /** Qualifying position (race sessions only) */
      qualifyingPosition: z.string(),
      laps: z.array(lapRowSchema),
      caption: z.string().max(
        SESSION_CAPTION_MAX_LENGTH,
        `Caption must be at most ${SESSION_CAPTION_MAX_LENGTH} characters.`,
      ),
    })
    .superRefine((data, ctx) => {
      if (!data.sim?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a sim.",
          path: ["sim"],
        });
      }
      if (!data.trackId?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Please select a track.",
          path: ["trackId"],
        });
      }
      // No early return on missing sim/track: every field is validated on each
      // submit so the user sees the full list of problems at once.
      const kind = data.manualSessionKind?.trim().toUpperCase();
      if (kind !== "PRACTICE" && kind !== "QUALIFY" && kind !== "RACE") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Select Practice, Qualifying, or Race.",
          path: ["manualSessionKind"],
        });
      }

      const positionNum = data.position?.trim()
        ? parseInt(data.position, 10)
        : undefined;
      const totalDriversNum = data.totalDrivers?.trim()
        ? parseInt(data.totalDrivers, 10)
        : undefined;

      if (data.position?.trim()) {
        if (
          !Number.isInteger(positionNum) ||
          Number.isNaN(positionNum as number)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Position must be a whole number.",
            path: ["position"],
          });
        } else if (
          (positionNum as number) < MANUAL_ACTIVITY_POSITION_MIN ||
          (positionNum as number) > MANUAL_ACTIVITY_POSITION_MAX
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Position must be between ${MANUAL_ACTIVITY_POSITION_MIN} and ${MANUAL_ACTIVITY_POSITION_MAX}.`,
            path: ["position"],
          });
        }
      }

      if (data.totalDrivers?.trim()) {
        if (
          !Number.isInteger(totalDriversNum) ||
          Number.isNaN(totalDriversNum as number)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Grid size must be a whole number.",
            path: ["totalDrivers"],
          });
        } else if (
          (totalDriversNum as number) < MANUAL_ACTIVITY_TOTAL_DRIVERS_MIN ||
          (totalDriversNum as number) > MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Grid size must be between ${MANUAL_ACTIVITY_TOTAL_DRIVERS_MIN} and ${MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX} drivers.`,
            path: ["totalDrivers"],
          });
        }
      }

      const hasPosInput = Boolean(data.position?.trim());
      const hasGridInput = Boolean(data.totalDrivers?.trim());

      const posValid =
        hasPosInput &&
        Number.isInteger(positionNum) &&
        !Number.isNaN(positionNum as number) &&
        (positionNum as number) >= MANUAL_ACTIVITY_POSITION_MIN &&
        (positionNum as number) <= MANUAL_ACTIVITY_POSITION_MAX;

      const gridValid =
        hasGridInput &&
        Number.isInteger(totalDriversNum) &&
        !Number.isNaN(totalDriversNum as number) &&
        (totalDriversNum as number) >= MANUAL_ACTIVITY_TOTAL_DRIVERS_MIN &&
        (totalDriversNum as number) <= MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX;

      if (kind !== "PRACTICE") {
        const onlyPosFilled = posValid && !hasGridInput;
        const onlyGridFilled = gridValid && !hasPosInput;
        if (onlyPosFilled || onlyGridFilled) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Please enter both position and grid size, or leave both empty.",
            path: ["position"],
          });
        }

        if (
          posValid &&
          gridValid &&
          (positionNum as number) > (totalDriversNum as number)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Position cannot be greater than the total number of drivers.",
            path: ["position"],
          });
        }
      }

      if (kind === "RACE" && data.qualifyingPosition?.trim()) {
        const qp = parseInt(data.qualifyingPosition.trim(), 10);
        if (!Number.isInteger(qp) || Number.isNaN(qp)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Qualifying position must be a whole number.",
            path: ["qualifyingPosition"],
          });
        } else if (
          qp < MANUAL_ACTIVITY_POSITION_MIN ||
          qp > MANUAL_ACTIVITY_POSITION_MAX
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Qualifying position must be between ${MANUAL_ACTIVITY_POSITION_MIN} and ${MANUAL_ACTIVITY_POSITION_MAX}.`,
            path: ["qualifyingPosition"],
          });
        } else if (
          gridValid &&
          totalDriversNum != null &&
          qp > (totalDriversNum as number)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Qualifying position cannot be greater than the total number of drivers.",
            path: ["qualifyingPosition"],
          });
        }
      }

      const maxLaps = effectiveManualLapMaxForForm(
        data.sim,
        telemetryMinLapRows,
      );
      if (data.laps.length > maxLaps) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `At most ${maxLaps} laps for this sim.`,
          path: ["laps"],
        });
      }

      let validLapCount = 0;
      let malformedLapCount = 0;
      data.laps.forEach((row, i) => {
        const t = row.lapTime?.trim() ?? "";
        if (!t) return;
        const ms = parseStrictManualLapTimeToMs(row.lapTime);
        if (ms === null) {
          malformedLapCount += 1;
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: LAP_FORMAT_MSG,
            path: ["laps", i, "lapTime"],
          });
        } else {
          validLapCount += 1;
        }
      });

      // Only when every row is blank: a malformed row already has its own
      // message, and an issue on `laps` would replace the per-row ones.
      if (validLapCount === 0 && malformedLapCount === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: NO_VALID_LAP_MSG,
          path: ["laps"],
        });
      }
    });
}

export const manualActivityFormSchema = createManualActivityFormSchema();

export type ManualActivityFormValues = z.infer<typeof manualActivityFormSchema>;

export { LAP_FORMAT_MSG, NO_VALID_LAP_MSG };
