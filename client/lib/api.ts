import { getToken } from "@/auth/token";

const DEFAULT_PROD_API = "https://apex-25ft.onrender.com";
const API_BASE =
  import.meta.env.VITE_API_URL ??
  (import.meta.env.PROD ? DEFAULT_PROD_API : "http://localhost:8080");

export { API_BASE };

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

  const base =
    import.meta.env.VITE_API_URL ??
    (import.meta.env.PROD ? DEFAULT_PROD_API : "http://localhost:8080");
  const url =
    path.startsWith("http")
      ? path
      : `${base}${path.startsWith("/") ? path : `/${path}`}`;

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
};

export async function getCompetitionSummary(): Promise<CompetitionSummary[]> {
  return apiGet<CompetitionSummary[]>("/api/competitions/summary");
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

export type Discussion = {
  id: string;
  title: string;
  description?: string;
  excerpt?: string;
  author: string;
  authorAvatar?: string | null;
  category: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
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
  author: string | { name?: string };
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
};

// authMe skips auth expired check to avoid infinite loops during session verification.
// Normalize response: backend may return { user: {...} } or {...} at top level.
export async function authMe(): Promise<AuthUser> {
  const data = await fetchApi<AuthUser | { user?: AuthUser }>("GET", "/api/auth/me", undefined, true);
  const user = (data as { user?: AuthUser }).user ?? (data as AuthUser);
  return user;
}

/** PATCH /api/auth/me — update current user (e.g. displayName). Returns updated user. */
export async function updateMe(body: { displayName: string }): Promise<AuthUser> {
  const data = await fetchApi<AuthUser | { user?: AuthUser }>("PATCH", "/api/auth/me", body, true);
  const user = (data as { user?: AuthUser }).user ?? (data as AuthUser);
  return user;
}

export async function authSignup(
  email: string,
  password: string,
  displayName?: string
): Promise<AuthUser> {
  return fetchApi<AuthUser>("POST", "/api/auth/signup", {
    email,
    password,
    displayName: displayName?.trim() || undefined,
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
  return Array.isArray(list) ? list : [];
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
      credentials: "include",
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

  if (res.status === 401 && authExpiredHandler) {
    authExpiredHandler();
  }

  if (code === "PRO_REQUIRED") {
    emitProRequiredEvent();
  }

  throw new ApiError(res.status, message);
}
