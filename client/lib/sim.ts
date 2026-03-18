/**
 * Sim Display Helpers
 * 
 * Central utility for rendering sim-specific UI elements consistently across the app.
 * Handles display names, badges, and capability flags for stat gating.
 */

export type SimKey = "IRACING" | "F1_25" | "F1_24" | "ACC" | "AC" | string;

export interface SimConfig {
  displayName: string;
  shortName: string;
  badgeClass: string;
  capabilities: {
    hasRating: boolean;
    hasIncidents: boolean;
    hasSOF: boolean;
    hasOfficialStatus: boolean;
    hasLicenseClass: boolean;
  };
}

const SIM_CONFIGS: Record<string, SimConfig> = {
  IRACING: {
    displayName: "iRacing",
    shortName: "iR",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    capabilities: {
      hasRating: true,
      hasIncidents: true,
      hasSOF: true,
      hasOfficialStatus: true,
      hasLicenseClass: true,
    },
  },
  F1_25: {
    displayName: "F1 25",
    shortName: "F1",
    badgeClass: "bg-red-500/10 text-red-300 border-red-500/20",
    capabilities: {
      hasRating: false,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
  F1_24: {
    displayName: "F1 24",
    shortName: "F1",
    badgeClass: "bg-red-500/10 text-red-300 border-red-500/20",
    capabilities: {
      hasRating: false,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
  ACC: {
    displayName: "ACC",
    shortName: "ACC",
    badgeClass: "bg-green-500/10 text-green-300 border-green-500/20",
    capabilities: {
      hasRating: true,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
  AC: {
    displayName: "Assetto Corsa",
    shortName: "AC",
    badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    capabilities: {
      hasRating: false,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
  ASSETTO_CORSA: {
    displayName: "Assetto Corsa",
    shortName: "AC",
    badgeClass: "bg-orange-500/10 text-orange-300 border-orange-500/20",
    capabilities: {
      hasRating: false,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
  ASSETTO_CORSA_COMPETIZIONE: {
    displayName: "ACC",
    shortName: "ACC",
    badgeClass: "bg-green-500/10 text-green-300 border-green-500/20",
    capabilities: {
      hasRating: true,
      hasIncidents: false,
      hasSOF: false,
      hasOfficialStatus: false,
      hasLicenseClass: false,
    },
  },
};

const DEFAULT_CONFIG: SimConfig = {
  displayName: "Unknown Sim",
  shortName: "?",
  badgeClass: "bg-white/5 text-white/60 border-white/10",
  capabilities: {
    hasRating: false,
    hasIncidents: false,
    hasSOF: false,
    hasOfficialStatus: false,
    hasLicenseClass: false,
  },
};

/**
 * Normalizes sim key to uppercase for lookup.
 * Handles variations like "iracing", "iRacing", "IRACING", "f1_25", "F1 25", etc.
 */
function normalizeSimKey(sim: string | null | undefined): string | null {
  if (!sim) return null;
  return sim
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

/**
 * Get full sim configuration for a given sim key.
 */
export function getSimConfig(sim: string | null | undefined): SimConfig {
  const key = normalizeSimKey(sim);
  if (!key) return DEFAULT_CONFIG;
  return SIM_CONFIGS[key] ?? { ...DEFAULT_CONFIG, displayName: sim ?? "Unknown Sim" };
}

/**
 * Get human-readable display name for a sim.
 * e.g., "IRACING" -> "iRacing", "F1_25" -> "F1 25"
 */
export function getSimDisplayName(sim: string | null | undefined): string {
  return getSimConfig(sim).displayName;
}

/**
 * Get short display name for a sim (for compact badges).
 * e.g., "IRACING" -> "iR", "F1_25" -> "F1"
 */
export function getSimShortName(sim: string | null | undefined): string {
  return getSimConfig(sim).shortName;
}

/**
 * Get badge CSS classes for a sim.
 */
export function getSimBadgeClass(sim: string | null | undefined): string {
  return getSimConfig(sim).badgeClass;
}

/**
 * Check if a sim supports iRating (or similar rating system).
 */
export function simHasRating(sim: string | null | undefined): boolean {
  return getSimConfig(sim).capabilities.hasRating;
}

/**
 * Check if a sim tracks incidents.
 */
export function simHasIncidents(sim: string | null | undefined): boolean {
  return getSimConfig(sim).capabilities.hasIncidents;
}

/**
 * Check if a sim has Strength of Field (SOF) metric.
 */
export function simHasSOF(sim: string | null | undefined): boolean {
  return getSimConfig(sim).capabilities.hasSOF;
}

/**
 * Check if a sim has official race status.
 */
export function simHasOfficialStatus(sim: string | null | undefined): boolean {
  return getSimConfig(sim).capabilities.hasOfficialStatus;
}

/**
 * Check if a sim has license classes.
 */
export function simHasLicenseClass(sim: string | null | undefined): boolean {
  return getSimConfig(sim).capabilities.hasLicenseClass;
}

/**
 * Format session type for display.
 * Handles F1-style session types and provides fallback for unknown types.
 */
export function formatSessionType(
  type: string | null | undefined,
  sim?: string | null
): string {
  if (!type) return "Session";
  
  const normalized = type.toUpperCase().trim();
  
  switch (normalized) {
    case "PRACTICE":
      return "Practice";
    case "RACE":
      return "Race";
    case "QUALIFY":
    case "QUALIFYING":
      return "Qualifying";
    case "TIME_TRIAL":
    case "TIMETRIAL":
    case "TIME TRIAL":
      return "Time Trial";
    case "SPRINT":
      return "Sprint";
    case "WARMUP":
    case "WARM_UP":
      return "Warm Up";
    case "UNKNOWN":
      return "Session";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  }
}

/**
 * Format session type for display in uppercase style (for headers/badges).
 */
export function formatSessionTypeUpper(
  type: string | null | undefined,
  sim?: string | null
): string {
  return formatSessionType(type, sim).toUpperCase();
}
