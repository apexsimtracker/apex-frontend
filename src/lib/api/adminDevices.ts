import { fetchApi } from "./fetchClient";

export type AdminDeviceUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  suspendedAt: string | null;
  isDeleted: boolean;
};

export type AdminDeviceRow = {
  id: string;
  name: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  user: AdminDeviceUser;
};

export type AdminDeviceListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  staleDays?: number;
  includeRevoked?: boolean;
  sort?: "lastSeenAt_desc" | "createdAt_desc";
};

export async function fetchAdminDeviceList(params?: AdminDeviceListParams): Promise<{
  items: AdminDeviceRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.staleDays != null && params.staleDays > 0) sp.set("staleDays", String(params.staleDays));
  if (params?.includeRevoked) sp.set("includeRevoked", "true");
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return fetchApi("GET", `/api/admin/devices${qs ? `?${qs}` : ""}`, undefined, false);
}

/** One agent device by id (same payload as a list row). */
export async function fetchAdminDevice(deviceId: string): Promise<AdminDeviceRow> {
  return fetchApi(
    "GET",
    `/api/admin/devices/${encodeURIComponent(deviceId)}`,
    undefined,
    false
  );
}

export async function patchAdminDevice(deviceId: string, body: { name: string }): Promise<{ ok: boolean }> {
  return fetchApi("PATCH", `/api/admin/devices/${encodeURIComponent(deviceId)}`, body, false);
}

export async function deleteAdminDevice(deviceId: string, reason?: string): Promise<void> {
  let q = "";
  if (reason !== undefined && reason.trim() !== "") {
    q = `?reason=${encodeURIComponent(reason.trim())}`;
  }
  await fetchApi("DELETE", `/api/admin/devices/${encodeURIComponent(deviceId)}${q}`, undefined, false);
}

/** One row per user with active web sessions (aggregated). */
export type AdminAuthSessionUserSummaryRow = {
  user: AdminDeviceUser;
  activeSessionCount: number;
  /** Distinct browsers/devices (client id or UA hash fallback). */
  distinctDeviceCount: number;
  maxRiskScore: number;
  /** Sessions at or above default suspicion threshold (50). */
  suspiciousSessionCount: number;
  lastActiveAt: string | null;
  soonestExpiresAt: string;
};

export type AdminAuthSessionDetailRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string | null;
  clientDeviceId: string | null;
  userAgentSummary: string | null;
  ipFirstSeenMasked: string | null;
  ipLastSeenMasked: string | null;
  geoLabel: string | null;
  geoCountry: string | null;
  riskScore: number;
  riskFlags: string[];
  riskComputedAt: string | null;
  revokedAt: string | null;
  revoked: boolean;
  expired: boolean;
  /** Still usable for API access (not expired and not revoked). */
  isActive: boolean;
};

export type AdminAuthSessionUsersListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  suspiciousOnly?: boolean;
  minRisk?: number;
};

export async function fetchAdminAuthSessionUsersList(params?: AdminAuthSessionUsersListParams): Promise<{
  items: AdminAuthSessionUserSummaryRow[];
  page: number;
  pageSize: number;
  /** Distinct users with ≥1 active session (pagination total). */
  total: number;
  /** Count of usable AuthSession rows: non-expired and not revoked (same basis as admin metrics “Web sessions (active)”). */
  totalActiveRows: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.suspiciousOnly) sp.set("suspiciousOnly", "true");
  if (params?.minRisk != null && params.minRisk >= 0) sp.set("minRisk", String(params.minRisk));
  const qs = sp.toString();
  return fetchApi("GET", `/api/admin/auth-sessions/users${qs ? `?${qs}` : ""}`, undefined, false);
}

export type FetchAdminAuthSessionsForUserParams = {
  page?: number;
  pageSize?: number;
  /** Default active — non-expired only. `all` includes expired history rows. */
  scope?: "active" | "all";
};

export async function fetchAdminAuthSessionsForUser(
  userId: string,
  params?: FetchAdminAuthSessionsForUserParams
): Promise<{
  user: AdminDeviceUser;
  scope: "active" | "all";
  items: AdminAuthSessionDetailRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.scope === "all") sp.set("scope", "all");
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/auth-sessions/user/${encodeURIComponent(userId)}${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function postAdminAuthSessionsRecomputeRisk(userId: string): Promise<{
  ok: boolean;
  updated: number;
}> {
  return fetchApi(
    "POST",
    `/api/admin/auth-sessions/user/${encodeURIComponent(userId)}/recompute-risk`,
    undefined,
    false
  );
}

export async function postAdminAuthSessionsBulkDelete(
  userId: string,
  sessionIds: string[]
): Promise<{ ok: boolean; deleted: number }> {
  return fetchApi(
    "POST",
    `/api/admin/auth-sessions/user/${encodeURIComponent(userId)}/bulk-delete`,
    { sessionIds },
    false
  );
}

export async function postRevokeAdminAuthSession(
  sessionId: string
): Promise<{ ok: boolean; alreadyRevoked?: boolean }> {
  return fetchApi(
    "POST",
    `/api/admin/auth-sessions/${encodeURIComponent(sessionId)}/revoke`,
    undefined,
    false
  );
}

export async function deleteAllAdminAuthSessionsForUser(userId: string): Promise<{
  ok: boolean;
  revokedCount: number;
}> {
  return fetchApi(
    "DELETE",
    `/api/admin/auth-sessions/user/${encodeURIComponent(userId)}`,
    undefined,
    false
  );
}
