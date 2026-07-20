/** Loveable profile discipline logos — F1 25, iRacing, Le Mans order. */
export type DisciplineFamily = "F1" | "IRACING" | "LMU" | "OTHER";

const FAMILY_ORDER: Record<DisciplineFamily, number> = {
  F1: 0,
  IRACING: 1,
  LMU: 2,
  OTHER: 99,
};

export function simKey(sim: string): string {
  return sim.trim().toUpperCase().replace(/\s+/g, "_").replace(/-/g, "_");
}

/** Map API / display sim strings to a canonical discipline family. */
export function resolveDisciplineFamily(sim: string): DisciplineFamily {
  const key = simKey(sim);
  const lower = sim.trim().toLowerCase();

  if (key === "IRACING" || key === "I_RACING" || lower === "iracing") {
    return "IRACING";
  }

  if (
    key === "LMU" ||
    key.startsWith("LE_MANS") ||
    key.includes("LEMANS") ||
    lower === "lmu" ||
    lower.includes("le mans")
  ) {
    return "LMU";
  }

  if (
    key.startsWith("F1") ||
    key === "F125" ||
    lower === "f1_25" ||
    lower === "f125" ||
    lower.startsWith("f1")
  ) {
    return "F1";
  }

  return "OTHER";
}

export function getDisciplineSortOrder(sim: string): number {
  return FAMILY_ORDER[resolveDisciplineFamily(sim)];
}

/** Asset paths matching Loveable profile.html (`/screens/img/*`). */
export function getDisciplineLogoSrc(sim: string): string {
  switch (resolveDisciplineFamily(sim)) {
    case "IRACING":
      return "/sims/disciplines/iracing.png";
    case "LMU":
      return "/sims/disciplines/lemans.svg";
    case "F1":
      return "/sims/disciplines/f1-25.png";
    default:
      return "/sims/disciplines/f1-25.png";
  }
}

export function getDisciplineBarClass(sim: string): string {
  switch (resolveDisciplineFamily(sim)) {
    case "IRACING":
      return "bg-blue-600";
    case "LMU":
      return "bg-yellow-400";
    case "F1":
      return "bg-apex-primary";
    default:
      return "bg-apex-primary";
  }
}

export function getDisciplineWinColorClass(sim: string): string {
  switch (resolveDisciplineFamily(sim)) {
    case "IRACING":
      return "text-blue-600";
    case "LMU":
      return "text-yellow-400";
    case "F1":
      return "text-apex-primary";
    default:
      return "text-apex-on-surface";
  }
}

export function sortDisciplineRows<T extends { sim: string }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => {
    const orderDiff =
      getDisciplineSortOrder(a.sim) - getDisciplineSortOrder(b.sim);
    if (orderDiff !== 0) return orderDiff;
    return a.sim.localeCompare(b.sim);
  });
}
