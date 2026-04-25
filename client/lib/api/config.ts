/**
 * API base URL resolution (unchanged from monolithic `api.ts`).
 * Relevant env vars: `VITE_API_URL`, `VITE_APEX_API_BASE_URL` (see Vite `import.meta.env`), `import.meta.env.PROD`.
 */
/** Production backend (Render). Used when VITE_API_URL is unset in production builds. */
const DEFAULT_PROD_API = "https://apex-25ft.onrender.com";

/** Default local API port (matches apex `PORT` default 10000, not the Vite dev port 8080). */
const DEFAULT_DEV_API = "http://127.0.0.1:10000";

/** Single source of truth for API base: VITE_API_URL, VITE_APEX_API_BASE_URL, or dev/prod defaults. */
const API_BASE =
  import.meta.env.VITE_API_URL ??
  // Back-compat: some envs use this name in local dev.
  import.meta.env.VITE_APEX_API_BASE_URL ??
  (import.meta.env.PROD ? DEFAULT_PROD_API : DEFAULT_DEV_API);

export { API_BASE };

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
    String(import.meta.env.VITE_APEX_API_BASE_URL ?? "").trim() || API_BASE;
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
  currentUser: { id: string; avatarUrl?: string | null } | null | undefined
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
