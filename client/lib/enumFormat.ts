import { getSimDisplayName } from "@/lib/sim";

/**
 * Human-readable labels for backend enum-ish strings.
 * Used to avoid rendering raw values like "MANUAL_ACTIVITY".
 */
const SOURCE_LABELS: Record<string, string> = {
  MANUAL_ACTIVITY: "Manual",
  TELEMETRY: "Telemetry",
  AGENT: "Agent",
};

export function formatActivitySource(source: string | null | undefined): string {
  const raw = (source ?? "").toString().trim();
  if (!raw) return "—";
  const key = raw.toUpperCase();
  return SOURCE_LABELS[key] ?? titleizeEnum(raw);
}

export function formatSimEnum(sim: string | null | undefined): string {
  return getSimDisplayName(sim);
}

export function titleizeEnum(value: string): string {
  const raw = (value ?? "").toString().trim();
  if (!raw) return "—";
  const normalized = raw.replace(/[-_]+/g, " ").trim();
  if (!normalized) return "—";
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

