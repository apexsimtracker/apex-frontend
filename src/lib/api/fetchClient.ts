import { getApiBase } from "./config";
import { getOrCreateDeviceId } from "@/auth/deviceId";
import { APEX_SESSION_TOKEN_KEY } from "@/auth/token";
import { ApiError, ProRequiredError } from "./errors";
import { recordApiTiming } from "@/lib/apexRum";

// Auth expiry handler registration (e.g. AuthProvider: re-fetch /api/auth/me or clear user).
let authExpiredHandler: (() => void | Promise<void>) | null = null;

export function registerAuthExpiredHandler(
  handler: () => void | Promise<void>,
): void {
  authExpiredHandler = handler;
}

/** Invoked on HTTP 401 from fetchApi (unless skipAuthExpiredCheck). Not exported — use registerAuthExpiredHandler. */
export async function notifyAuthExpired(
  skipAuthExpiredCheck: boolean,
  status: number,
): Promise<void> {
  if (skipAuthExpiredCheck || status !== 401 || !authExpiredHandler) return;
  try {
    await Promise.resolve(authExpiredHandler());
  } catch {
    // Handler errors should not mask the original ApiError.
  }
}

// Pro required event emission
export const PRO_REQUIRED_EVENT = "pro_required";

export function emitProRequiredEvent(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PRO_REQUIRED_EVENT));
  }
}

// Extract error message from response and check for special codes
type ErrorParseResult = {
  message: string;
  code?: string;
  retryAfterMs?: number;
  suspensionReason?: string | null;
};

const TOKEN_KEY = "apex_token";

/**
 * Auth headers shared by fetchApi and XMLHttpRequest uploads (manual .ibt).
 * JWT must pair with X-Apex-Session for sessionAuthHook routes.
 */
export function buildApiAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof localStorage === "undefined") return headers;

  const token = localStorage.getItem(TOKEN_KEY);
  const serverSession = localStorage.getItem(APEX_SESSION_TOKEN_KEY);
  const deviceId = getOrCreateDeviceId();

  if (token) headers.Authorization = `Bearer ${token}`;
  const sessionTrimmed = serverSession?.trim();
  if (sessionTrimmed) headers["X-Apex-Session"] = sessionTrimmed;
  if (deviceId) headers["X-Apex-Device-Id"] = deviceId;

  return headers;
}

export async function extractErrorInfo(
  res: Response,
): Promise<ErrorParseResult> {
  try {
    const text = await res.text();
    if (!text) return { message: "Request failed" };
    try {
      const json = JSON.parse(text) as Record<string, unknown>;
      const retryRaw = json.retryAfterMs;
      const retryAfterMs =
        typeof retryRaw === "number" && Number.isFinite(retryRaw)
          ? retryRaw
          : undefined;
      const sr = json.suspensionReason;
      const suspensionReason =
        sr === null ? null : typeof sr === "string" ? sr : undefined;
      return {
        message: (json.message as string) || (json.error as string) || text,
        code: json.code as string | undefined,
        retryAfterMs,
        ...(suspensionReason !== undefined ? { suspensionReason } : {}),
      };
    } catch {
      return { message: text };
    }
  } catch {
    return { message: "Request failed" };
  }
}

export type FetchApiOptions = {
  /** When true, skip calling the auth-expired handler on 401 (login, register, authMe, etc.). */
  skipAuthExpiredCheck?: boolean;
  /** Only set for cross-origin cookie endpoints (e.g. discussion view anon cookie). */
  credentials?: RequestCredentials;
};

// Central fetch handler (exported for auth/api and other modules that need it).
// Token is read from localStorage "apex_token". On 401, notifyAuthExpired runs the registered handler
// (unless skipAuthExpiredCheck) so AuthContext can sync user state; token clearing is left to the handler/backend.
export async function fetchApi<T>(
  method: string,
  path: string,
  body?: unknown,
  options: boolean | FetchApiOptions = false,
): Promise<T> {
  const opts: FetchApiOptions =
    typeof options === "boolean" ? { skipAuthExpiredCheck: options } : options;
  const skipAuthExpiredCheck = opts.skipAuthExpiredCheck ?? false;
  const hasJsonBody = body !== undefined;
  const headers: Record<string, string> = {
    // Only when we send a body: Fastify rejects Content-Type: application/json with an empty body.
    ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
    ...buildApiAuthHeaders(),
  };

  const url = path.startsWith("http")
    ? path
    : `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;

  const rumStarted = performance.now();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      ...(opts.credentials ? { credentials: opts.credentials } : {}),
      body: hasJsonBody ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Connection lost. Please try again.");
  }
  recordApiTiming(method, path, res, rumStarted);

  if (res.ok) {
    const text = await res.text();
    if (!text) return undefined as T;
    try {
      return JSON.parse(text);
    } catch {
      return text as T;
    }
  }

  const { message, code, retryAfterMs, suspensionReason } =
    await extractErrorInfo(res);

  // Handle PRO_REQUIRED error code - throw specific error type
  if (code === "PRO_REQUIRED") {
    emitProRequiredEvent();
    throw new ProRequiredError(message);
  }

  await notifyAuthExpired(skipAuthExpiredCheck, res.status);

  const err = new ApiError(res.status, message, code, retryAfterMs);
  if (suspensionReason !== undefined) {
    err.suspensionReason = suspensionReason;
  }
  throw err;
}
