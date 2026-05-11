/**
 * External reference URLs for admins verifying track/car display names before adding catalog rows.
 * Vendor sites change — update {@link REFERENCE_URLS} when links break.
 */

import type { ManualActivitySim } from "./manualActivityData";

export type CatalogReviewKind = "track" | "car";

/** Canonical reference pages per sim (official listings / hubs). */
export const REFERENCE_URLS: Record<
  ManualActivitySim,
  Record<CatalogReviewKind, string>
> = {
  IRACING: {
    track: "https://www.iracing.com/tracks/",
    car: "https://www.iracing.com/cars/",
  },
  F1_25: {
    track: "https://www.ea.com/games/f1/f1-25",
    car: "https://www.ea.com/games/f1/f1-25",
  },
  LMU: {
    track: "https://lemansultimate.com/",
    car: "https://lemansultimate.com/",
  },
};

/** API/catalog consistency uses lowercase keys ({@link VALID_SIMS} style). */
export function catalogSimKeyToManualActivitySim(
  key: string | null | undefined
): ManualActivitySim | null {
  if (!key?.trim()) return null;
  const k = key.trim().toLowerCase();
  if (k === "iracing") return "IRACING";
  if (k === "f1_25") return "F1_25";
  if (k === "lmu") return "LMU";
  return null;
}

export function reviewCatalogReferenceUrl(params: {
  sim: ManualActivitySim;
  kind: CatalogReviewKind;
}): string {
  return REFERENCE_URLS[params.sim][params.kind];
}

export function reviewCatalogSearchUrl(query: string): string {
  const q = query.trim();
  const encoded = encodeURIComponent(q || "sim racing track car catalog");
  return `https://www.google.com/search?q=${encoded}`;
}

/** When sim is unknown (e.g. personal-best orphans before picking a sim). */
export function reviewCatalogOrphanSearchUrl(
  token: string,
  kind: CatalogReviewKind
): string {
  const label = kind === "track" ? "track" : "car";
  const safe = token.trim() || label;
  return reviewCatalogSearchUrl(
    `"${safe}" sim racing ${label} iRacing OR Le Mans Ultimate OR F1 25`
  );
}
