import { fetchApi } from "./fetchClient";

export type AdminAuthSessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  suspendedAt: string | null;
  isDeleted: boolean;
};

/** One row per user with active web sessions (aggregated). */
export type AdminAuthSessionUserSummaryRow = {
  user: AdminAuthSessionUser;
  activeSessionCount: number;
  /** Distinct browser installations (X-Apex-Device-Id when present). */
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
  user: AdminAuthSessionUser;
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
