// Standardized API error
export class ApiError extends Error {
  status: number;
  code?: string;
  /** Present on some responses (e.g. 429 data export) for client messaging. */
  retryAfterMs?: number;
  /** Set when login is rejected for a suspended account (optional admin note). */
  suspensionReason?: string | null;
  constructor(status: number, message: string, code?: string, retryAfterMs?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.retryAfterMs = retryAfterMs;
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
