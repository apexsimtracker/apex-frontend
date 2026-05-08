/**
 * Sims accepted by `GET /api/leaderboards` and `GET /api/admin/leaderboards` via `?sim=`.
 * Matches Prisma `Sim` enum / apex `VALID_SIMS` — not the manual-activity form subset.
 *
 * @see apex/src/lib/sim.ts VALID_SIMS
 */
export const LEADERBOARD_FILTER_SIM_OPTIONS = [
  { value: "IRACING", label: "iRacing" },
  { value: "F1_25", label: "F1 25" },
  { value: "LMU", label: "Le Mans Ultimate" },
] as const;
