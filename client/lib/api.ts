import { getToken } from "@/auth/token";

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
  const raw = String(url).trim();
  if (!raw) return null;
  if (/^(https?:)?\/\//i.test(raw)) return raw; // http(s) or protocol-relative
  if (/^(data:|blob:)/i.test(raw)) return raw;
  // Only prefix backend base for API-served asset paths.
  if (!raw.startsWith("/api/")) return raw;

  const base = import.meta.env.VITE_APEX_API_BASE_URL ?? API_BASE;
  let normalizedBase = String(base).trim().replace(/\/+$/, "");
  // Avoid mixed-content avatar loads on HTTPS pages.
  if (/^http:\/\//i.test(normalizedBase)) {
    normalizedBase = normalizedBase.replace(/^http:\/\//i, "https://");
  }
  return `${normalizedBase}${raw}`;
}

// Standardized API error
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

// PRO_REQUIRED specific error for gated content
export class ProRequiredError extends ApiError {
  constructor(message: string = "This feature requires Apex Pro.") {
    super(403, message, "PRO_REQUIRED");
    this.name = "ProRequiredError";
  }
}

export function isProRequiredError(err: unknown): err is ProRequiredError {
  if (err instanceof ProRequiredError) return true;
  if (err instanceof ApiError && err.code === "PRO_REQUIRED") return true;
  return false;
}

// Auth expiry handler registration
let authExpiredHandler: (() => void) | null = null;

export function registerAuthExpiredHandler(handler: () => void): void {
  authExpiredHandler = handler;
}

// Pro required event emission
export const PRO_REQUIRED_EVENT = "pro_required";

function emitProRequiredEvent(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRO_REQUIRED_EVENT));
  }
}

// Extract error message from response and check for special codes
type ErrorParseResult = {
  message: string;
  code?: string;
};

async function extractErrorInfo(res: Response): Promise<ErrorParseResult> {
  try {
    const text = await res.text();
    if (!text) return { message: "Request failed" };
    try {
      const json = JSON.parse(text);
      return {
        message: json.message || json.error || text,
        code: json.code,
      };
    } catch {
      return { message: text };
    }
  } catch {
    return { message: "Request failed" };
  }
}

