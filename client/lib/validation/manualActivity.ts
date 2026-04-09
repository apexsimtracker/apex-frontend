import { z } from "zod";
import { parseLapTimeToMs } from "@/lib/utils";

/** Aligned with apex/src/routes/manualActivity.ts POSITION_* / TOTAL_DRIVERS_* */
export const MANUAL_ACTIVITY_POSITION_MIN = 1;
export const MANUAL_ACTIVITY_POSITION_MAX = 999;
export const MANUAL_ACTIVITY_TOTAL_DRIVERS_MIN = 1;
export const MANUAL_ACTIVITY_TOTAL_DRIVERS_MAX = 999;

const LAP_FORMAT_MSG =
  "Invalid format. Use mm:ss.mmm (e.g. 1:32.456, 92.456, 0:59.900)";

export const manualActivityFormSchema = z
  .object({
    sim: z.string(),
    trackId: z.string(),
    carId: z.string(),
    position: z.string(),
    totalDrivers: z.string(),
    bestLapTime: z.string(),
    notes: z.string(),
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
    if (!data.sim?.trim() || !data.trackId?.trim()) {
      return;
    }

    const positionNum = data.position?.trim() ? parseInt(data.position, 10) : undefined;
    const totalDriversNum = data.totalDrivers?.trim()
      ? parseInt(data.totalDrivers, 10)
      : undefined;

    if (data.position?.trim()) {
      if (!Number.isInteger(positionNum) || Number.isNaN(positionNum as number)) {
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
      if (!Number.isInteger(totalDriversNum) || Number.isNaN(totalDriversNum as number)) {
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

    const onlyPosFilled = posValid && !hasGridInput;
    const onlyGridFilled = gridValid && !hasPosInput;
    if (onlyPosFilled || onlyGridFilled) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please enter both position and grid size, or leave both empty.",
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
        message: "Position cannot be greater than the total number of drivers.",
        path: ["position"],
      });
    }

    if (data.bestLapTime.trim()) {
      const ms = parseLapTimeToMs(data.bestLapTime);
      if (ms === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: LAP_FORMAT_MSG,
          path: ["bestLapTime"],
        });
      }
    }
  });

export type ManualActivityFormValues = z.infer<typeof manualActivityFormSchema>;

export { LAP_FORMAT_MSG };
