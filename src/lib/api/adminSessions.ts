import { fetchApi } from "./fetchClient";
import type {
  LapTimingHighlights,
  SessionTimingMinima,
} from "@/lib/sessionLapDisplay";
import {
  buildManualActivityRequestBody,
  type ManualActivityRequest,
  type ManualActivityResponse,
} from "./manualAndUpload";

export type AdminSessionListRow = {
  id: string;
  userId: string;
  userDisplayName: string;
  sim: string;
  track: string;
  car: string;
  sessionType: string | null;
  manualSessionKind: string | null;
  ingestSource: string | null;
  challengeId: string | null;
  challengeTitle: string | null;
  lapCount: number;
  bestLapMs: number | null;
  invalidLapCount: number;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingDurationMs: number | null;
  clientSessionId: string | null;
  createdAt: string;
};

export type AdminSessionListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  userId?: string;
  sim?: string;
  challengeId?: string;
  from?: string;
  to?: string;
  zeroLaps?: boolean;
  processingStuck?: boolean;
  hasInvalidLaps?: boolean;
  missingTelemetry?: boolean;
  maxLapMs?: number;
  multipleBestLaps?: boolean;
  sessionType?: string;
  manualSessionKind?: string;
};

export async function fetchAdminSessionList(
  params?: AdminSessionListParams,
): Promise<{
  items: AdminSessionListRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.userId?.trim()) sp.set("userId", params.userId.trim());
  if (params?.sim?.trim()) sp.set("sim", params.sim.trim());
  if (params?.challengeId?.trim())
    sp.set("challengeId", params.challengeId.trim());
  if (params?.from) sp.set("from", params.from);
  if (params?.to) sp.set("to", params.to);
  if (params?.zeroLaps) sp.set("zeroLaps", "true");
  if (params?.processingStuck) sp.set("processingStuck", "true");
  if (params?.hasInvalidLaps) sp.set("hasInvalidLaps", "true");
  if (params?.missingTelemetry) sp.set("missingTelemetry", "true");
  if (params?.maxLapMs != null) sp.set("maxLapMs", String(params.maxLapMs));
  if (params?.multipleBestLaps) sp.set("multipleBestLaps", "true");
  if (params?.sessionType?.trim())
    sp.set("sessionType", params.sessionType.trim());
  if (params?.manualSessionKind?.trim()) {
    sp.set("manualSessionKind", params.manualSessionKind.trim());
  }
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/sessions${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export type AdminSessionLapRow = {
  id: string;
  lapNumber: number;
  lapTimeMs: number;
  sector1Ms: number | null;
  sector2Ms: number | null;
  sector3Ms: number | null;
  isValid: boolean;
  isBestLap: boolean;
  createdAt: string;
  hasTelemetry: boolean;
  telemetrySampleCount: number | null;
  telemetry?: unknown;
  highlights?: LapTimingHighlights | null;
};

export type AdminSessionDetail = {
  id: string;
  userId: string;
  userDisplayName: string;
  driverName: string | null;
  track: string;
  car: string;
  sim: string;
  sessionType: string | null;
  manualSessionKind: string | null;
  position: number | null;
  qualifyingPosition: number | null;
  totalDrivers: number | null;
  challengeId: string | null;
  caption: string | null;
  ingestSource: string | null;
  challengeTitle: string | null;
  challengeStatus: string | null;
  processingStartedAt: string | null;
  processingCompletedAt: string | null;
  processingDurationMs: number | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  laps: AdminSessionLapRow[];
  sessionTimingMinima?: SessionTimingMinima | null;
};

export async function fetchAdminSessionDetail(
  sessionId: string,
  options?: { includeTelemetry?: boolean },
): Promise<AdminSessionDetail> {
  const sp = new URLSearchParams();
  if (options?.includeTelemetry) sp.set("includeTelemetry", "true");
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export type AdminSessionExportJob = {
  id: string;
  depth: "summary" | "full";
  scope: "user" | "session";
  sessionId?: string;
  status: "pending" | "processing" | "ready" | "failed" | "expired";
  requestedAt: string;
  completedAt?: string;
  expiresAt?: string;
  byteSize?: number;
  downloadUrl?: string;
  error?: { code: string; message: string };
};

/** POST /api/admin/sessions/:id/data-export — async telemetry zip (202). */
export async function requestAdminSessionDataExport(
  sessionId: string,
  options?: { depth?: "summary" | "full" },
): Promise<AdminSessionExportJob> {
  const res = await fetchApi<{ job: AdminSessionExportJob }>(
    "POST",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}/data-export`,
    { depth: options?.depth ?? "full" },
    false,
  );
  return res.job;
}

/** GET /api/admin/sessions/data-export/:jobId */
export async function fetchAdminSessionDataExportJob(
  jobId: string,
): Promise<AdminSessionExportJob> {
  const res = await fetchApi<{ job: AdminSessionExportJob }>(
    "GET",
    `/api/admin/sessions/data-export/${encodeURIComponent(jobId)}`,
    undefined,
    false,
  );
  return res.job;
}

/** Same body shape as {@link updateActivity} / PUT `/api/sessions/:id`; admin-only route applies edits on behalf of the session owner. */
export async function putAdminSessionActivity(
  sessionId: string,
  data: ManualActivityRequest,
): Promise<ManualActivityResponse> {
  return fetchApi(
    "PUT",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}/activity`,
    buildManualActivityRequestBody(data),
    false,
  );
}

export type AdminSessionPatchBody = {
  driverName?: string | null;
  track?: string;
  car?: string;
  sim?: string;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  position?: number | null;
  qualifyingPosition?: number | null;
  totalDrivers?: number | null;
  challengeId?: string | null;
  caption?: string | null;
};

export async function patchAdminSession(
  sessionId: string,
  body: AdminSessionPatchBody,
): Promise<{ ok: boolean; id: string }> {
  return fetchApi(
    "PATCH",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}`,
    body,
    false,
  );
}

export async function deleteAdminSession(
  sessionId: string,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}`,
    undefined,
    false,
  );
}

