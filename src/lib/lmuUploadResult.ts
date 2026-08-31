/**
 * LMU `.duckdb` telemetry files do not record the classified result — the desktop
 * agent reads finishing position from LMU's results XML and scoring shared memory,
 * neither of which travels with the file. On manual upload we ask for it instead,
 * so the filename has to tell us whether a result is even applicable.
 *
 * Mirrors `inferLmuSessionTypeFromBasename` in the API.
 */
export type LmuUploadKind = "race" | "qualifying" | "practice" | "unknown";

export function inferLmuUploadKind(filename: string): LmuUploadKind {
  const stem = filename.replace(/\.duckdb$/i, "").trim();
  if (!stem) return "unknown";
  const lower = stem.toLowerCase();

  if (/_q_/i.test(stem)) return "qualifying";
  if (/_p_/i.test(stem)) return "practice";
  if (/_r_/i.test(stem)) return "race";

  if (/\bqualifying\b|\bqualify\b/i.test(stem)) return "qualifying";
  if (/\brace\b|\bsprint\b/.test(lower)) return "race";
  if (/\bwarm[\s-]?up\b|\bpractice\b|\btest\b/.test(lower)) return "practice";
  return "unknown";
}

/** Practice and warmup sessions have no finishing position to record. */
export function lmuKindSupportsResult(kind: LmuUploadKind): boolean {
  return kind === "race" || kind === "qualifying" || kind === "unknown";
}

export function lmuResultPositionLabel(kind: LmuUploadKind): string {
  return kind === "qualifying" ? "Qualifying position" : "Finishing position";
}

export const LMU_RESULT_POSITION_MIN = 1;
export const LMU_RESULT_POSITION_MAX = 999;

/** Returns an error message, or null when the pair is acceptable to submit. */
export function validateLmuResultInput(
  position: string,
  totalDrivers: string,
): string | null {
  const posRaw = position.trim();
  const totalRaw = totalDrivers.trim();
  if (!posRaw && !totalRaw) return null;

  const check = (raw: string, label: string): string | null => {
    if (!raw) return null;
    if (!/^\d+$/.test(raw)) return `${label} must be a whole number.`;
    const n = Number(raw);
    if (n < LMU_RESULT_POSITION_MIN || n > LMU_RESULT_POSITION_MAX) {
      return `${label} must be between ${LMU_RESULT_POSITION_MIN} and ${LMU_RESULT_POSITION_MAX}.`;
    }
    return null;
  };

  const posError = check(posRaw, "Position");
  if (posError) return posError;
  const totalError = check(totalRaw, "Total cars");
  if (totalError) return totalError;

  if (posRaw && totalRaw && Number(posRaw) > Number(totalRaw)) {
    return "Position cannot be greater than total cars.";
  }
  return null;
}
