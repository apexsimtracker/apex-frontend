import { z } from "zod";

/** Mirrors server ManualActivityBody / client ManualActivityRequest. */
export const manualActivityRequestSchema = z.object({
  sim: z.string().min(1),
  trackId: z.string().min(1),
  manualSessionKind: z.enum(["PRACTICE", "QUALIFY", "RACE"]),
  carId: z.string().optional(),
  position: z.number().optional(),
  qualifyingPosition: z.number().optional(),
  totalDrivers: z.number().optional(),
  bestLapMs: z.number().optional(),
  laps: z.array(z.object({ lapTimeMs: z.number() })).optional(),
  notes: z.string().optional(),
  challengeId: z.string().optional(),
});

export type ManualActivityRequestSchema = z.infer<typeof manualActivityRequestSchema>;
