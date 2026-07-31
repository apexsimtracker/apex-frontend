/**
 * API base URL resolution (unchanged from monolithic `api.ts`).
 * Relevant env vars: `VITE_API_URL`, `VITE_APEX_API_BASE_URL`, `VITE_APP_ENV`, `import.meta.env.PROD`.
 */
import { Capacitor } from "@capacitor/core";

/** Production backend (Render Frankfurt). Used when VITE_API_URL is unset in production builds. */
const DEFAULT_PROD_API = "https://apex-1-y319.onrender.com";

/** Staging backend (Render Free). Used when VITE_APP_ENV=staging and VITE_API_URL is unset. */
const DEFAULT_STAGING_API = "https://staging-y01y.onrender.com";

/** Default local API port (matches apex `PORT` default 10000, not the Vite dev port 8080). */
const DEFAULT_DEV_API = "http://localhost:10000";

function resolveInitialApiBase(): string {
  const fromEnv =
    import.meta.env.VITE_API_URL ??
    // Back-compat: some envs use this name in local dev.
    import.meta.env.VITE_APEX_API_BASE_URL;
  if (fromEnv) return fromEnv;

  if (import.meta.env.VITE_APP_ENV === "staging") return DEFAULT_STAGING_API;
  return import.meta.env.PROD ? DEFAULT_PROD_API : DEFAULT_DEV_API;
}

/** Resolved logical app tier for admin UI banners. */
export function getAppEnv(): "development" | "staging" | "production" {
  const explicit = String(import.meta.env.VITE_APP_ENV ?? "")
    .trim()
    .toLowerCase();
  if (explicit === "development" || explicit === "staging" || explicit === "production") {
    return explicit;
  }
  const api = resolveInitialApiBase();
  if (api.includes("staging-y01y") || api.includes("localhost") || api.includes("127.0.0.1")) {
    if (api.includes("staging-y01y")) return "staging";
    return "development";
  }
  return import.meta.env.PROD ? "production" : "development";
}

/** Android emulator: 127.0.0.1 is the emulator itself; 10.0.2.2 is the host Mac. */
function apiBaseForPlatform(base: string): string {
  if (
    typeof window !== "undefined" &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android" &&
    /\/\/(127\.0\.0\.1|localhost)(:\d+)?/.test(base)
  ) {
    return base.replace(/127\.0\.0\.1|localhost/g, "10.0.2.2");
  }
  return base;
}

/** Resolved at call time so Capacitor platform is available (Android 10.0.2.2 remap). */
export function getApiBase(): string {
  return apiBaseForPlatform(resolveInitialApiBase());
}

/** @deprecated Prefer `getApiBase()` — kept for `${API_BASE}` template compatibility. */
export const API_BASE = {
  toString(): string {
    return getApiBase();
  },
  valueOf(): string {
    return getApiBase();
  },
} as unknown as string;

/** Resolve relative API-served assets (e.g. "/api/assets/...") to absolute URLs. */
export function resolveApiUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  let raw = String(url).trim();
  if (!raw) return null;
  if (/^(https?:)?\/\//i.test(raw)) return raw; // http(s) or protocol-relative
  if (/^(data:|blob:)/i.test(raw)) return raw;
  // Normalize "api/assets/..." → "/api/assets/..." (DB or older clients may omit leading slash).
  if (!raw.startsWith("/") && /^api\//i.test(raw)) {
    raw = `/${raw}`;
  }
  // Only prefix backend base for API-served asset paths.
  if (!raw.startsWith("/api/")) return raw;

  const base =
    String(import.meta.env.VITE_APEX_API_BASE_URL ?? "").trim() || getApiBase();
  let normalizedBase = String(base).trim().replace(/\/+$/, "");
  // Avoid mixed-content avatar loads on HTTPS pages.
  if (/^http:\/\//i.test(normalizedBase)) {
    normalizedBase = normalizedBase.replace(/^http:\/\//i, "https://");
  }
  return `${normalizedBase}${raw}`;
}

export function getDiscussionAuthorId(author: unknown): string | null {
  if (!author || typeof author !== "object") return null;
  const id = (author as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : null;
}

/** Raw avatar string from community author JSON (`avatarUrl` or `avatar_url`). */
export function getDiscussionAuthorAvatarRaw(author: unknown): string | null {
  if (!author || typeof author !== "object") return null;
  const o = author as Record<string, unknown>;
  const v = o.avatarUrl ?? o.avatar_url;
  if (typeof v !== "string") return null;
  const s = v.trim();
  return s.length > 0 ? s : null;
}

/**
 * Same avatar resolution as /profile for your own posts: use auth user's `avatarUrl` when the
 * discussion author is the logged-in user (GET /me returns absolute URLs; community list may not).
 * Otherwise use author.avatarUrl from the discussion payload.
 */
export function resolveDiscussionAvatarSrc(
  author: unknown,
  currentUser: { id: string; avatarUrl?: string | null } | null | undefined,
): string | null {
  const authorId = getDiscussionAuthorId(author);
  if (authorId && currentUser?.id === authorId) {
    const u = currentUser.avatarUrl;
    if (typeof u === "string" && u.trim() !== "") {
      return resolveApiUrl(u.trim());
    }
  }
  return resolveApiUrl(getDiscussionAuthorAvatarRaw(author));
}
