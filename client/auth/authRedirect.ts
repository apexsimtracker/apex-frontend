/**
 * Location state passed when redirecting unauthenticated users to /login.
 */
export type AuthRedirectState = {
  message?: string;
  /** Path to return to after sign-in, e.g. pathname + search */
  from?: string;
};

/** Paths that should never be used as post-login return targets (avoids stale router state). */
const AUTH_FLOW_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/verify-email",
  "/forgot-password",
] as const;

function pathnameOnly(pathWithOptionalQuery: string): string {
  const q = pathWithOptionalQuery.indexOf("?");
  return q === -1 ? pathWithOptionalQuery : pathWithOptionalQuery.slice(0, q);
}

function isAuthFlowPath(path: string): boolean {
  const base = pathnameOnly(path);
  for (const prefix of AUTH_FLOW_PATH_PREFIXES) {
    if (base === prefix || base.startsWith(`${prefix}/`)) return true;
  }
  return false;
}

/**
 * Returns a safe in-app path for post-login navigation.
 * Rejects protocol-relative URLs, absolute URLs, non-path values, and auth-flow routes.
 */
export function getSafeReturnPath(from: unknown, fallback: string): string {
  if (typeof from !== "string" || from.length === 0) {
    return fallback;
  }
  const t = from.trim();
  if (!t.startsWith("/") || t.startsWith("//")) {
    return fallback;
  }
  const lower = t.toLowerCase();
  if (
    lower.startsWith("/\\") ||
    lower.includes("://") ||
    lower.startsWith("/javascript:") ||
    lower.startsWith("/data:")
  ) {
    return fallback;
  }
  if (isAuthFlowPath(t)) {
    return fallback;
  }
  return t;
}

export function parseAuthRedirectState(state: unknown): AuthRedirectState {
  if (!state || typeof state !== "object") {
    return {};
  }
  const o = state as Record<string, unknown>;
  const message = typeof o.message === "string" ? o.message : undefined;
  const from = typeof o.from === "string" ? o.from : undefined;
  return { message, from };
}
