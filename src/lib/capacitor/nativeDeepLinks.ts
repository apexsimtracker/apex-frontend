const ALLOWED_HOSTS = new Set(["apexsimtracker.com", "www.apexsimtracker.com"]);

const ALLOWED_PREFIXES = [
  "/sessions",
  "/discussion",
  "/challenge",
  "/challenges",
];

/**
 * Map a Universal Link / App Link URL to an in-app React Router path.
 * Returns null for non-https, unknown hosts, or paths we do not claim.
 */
export function urlToInAppPath(raw: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  const host = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(host)) return null;

  const path = parsed.pathname || "/";
  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
  if (!allowed) return null;

  return `${path}${parsed.search}${parsed.hash}`;
}
