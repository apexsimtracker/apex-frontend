/**
 * Location state passed when redirecting unauthenticated users to /login.
 */
export type AuthRedirectState = {
  message?: string;
  /** Path to return to after sign-in, e.g. pathname + search */
  from?: string;
};

/**
 * Returns a safe in-app path for post-login navigation.
 * Rejects protocol-relative URLs, absolute URLs, and non-path values.
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
