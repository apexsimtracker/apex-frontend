import {
  APEX_REFRESH_TOKEN_ADMIN_BACKUP_KEY,
  APEX_REFRESH_TOKEN_KEY,
  APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY,
  APEX_SESSION_TOKEN_KEY,
  APEX_TOKEN_ADMIN_KEY,
  LEGACY_SESSION_ADMIN_BACKUP_KEY,
  clearAdminCredentialBackups,
  persistSessionTokenFromAuthPayload,
  setToken,
} from "@/auth/token";

const IMPERSONATION_BANNER_HIDDEN_KEY = "apex_impersonation_banner_hidden";

export {
  APEX_TOKEN_ADMIN_KEY,
  LEGACY_SESSION_ADMIN_BACKUP_KEY,
  clearAdminCredentialBackups,
};

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

export function impersonatedUserEmail(): string | null {
  const payload = parseStoredAccessTokenPayload();
  const email = payload?.email;
  return typeof email === "string" && email.trim() ? email.trim() : null;
}

/** JWT `sub` from stored access token (no verification). Used to detect user identity changes. */
export function storedAccessTokenSubject(): string | null {
  const payload = parseStoredAccessTokenPayload();
  const sub = payload?.sub;
  return typeof sub === "string" ? sub : null;
}

export function backupAdminCredentialsForImpersonation(): void {
  if (typeof localStorage === "undefined") return;
  try {
    sessionStorage.removeItem(IMPERSONATION_BANNER_HIDDEN_KEY);
  } catch {
    /* ignore */
  }
  const cur = localStorage.getItem("apex_token");
  if (cur?.trim()) localStorage.setItem(APEX_TOKEN_ADMIN_KEY, cur);
  const curSession = localStorage.getItem(APEX_SESSION_TOKEN_KEY);
  if (curSession?.trim()) {
    localStorage.setItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY, curSession.trim());
  } else {
    localStorage.removeItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY);
  }
  const curRefresh = localStorage.getItem(APEX_REFRESH_TOKEN_KEY);
  if (curRefresh?.trim()) {
    localStorage.setItem(APEX_REFRESH_TOKEN_ADMIN_BACKUP_KEY, curRefresh.trim());
  } else {
    localStorage.removeItem(APEX_REFRESH_TOKEN_ADMIN_BACKUP_KEY);
  }
  try {
    sessionStorage.removeItem(LEGACY_SESSION_ADMIN_BACKUP_KEY);
  } catch {
    /* ignore */
  }
}

export function isImpersonationBannerHidden(): boolean {
  if (typeof sessionStorage === "undefined") return false;
  try {
    return sessionStorage.getItem(IMPERSONATION_BANNER_HIDDEN_KEY) === "true";
  } catch {
    return false;
  }
}

export function hideImpersonationBanner(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(IMPERSONATION_BANNER_HIDDEN_KEY, "true");
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("apex:impersonation-banner"));
}

export function readAdminSessionBackup(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY)?.trim() || null;
}

export function applyRestoredAdminCredentials(payload: {
  token: string;
  sessionToken?: string;
  refreshToken?: string;
}): void {
  setToken(payload.token);
  persistSessionTokenFromAuthPayload({
    sessionToken: payload.sessionToken,
    refreshToken: payload.refreshToken,
  });
  clearAdminCredentialBackups();
}

/** Restore admin JWT/session/refresh from localStorage backups. Returns false if no admin JWT. */
export function restoreAdminCredentialsFromBackup(): boolean {
  if (typeof localStorage === "undefined") return false;
  const admin = localStorage.getItem(APEX_TOKEN_ADMIN_KEY);
  if (!admin?.trim()) {
    clearAdminCredentialBackups();
    return false;
  }
  const adminSession = localStorage.getItem(APEX_SESSION_TOKEN_ADMIN_BACKUP_KEY);
  const adminRefresh = localStorage.getItem(APEX_REFRESH_TOKEN_ADMIN_BACKUP_KEY);
  localStorage.setItem("apex_token", admin);
  if (adminSession?.trim()) {
    localStorage.setItem(APEX_SESSION_TOKEN_KEY, adminSession.trim());
  } else {
    localStorage.removeItem(APEX_SESSION_TOKEN_KEY);
  }
  if (adminRefresh?.trim()) {
    localStorage.setItem(APEX_REFRESH_TOKEN_KEY, adminRefresh.trim());
  } else {
    localStorage.removeItem(APEX_REFRESH_TOKEN_KEY);
  }
  clearAdminCredentialBackups();
  return true;
}

export function dispatchExitImpersonation(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("apex:auth", { detail: { exitImpersonation: true } }),
  );
}