export async function bulkDeleteAdminSessions(
  ids: string[],
): Promise<{ ok: boolean; deleted: number }> {
  return fetchApi("POST", "/api/admin/sessions/bulk-delete", { ids }, false);
}

export type AdminLapPatchBody = {
  lapTimeMs?: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  isValid?: boolean;
  isBestLap?: boolean;
};

export async function patchAdminSessionLap(
  sessionId: string,
  lapId: string,
  body: AdminLapPatchBody,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "PATCH",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}/laps/${encodeURIComponent(lapId)}`,
    body,
    false,
  );
}

export type AdminLapCreateBody = {
  lapTimeMs: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  isValid?: boolean;
};

export async function createAdminSessionLap(
  sessionId: string,
  body: AdminLapCreateBody,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "POST",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}/laps`,
    body,
    false,
  );
}

export async function deleteAdminSessionLap(
  sessionId: string,
  lapId: string,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/sessions/${encodeURIComponent(sessionId)}/laps/${encodeURIComponent(lapId)}`,
    undefined,
    false,
  );
}

export async function postAdminReconcileChallengeLeaderboard(body: {
  challengeId: string;
  userId: string;
}): Promise<{ ok: boolean }> {
  return fetchApi(
    "POST",
    "/api/admin/sessions/reconcile-leaderboard",
    body,
    false,
  );
}

export type AdminDuplicateCluster = {
  sessionIds: string[];
  keepSessionId: string;
  track: string;
  car: string;
  sessionType: string;
  userId: string;
  sim: string;
  bestLapMs: number | null;
  lapCount: number;
  sessions: Array<{
    id: string;
    createdAt: string;
    lapCount: number;
    clientSessionId: string | null;
    bestLapMs: number | null;
  }>;
};

export async function fetchAdminDuplicateClusters(params?: {
  userId?: string;
  sim?: string;
  windowHours?: number;
}): Promise<{ clusters: AdminDuplicateCluster[] }> {
  const sp = new URLSearchParams();
  if (params?.userId?.trim()) sp.set("userId", params.userId.trim());
  if (params?.sim?.trim()) sp.set("sim", params.sim.trim());
  if (params?.windowHours != null)
    sp.set("windowHours", String(params.windowHours));
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/sessions/duplicates${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export async function mergeAdminDuplicateSessions(body: {
  keepSessionId: string;
  mergeSessionIds: string[];
}): Promise<{
  ok: boolean;
  keepSessionId: string;
  mergedCount: number;
  lapCount: number;
}> {
  return fetchApi("POST", "/api/admin/sessions/merge", body, false);
}
