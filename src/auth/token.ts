const TOKEN_KEY = "apex_token";

/** Server-side AuthSession token (paired with JWT); sent as X-Apex-Session for tracking/revoke. */
export const APEX_SESSION_TOKEN_KEY = "apex_session_token";

/** Saved next to `apex_token_admin` while impersonating so exit restores admin browser session. */
export const APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY = "apex_session_token_admin";

export function getToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/** Server AuthSession id + optional refresh (silent renewal); paired with JWT for API. */
export const APEX_REFRESH_TOKEN_KEY = "apex_refresh_token";

/** Persist server session id returned from login / verify-email alongside JWT. */
export function persistSessionTokenFromAuthPayload(payload: {
  sessionToken?: string;
  refreshToken?: string;
}): void {
  if (typeof localStorage === "undefined") return;
  const isFullClear = payload != null && Object.keys(payload).length === 0;

  const s =
    typeof payload.sessionToken === "string" ? payload.sessionToken.trim() : "";
  if (s) localStorage.setItem(APEX_SESSION_TOKEN_KEY, s);
  else if ("sessionToken" in payload || isFullClear)
    localStorage.removeItem(APEX_SESSION_TOKEN_KEY);

  const r =
    typeof payload.refreshToken === "string" ? payload.refreshToken.trim() : "";
  if (r) localStorage.setItem(APEX_REFRESH_TOKEN_KEY, r);
  else if ("refreshToken" in payload || isFullClear)
    localStorage.removeItem(APEX_REFRESH_TOKEN_KEY);
}

export function clearToken(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(APEX_SESSION_TOKEN_KEY);
  localStorage.removeItem(APEX_REFRESH_TOKEN_KEY);
  localStorage.removeItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY);
  // Same-tab storage changes do not fire `storage` events; AuthContext listens for this to sync
  // hasTokenState and clear cached session data (see contexts/AuthContext.tsx).
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("apex:auth"));
  }
}
