// Track display name formatter / lookup.
// Maps raw slugs or shorthand names from the backend to full, human-readable
// circuit names used in the product UI.

const TRACK_NAME_MAP: Record<string, string> = {
  // F1 / general circuits
  spa: "Spa-Francorchamps",
  "spa-francorchamps": "Spa-Francorchamps",
  spa_francorchamps: "Spa-Francorchamps",
  donington: "Donington Park Racing Circuit",
  "donington-park": "Donington Park Racing Circuit",
  donington_park: "Donington Park Racing Circuit",
};

export function formatTrackName(raw: string | null | undefined): string {
  if (!raw) return "Unknown track";
  const trimmed = raw.trim();
  if (!trimmed) return "Unknown track";

  const key = trimmed.toLowerCase();
  const mapped = TRACK_NAME_MAP[key];
  if (mapped) return mapped;

  // Fallback: title-case simple lowercase strings (e.g. "monza" -> "Monza")
  if (/^[a-z0-9 _-]+$/.test(key)) {
    return trimmed
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  // As a last resort, return the original string.
  return trimmed;
}

