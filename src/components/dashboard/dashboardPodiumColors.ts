/** Trophy and best-lap accent colors by finishing position. */
export function getPodiumTrophyClassName(pos: number): string {
  if (pos === 1) return "text-yellow-400";
  if (pos === 2) return "text-silver";
  if (pos === 3) return "text-bronze";
  return "";
}

export function getPodiumBestLapClassName(pos: number): string {
  if (pos === 1) return "text-yellow-400";
  if (pos === 2) return "text-silver";
  if (pos === 3) return "text-bronze";
  return "text-white";
}

/** @deprecated Use getPodiumBestLapClassName */
export const getPodiumFastestLapClassName = getPodiumBestLapClassName;
