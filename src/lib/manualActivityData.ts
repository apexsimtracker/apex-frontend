/**
 * Manual activity UI configuration (sim picker, labels).
 * Track and car options always come from GET /api/catalogs/:sim (`useCatalogs`), not from static lists.
 */

export type ManualActivitySim = "IRACING" | "F1_25" | "LMU";

export interface SimOption {
  value: ManualActivitySim;
  label: string;
}

export const MANUAL_ACTIVITY_SIMS: SimOption[] = [
  { value: "IRACING", label: "iRacing" },
  { value: "F1_25", label: "F1 25" },
  { value: "LMU", label: "Le Mans Ultimate" },
];