// Central fetch handler (exported for auth/api and other modules that need it).
// Token is always read from localStorage "apex_token"; we do NOT clear it on 401.
export async function fetchApi<T>(
  method: string,
  path: string,
  body?: unknown,
  skipAuthExpiredCheck = false
): Promise<T> {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem("apex_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const url =
    path.startsWith("http")
      ? path
      : `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;

  if (import.meta.env.DEV) {
    // Temporary dev logging to trace auth/profile requests
    // eslint-disable-next-line no-console
    console.log("[fetchApi] request", {
      method,
      url,
      hasToken: Boolean(token),
    });
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Connection lost. Please try again.");
  }

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[fetchApi] response", {
      url,
      status: res.status,
    });
  }

  if (res.ok) {
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text);
    } catch {
      return text as T;
    }
  }

  const { message, code } = await extractErrorInfo(res);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[fetchApi] response body (error)", {
      status: res.status,
      message,
      code,
    });
  }

  // Handle PRO_REQUIRED error code - throw specific error type
  if (code === "PRO_REQUIRED") {
    emitProRequiredEvent();
    throw new ProRequiredError(message);
  }

  throw new ApiError(res.status, message, code);
}

export type ProfileSummary = {
  user: {
    id: string;
    displayName: string;
    streakDays: number;
    tagline?: string;
    bio?: string;
    level?: number;
    levelProgressPct?: number;
  };
  totals: {
    races: number;
    wins: number | null;
    podiums: number | null;
    poles: number | null;
    fastestLaps: number;
    avgFinish: number | null;
  };
  weekly: {
    buckets: {
      Mon: number;
      Tue: number;
      Wed: number;
      Thu: number;
      Fri: number;
      Sat: number;
      Sun: number;
    };
    totalRaces: number;
    wins: number | null;
    avgFinish: number | null;
    totalKm: number | null;
  };
  mostPlayed: Array<{
    sim: string;
    sessions: number;
    km: number | null;
    pctOfTotal: number;
  }>;
  raceHistory: Array<{
    id: string;
    date: string;
    sim: string;
    car: string;
    track: string;
    position: number | null;
    qualiPos: number | null;
    bestLapMs: number | null;
    source?: string | null;
  }>;
  statsByGame: Array<{
    sim: string;
    races: number;
    wins: number | null;
    podiums: number | null;
    poles: number | null;
    fastestLaps: number;
    winPct: number | null;
    podiumPct: number | null;
  }>;
  insight: {
    title: string;
    body: string;
    sessionId: string;
  } | null;
};

// Social / follow system
export type FollowUser = {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  followersCount?: number;
  followingCount?: number;
};

export type FollowStatus = {
  following: boolean;
  mutual?: boolean;
};

// Profile summary endpoint is optional; current backend may not implement it yet.
// Prefer authMe() for current user; this function is not used by the main profile page.
export async function getProfileSummary(): Promise<ProfileSummary> {
  return apiGet<ProfileSummary>("/api/profile/summary");
}

export type Competition = {
  id: string;
  title: string;
  sim: string;
  track: string;
  vehicle: string;
  targetTimeMs: number | null;
  /** Weekly challenge vs tournament — drives /challenges tab grouping. */
  kind?: "challenge" | "tournament";
  status: "LIVE" | "UPCOMING" | "FINISHED";
  participants: number;
  startsAt: string | null;
  endsAt: string | null;
};

export async function getCompetitions(): Promise<Competition[]> {
  return apiGet<Competition[]>("/api/competitions");
}

export type CompetitionSummary = Competition & {
  yourBestLapMs: number | null;
  fastestLapMs: number | null;
  yourPosition: number | null;
  timeRemainingSec: number | null;
  joined: boolean;
  /** Present on /summary and GET /competitions/:id responses. */
  isSupported?: boolean;
};

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Normalize lap ms fields from camelCase or snake_case API responses. */
function normalizeCompetitionSummaryRow(row: CompetitionSummary): CompetitionSummary {
  const fastest =
    toNum(row.fastestLapMs) ??
    toNum((row as unknown as { fastest_lap_ms?: unknown }).fastest_lap_ms);
  const your =
    toNum(row.yourBestLapMs) ??
    toNum((row as unknown as { your_best_lap_ms?: unknown }).your_best_lap_ms);
  return {
    ...row,
    fastestLapMs: fastest ?? null,
    yourBestLapMs: your ?? null,
  };
}

export async function getCompetitionSummary(): Promise<CompetitionSummary[]> {
  const raw = await apiGet<CompetitionSummary[]>("/api/competitions/summary");
  return Array.isArray(raw) ? raw.map(normalizeCompetitionSummaryRow) : [];
}

/** Single competition detail (GET /api/competitions/:id). Falls back to summary list if backend has no detail endpoint. */
export type CompetitionDetail = CompetitionSummary & {
  description?: string | null;
  rules?: string[] | null;
};

export async function getCompetition(id: string): Promise<CompetitionDetail | null> {
  try {
    const data = await apiGet<CompetitionDetail>(`/api/competitions/${encodeURIComponent(id)}`);
    if (!data || typeof data !== "object") return null;
    return normalizeCompetitionSummaryRow(data as CompetitionSummary) as CompetitionDetail;
  } catch {
    return null;
  }
}

export type CompetitionsMeta = {
  activeChallenges: number;
  joinedThisSeason: number;
  yourRank: number | null;
};

export async function getCompetitionsMeta(): Promise<CompetitionsMeta> {
  return apiGet<CompetitionsMeta>("/api/competitions/meta");
}

export async function joinCompetition(
  id: string
): Promise<{ ok: boolean; competitionId: string }> {
  return apiPost<{ ok: boolean; competitionId: string }>(
    `/api/competitions/${id}/join`,
    {}
  );
}

export function isNetworkError(err: unknown): boolean {
  return (
    err instanceof TypeError ||
    (err instanceof Error && /Failed to fetch/i.test(err.message))
  );
}

// Community discussions — category query params match backend: all | setup | guides | general
export const DISCUSSION_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "setup", label: "Setups" },
  { value: "guides", label: "Guides" },
  { value: "general", label: "General" },
] as const;

export type DiscussionCategory = (typeof DISCUSSION_CATEGORIES)[number]["value"];

// Author object for community discussions/comments, returned directly by the backend.
// Shape: { id, displayName, avatarUrl }
export type DiscussionAuthor = {
  id: string;
  displayName?: string | null;
  avatarUrl?: string | null;
};

export type Discussion = {
  id: string;
  title: string;
  /** Post body from API (`content`); older code may use `description`. */
  content?: string;
  description?: string;
  excerpt?: string;
  author: DiscussionAuthor;
  category: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  /** Backend list/detail uses `commentsCount`. */
  commentsCount?: number;
  replies?: number;
  views?: number;
  isPinned?: boolean;
};

export async function getDiscussions(params?: {
  category?: string;
  q?: string;
}): Promise<Discussion[]> {
  const sp = new URLSearchParams();
  if (params?.category) sp.set("category", params.category);
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const query = sp.toString();
  const path = `/api/community/discussions${query ? `?${query}` : ""}`;
  return apiGet<Discussion[]>(path);
}

export type CreateDiscussionBody = {
  category: string;
  title: string;
  description: string;
};

export async function createDiscussion(
  body: CreateDiscussionBody
): Promise<Discussion> {
  return apiPost<Discussion>("/api/community/discussions", body);
}

export async function getDiscussion(id: string): Promise<Discussion> {
  return apiGet<Discussion>(`/api/community/discussions/${id}`);
}

export type DiscussionComment = {
  id: string;
  body: string;
  author: DiscussionAuthor;
  createdAt: string;
};

export async function getDiscussionComments(
  id: string
): Promise<DiscussionComment[]> {
  const raw = await apiGet<DiscussionComment[] | { comments?: DiscussionComment[] }>(
    `/api/community/discussions/${id}/comments`
  );
  return Array.isArray(raw) ? raw : raw?.comments ?? [];
}

export async function createDiscussionComment(
  id: string,
  body: string
): Promise<DiscussionComment> {
  return apiPost<DiscussionComment>(
    `/api/community/discussions/${id}/comments`,
    { body: body.trim() }
  );
}

// Follow / social API
export async function followUser(userId: string): Promise<FollowStatus> {
  // POST /api/users/:id/follow
  return apiPost<FollowStatus>(`/api/users/${encodeURIComponent(userId)}/follow`);
}

export async function unfollowUser(userId: string): Promise<FollowStatus> {
  // DELETE /api/users/:id/follow
  return apiDelete<FollowStatus>(`/api/users/${encodeURIComponent(userId)}/follow`);
}

export async function getFollowers(userId: string): Promise<FollowUser[]> {
  // GET /api/users/:id/followers
  return apiGet<FollowUser[]>(`/api/users/${encodeURIComponent(userId)}/followers`);
}

export async function getFollowing(userId: string): Promise<FollowUser[]> {
  // GET /api/users/:id/following
  return apiGet<FollowUser[]>(`/api/users/${encodeURIComponent(userId)}/following`);
}

export async function getFollowStatus(userId: string): Promise<FollowStatus> {
  // GET /api/users/:id/follow-status
  return apiGet<FollowStatus>(`/api/users/${encodeURIComponent(userId)}/follow-status`);
}

// Leaderboards
export type LeaderboardRow = {
  rank: number;
  displayName: string;
  value?: number | null;
  bestLapMs?: number | null;
  userId?: string;
};

export async function getLeaderboards(
  metric: string,
  limit = 10
): Promise<LeaderboardRow[]> {
  const raw = await apiGet<LeaderboardRow[] | { rows?: LeaderboardRow[]; leaderboard?: LeaderboardRow[] }>(
    `/api/leaderboards?metric=${encodeURIComponent(metric)}&limit=${limit}`
  );
  if (Array.isArray(raw)) return raw;
  const rows = raw?.rows ?? raw?.leaderboard ?? [];
  return Array.isArray(rows) ? rows : [];
}

// Auth — backend may return { id, email, displayName?, createdAt? } at top level (no user wrapper)
export type AuthUser = {
  id: string;
  email: string;
  displayName?: string;
  name?: string;
  createdAt?: string;
  hasPro?: boolean;
  avatarUrl?: string | null;
  tagline?: string | null;
  bio?: string | null;
};

/** Body for PATCH /api/auth/me. Backend may use "bio" or "tagline"; we send both so either works. */
export type UpdateMeBody = {
  displayName: string;
  avatarUrl?: string | null;
  tagline?: string | null;
  bio?: string | null;
};

// authMe skips auth expired check to avoid infinite loops during session verification.
// Normalize response: backend may return { user: {...} } or {...} at top level.
export async function authMe(): Promise<AuthUser> {
  const data = await fetchApi<AuthUser | { user?: AuthUser }>("GET", "/api/auth/me", undefined, true);
  const user = (data as { user?: AuthUser }).user ?? (data as AuthUser);
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[authMe] current-user response — avatarUrl:", (user as AuthUser).avatarUrl ?? "(missing)");
  }
  return user;
}

/** PATCH /api/auth/me — update current user (displayName, optional avatarUrl/tagline). Returns updated user. */
export async function updateMe(body: UpdateMeBody): Promise<AuthUser> {
  const data = await fetchApi<AuthUser | { user?: AuthUser }>("PATCH", "/api/auth/me", body, true);
  const user = (data as { user?: AuthUser }).user ?? (data as AuthUser);
  return user;
}

// Avatar upload – POST /api/profile/avatar with FormData (file field "avatar"). Uses fetch so we can send multipart; auth same as fetchApi.
export type UploadProfileAvatarResponse = { avatarUrl: string };

export async function uploadProfileAvatar(file: File): Promise<UploadProfileAvatarResponse> {
  const formData = new FormData();
  formData.append("avatar", file);

  const token = typeof localStorage !== "undefined" ? localStorage.getItem("apex_token") : null;
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const url = `${API_BASE}/api/profile/avatar`;
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[uploadProfileAvatar] request", {
      url,
      hasToken: Boolean(token),
      file: { name: file.name, size: file.size, type: file.type },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: formData,
  });

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[uploadProfileAvatar] response", {
      url,
      status: res.status,
    });
  }

  if (!res.ok) {
    let message = "Avatar upload failed";
    try {
      const text = await res.text();
      if (text) {
        try {
          const json = JSON.parse(text);
          message = json.message ?? json.error ?? message;
        } catch {
          message = text;
        }
      }
    } catch {
      // ignore parse error, keep default message
    }
    throw new ApiError(res.status, message);
  }

  const data = (await res.json()) as UploadProfileAvatarResponse;
  if (!data?.avatarUrl) {
    throw new ApiError(500, "No avatar URL in response");
  }
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[uploadProfileAvatar] response body avatarUrl:", data.avatarUrl, "isAbsolute:", data.avatarUrl.startsWith("http"));
  }
  return data;
}


/** Response from POST /api/auth/register. Backend may return accessToken or token, or require email verification. */
export type RegisterResponse = {
  accessToken?: string;
  token?: string;
  user?: AuthUser;
  /** If true, user must verify email before being fully authenticated; do not store token or redirect to profile. */
  requiresVerification?: boolean;
};

/** Response from POST /api/auth/verify-email. Backend may return token to auto-login or just success. */
export type VerifyEmailResponse = {
  success?: boolean;
  accessToken?: string;
  token?: string;
  user?: AuthUser;
};

/** Response from POST /api/auth/resend-verification. Backend may return cooldown. */
export type ResendVerificationResponse = {
  ok?: boolean;
  success?: boolean;
  /** Unix timestamp (seconds) when next resend is allowed; frontend can show cooldown. */
  resendAt?: number;
  /** Alternative: seconds until next resend allowed. */
  nextResendInSeconds?: number;
};

// Forgot password / reset password flows

export type ForgotPasswordResponse = {
  ok?: boolean;
  success?: boolean;
};

export type VerifyResetCodeResponse = {
  ok?: boolean;
  success?: boolean;
};

export type ResetPasswordResponse = {
  ok?: boolean;
  success?: boolean;
};

/** POST /api/auth/register — single register endpoint. Body: { name, email, password }. */
export async function authRegister(
  email: string,
  password: string,
  name?: string
): Promise<RegisterResponse> {
  return fetchApi<RegisterResponse>("POST", "/api/auth/register", {
    name: name?.trim() || undefined,
    email,
    password,
  }, true);
}

/** @deprecated Use authRegister. Kept for compatibility. */
export const authSignup = authRegister;

/** POST /api/auth/forgot-password — request reset code via email. Body: { email }. */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResponse> {
  return fetchApi<ForgotPasswordResponse>("POST", "/api/auth/forgot-password", {
    email: email.trim(),
  }, true);
}

/** POST /api/auth/verify-reset-code — verify reset code. Body: { email, code }. */
export async function verifyPasswordResetCode(
  email: string,
  code: string
): Promise<VerifyResetCodeResponse> {
  return fetchApi<VerifyResetCodeResponse>("POST", "/api/auth/verify-reset-code", {
    email: email.trim(),
    code: String(code).trim(),
  }, true);
}

/** POST /api/auth/reset-password — reset password. Body: { email, code, password }. */
export async function resetPasswordWithCode(
  email: string,
  code: string,
  password: string
): Promise<ResetPasswordResponse> {
  return fetchApi<ResetPasswordResponse>("POST", "/api/auth/reset-password", {
    email: email.trim(),
    code: String(code).trim(),
    password,
  }, true);
}

/** POST /api/auth/verify-email — submit verification code. Body: { email, code }. Returns token if backend auto-completes auth. */
export async function verifyEmail(email: string, code: string): Promise<VerifyEmailResponse> {
  return fetchApi<VerifyEmailResponse>("POST", "/api/auth/verify-email", {
    email: email.trim(),
    code: String(code).trim(),
  }, true);
}

/** POST /api/auth/resend-verification-code — request new code. Body: { email }. */
export async function resendVerificationCode(email: string): Promise<ResendVerificationResponse> {
  return fetchApi<ResendVerificationResponse>("POST", "/api/auth/resend-verification-code", {
    email: email.trim(),
  }, true);
}

export type LoginResponse = AuthUser & { accessToken?: string };

export async function authLogin(
  email: string,
  password: string
): Promise<LoginResponse> {
  return fetchApi<LoginResponse>("POST", "/api/auth/login", { email, password }, true);
}

export async function authLogout(): Promise<void> {
  await fetchApi<{ ok?: boolean }>("POST", "/api/auth/logout", undefined, true);
}

export async function updateProfile(displayName: string): Promise<AuthUser> {
  return fetchApi<AuthUser>("PATCH", "/api/settings/profile", { displayName: displayName.trim() });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ ok?: boolean }> {
  return fetchApi<{ ok?: boolean }>("POST", "/api/settings/change-password", {
    currentPassword,
    newPassword,
  });
}

export async function deleteAccount(password: string): Promise<{ ok?: boolean }> {
  return fetchApi<{ ok?: boolean }>("DELETE", "/api/settings/account", { password }, true);
}

export async function apiGet<T>(path: string): Promise<T> {
  return fetchApi<T>("GET", path);
}

export type SessionsFilterType = "all" | "telemetry" | "manual";

export async function getActivity(type: SessionsFilterType = "all"): Promise<unknown[]> {
  const q = `?type=${encodeURIComponent(type)}`;
  const raw = await apiGet<unknown[] | { sessions?: unknown[]; activity?: unknown[] }>(
    `/api/activity${q}`
  );
  const list = Array.isArray(raw)
    ? raw
    : (raw as { sessions?: unknown[] }).sessions ??
      (raw as { activity?: unknown[] }).activity ??
      [];
  const arr = Array.isArray(list) ? list : [];

  function toNumber(v: unknown): number | null {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string") {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
    return null;
  }

  function normalizeFeedSession(item: unknown): unknown {
    if (!item || typeof item !== "object") return item;
    const outer = item as any;
    const inner =
      outer.session && typeof outer.session === "object" ? (outer.session as any) : null;

    // Merge outer+inner like SessionDetailPage unwrapping.
    const merged: any = {
      ...(outer ?? {}),
      ...(inner ?? {}),
    };

    // Normalize best lap time field into bestLapMs (used by ActivityCard).
    const bestLapMs =
      toNumber(merged.bestLapMs) ??
      toNumber(merged.bestLapTimeMs) ??
      toNumber(merged.best_lap_ms) ??
      toNumber(merged.bestLapTime) ??
      toNumber(merged.best_lap_time_ms) ??
      toNumber(merged.fastestLapMs) ??
      toNumber(merged.fastest_lap_ms) ??
      (merged.bestLap && typeof merged.bestLap === "object"
        ? toNumber((merged.bestLap as any).lapTimeMs) ?? toNumber((merged.bestLap as any).timeMs)
        : null);

    if (bestLapMs != null) merged.bestLapMs = bestLapMs;

    return merged;
  }

  return arr.map(normalizeFeedSession);
}

// Billing / Upgrade
export type EntitlementPlan = "FREE" | "PRO";

export type UpgradeInfo = {
  effectivePlan: EntitlementPlan;
  canUpgrade: boolean;
  message: string;
};

export async function getUpgradeInfo(): Promise<UpgradeInfo> {
  return apiGet<UpgradeInfo>("/api/billing/upgrade-info");
}

export type SystemStatusResponse = {
  environment?: string;
  version?: string;
  uptime?: number | string;
  db?: { status?: string; latencyMs?: number };
  featureFlags?: string[];
};

export async function getSystemStatus(): Promise<SystemStatusResponse> {
  return apiGet<SystemStatusResponse>("/api/system/status");
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return fetchApi<T>("POST", path, body);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return fetchApi<T>("PATCH", path, body);
}

export async function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return fetchApi<T>("DELETE", path, body);
}

// Manual session upload
export type ManualUploadResponse = {
  sessionId: string;
  message?: string;
};

// Manual activity creation (no file upload)
export type ManualActivityRequest = {
  sim: string;
  trackId: string;
  carId?: string;
  position?: number;
  totalDrivers?: number;
  bestLapMs?: number;
  notes?: string;
};

export type ManualActivityResponse = {
  sessionId: string;
  message?: string;
};

export async function createManualActivity(
  data: ManualActivityRequest
): Promise<ManualActivityResponse> {
  return apiPost<ManualActivityResponse>("/api/sessions/manual-activity", data);
}

export async function updateManualActivity(
  sessionId: string,
  data: ManualActivityRequest
): Promise<ManualActivityResponse> {
  return fetchApi<ManualActivityResponse>(
    "PUT",
    `/api/sessions/manual-activity/${sessionId}`,
    data
  );
}

export async function deleteManualActivity(sessionId: string): Promise<void> {
  return fetchApi<void>("DELETE", `/api/sessions/manual-activity/${sessionId}`);
}

export type CatalogTrack = { id: string; name: string };
export type CatalogCar = { id: string; name: string };
export type CatalogsResponse = {
  tracks: CatalogTrack[];
  cars: CatalogCar[];
};

export async function getCatalogs(sim: string): Promise<CatalogsResponse> {
  return apiGet<CatalogsResponse>(`/api/catalogs/${encodeURIComponent(sim)}`);
}

export async function uploadSessionFile(file: File): Promise<ManualUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/sessions/manual-upload`, {
      method: "POST",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
      body: formData,
    });
  } catch {
    throw new ApiError(0, "Connection lost. Please try again.");
  }

  if (res.ok) {
    const text = await res.text();
    if (!text) throw new ApiError(500, "No response from server");
    try {
      return JSON.parse(text);
    } catch {
      throw new ApiError(500, "Invalid response from server");
    }
  }

  const { message, code } = await extractErrorInfo(res);

  if (code === "PRO_REQUIRED") {
    emitProRequiredEvent();
  }

  throw new ApiError(res.status, message, code);
}
