/** Admin JWT saved while viewing as another user; restored on exit. */
export const APEX_TOKEN_ADMIN_KEY = "apex_token_admin";

export const LEGACY_SESSION_ADMIN_BACKUP_KEY = "apex_token_admin_backup";

function base64UrlToJson(segment: string): Record<string, unknown> | null {
  try {
    const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Decode JWT payload from storage (no signature verification — UI-only detection). */
export function parseStoredAccessTokenPayload(): Record<
  string,
  unknown
> | null {
  if (typeof localStorage === "undefined") return null;
  const token = localStorage.getItem("apex_token");
  if (!token?.trim()) return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  return base64UrlToJson(parts[1]!);
}

export function isImpersonating(): boolean {
  const payload = parseStoredAccessTokenPayload();
  const imp = payload?.impersonatorId;
  return typeof imp === "string" && imp.length > 0;
}

/** JWT `sub` from stored access token (no verification). Used to detect user identity changes. */
export function storedAccessTokenSubject(): string | null {
  const payload = parseStoredAccessTokenPayload();
  const sub = payload?.sub;
  return typeof sub === "string" ? sub : null;
}
