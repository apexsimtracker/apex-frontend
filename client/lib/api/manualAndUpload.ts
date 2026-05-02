import { getToken } from "@/auth/token";
import { API_BASE } from "./config";
import { ApiError } from "./errors";
import { fetchApi, notifyAuthExpired, emitProRequiredEvent } from "./fetchClient";
import { apiGet, apiPost } from "./httpVerbs";

// Manual session upload
export type ManualUploadResponse = {
  sessionId: string;
  status?: string;
  lapCount?: number;
  message?: string;
  /** Present when a challenge was requested but could not be attached. */
  challengeAttachWarning?: string;
};

export type UploadSessionFileCallbacks = {
  onUploadProgress?: (percent: number) => void;
  /** Fired when the request body has finished sending; server may still be processing. */
  onUploadComplete?: () => void;
};

// Manual activity creation (no file upload)
export type ManualActivityRequest = {
  sim: string;
  trackId: string;
  /** PRACTICE | QUALIFY | RACE */
  manualSessionKind: "PRACTICE" | "QUALIFY" | "RACE";
  carId?: string;
  position?: number;
  totalDrivers?: number;
  /** Race sessions: qualifying finishing position. */
  qualifyingPosition?: number;
  /** Legacy single lap; ignored by API when `laps` is non-empty. */
  bestLapMs?: number;
  /** Ordered lap times (ms). */
  laps?: { lapTimeMs: number }[];
  notes?: string;
  /** Link session to a challenge (must be active; you must have joined; track/car must match). */
  challengeId?: string;
};

export type ManualActivityResponse = {
  sessionId: string;
  message?: string;
};

/**
 * Build JSON body so `laps` is never lost: `JSON.stringify` drops keys whose value is `undefined`,
 * which previously omitted `laps` and led to sessions with no Lap rows.
 * When laps are present, also sends `bestLapMs` (min) so the server always has a fallback field.
 */
export function buildManualActivityRequestBody(
  data: ManualActivityRequest
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    sim: data.sim,
    trackId: data.trackId,
    manualSessionKind: data.manualSessionKind,
  };
  if (data.carId != null && String(data.carId).trim() !== "") {
    body.carId = data.carId;
  }
  if (data.position != null && Number.isFinite(data.position)) {
    body.position = data.position;
  }
  if (data.totalDrivers != null && Number.isFinite(data.totalDrivers)) {
    body.totalDrivers = data.totalDrivers;
  }
  if (
    data.qualifyingPosition != null &&
    Number.isFinite(data.qualifyingPosition)
  ) {
    body.qualifyingPosition = Math.round(data.qualifyingPosition as number);
  }
  if (data.notes != null && String(data.notes).trim() !== "") {
    body.notes = String(data.notes).trim();
  }

  const laps = Array.isArray(data.laps)
    ? data.laps
        .filter(
          (l) =>
            l &&
            typeof l.lapTimeMs === "number" &&
            Number.isFinite(l.lapTimeMs)
        )
        .map((l) => ({ lapTimeMs: Math.round(l.lapTimeMs) }))
    : [];

  if (laps.length > 0) {
    body.laps = laps;
    body.bestLapMs = Math.min(...laps.map((l) => l.lapTimeMs));
  } else if (data.bestLapMs != null && Number.isFinite(data.bestLapMs)) {
    body.bestLapMs = Math.round(data.bestLapMs);
  }

  if (data.challengeId != null && String(data.challengeId).trim() !== "") {
    body.challengeId = String(data.challengeId).trim();
  }

  return body;
}

export async function createManualActivity(
  data: ManualActivityRequest
): Promise<ManualActivityResponse> {
  return apiPost<ManualActivityResponse>(
    "/api/sessions/manual-activity",
    buildManualActivityRequestBody(data)
  );
}

/** Owner session update (manual + telemetry); canonical route is PUT /api/sessions/:id. */
export async function updateActivity(
  sessionId: string,
  data: ManualActivityRequest
): Promise<ManualActivityResponse> {
  return fetchApi<ManualActivityResponse>(
    "PUT",
    `/api/sessions/${encodeURIComponent(sessionId)}`,
    buildManualActivityRequestBody(data)
  );
}

export async function updateManualActivity(
  sessionId: string,
  data: ManualActivityRequest
): Promise<ManualActivityResponse> {
  return updateActivity(sessionId, data);
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

function parseXhrErrorPayload(text: string): {
  message: string;
  code?: string;
  retryAfterMs?: number;
} {
  let message = "Request failed";
  let code: string | undefined;
  let retryAfterMs: number | undefined;
  if (!text.trim()) {
    return { message };
  }
  try {
    const json = JSON.parse(text) as Record<string, unknown>;
    message =
      (typeof json.message === "string" && json.message) ||
      (typeof json.error === "string" && json.error) ||
      message;
    if (typeof json.code === "string") code = json.code;
    const retryRaw = json.retryAfterMs;
    if (typeof retryRaw === "number" && Number.isFinite(retryRaw)) retryAfterMs = retryRaw;
  } catch {
    message = text;
  }
  return { message, code, retryAfterMs };
}

export async function uploadSessionFile(
  file: File,
  callbacks?: UploadSessionFileCallbacks,
  options?: { challengeId?: string }
): Promise<ManualUploadResponse> {
  const formData = new FormData();
  formData.append("file", file);
  if (options?.challengeId?.trim()) {
    formData.append("challengeId", options.challengeId.trim());
  }

  const token = getToken();
  const url = `${API_BASE}/api/sessions/manual-upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    // Do not set `withCredentials`: API CORS uses `credentials: false`; credentialed XHR breaks
    // cross-origin uploads (e.g. Vite on :8080 → API on :10000). Session auth uses Bearer token.
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (ev) => {
      if (!callbacks?.onUploadProgress) return;
      const total = ev.lengthComputable ? ev.total : file.size;
      if (total > 0) {
        const pct = Math.min(100, Math.round((ev.loaded / total) * 100));
        callbacks.onUploadProgress(pct);
      }
    };

    xhr.upload.addEventListener("load", () => {
      callbacks?.onUploadComplete?.();
    });

    xhr.onload = () => {
      void (async () => {
        const status = xhr.status;
        const text = xhr.responseText ?? "";

        if (status >= 200 && status < 300) {
          if (!text.trim()) {
            reject(new ApiError(500, "No response from server"));
            return;
          }
          try {
            resolve(JSON.parse(text) as ManualUploadResponse);
          } catch {
            reject(new ApiError(500, "Invalid response from server"));
          }
          return;
        }

        await notifyAuthExpired(false, status);
        const { message, code, retryAfterMs } = parseXhrErrorPayload(text);
        if (code === "PRO_REQUIRED") emitProRequiredEvent();
        reject(new ApiError(status, message, code, retryAfterMs));
      })();
    };

    xhr.onerror = () => {
      reject(new ApiError(0, "Connection lost. Please try again."));
    };

    xhr.send(formData);
  });
}
