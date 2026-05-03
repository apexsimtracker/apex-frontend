/**
 * Format a UTC ISO-8601 instant for challenge UI.
 *
 * The API stores `startsAt` / `endsAt` as ISO strings in UTC (e.g. from
 * `Date.prototype.toISOString()`). `new Date(iso)` interprets that correctly;
 * formatting uses the viewer's local timezone.
 *
 * Uses explicit date/time fields instead of `dateStyle`/`timeStyle` so we can
 * add `timeZoneName` — mixing `dateStyle`/`timeStyle` with `timeZoneName` in
 * the same options object is invalid per ECMA-402 and throws in browsers.
 */
export function formatChallengeDateTime(
  iso: string | null | undefined,
): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

const COUNTDOWN_SECONDS_THRESHOLD = 3600;

/**
 * Human-readable remaining time for challenge countdowns.
 * Below 1h, includes seconds so sub-minute windows are not shown as "0h 0m".
 */
export function formatChallengeTimeRemaining(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  if (s >= COUNTDOWN_SECONDS_THRESHOLD) {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  }
  const m = Math.floor(s / 60);
  const secs = s % 60;
  if (m === 0) return `${secs}s`;
  return `${m}m ${secs.toString().padStart(2, "0")}s`;
}

/** IANA timezone name of the current browser (e.g. "Europe/London"). */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
