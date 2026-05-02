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
    timeZoneName: "short",
  });
}

/** IANA timezone name of the current browser (e.g. "Europe/London"). */
export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}
