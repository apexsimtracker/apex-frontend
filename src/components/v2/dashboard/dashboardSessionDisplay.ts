import { formatTrackName } from "@/lib/tracks";

export function parseTrackHeadline(
  track: string | null | undefined,
  trackName?: string | null,
): { city: string | null; title: string } {
  const raw = (trackName ?? track ?? "").trim();
  if (!raw || raw.toLowerCase() === "unknown") {
    return { city: null, title: "Practice Session" };
  }
  if (raw.toLowerCase().endsWith(".ibt")) {
    return { city: null, title: "Practice Session" };
  }

  const parts = raw
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return {
      city: parts[parts.length - 1] ?? null,
      title: formatTrackName(parts.slice(0, -1).join(", ")),
    };
  }

  return { city: null, title: formatTrackName(raw) };
}

export function splitPositionLabel(label: string): {
  rank: string;
  suffix: string | null;
} {
  const idx = label.indexOf(" / ");
  if (idx === -1) return { rank: label, suffix: null };
  return { rank: label.slice(0, idx), suffix: label.slice(idx) };
}
