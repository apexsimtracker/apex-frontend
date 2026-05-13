import { fetchApi } from "./fetchClient";

export type AdminEmailVerificationUserRow = {
  id: string;
  email: string;
  displayName: string;
  emailVerified: boolean;
  emailVerificationExpiresAt: string | null;
  emailStatus: "VALID" | "DISPOSABLE" | "RISKY";
  emailRiskScore: number;
};

export type AdminEmailVerificationUsersParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  /** `pending` = code not expired; `expired` = code present but expired or missing expiry */
  status?: "pending" | "expired";
};

export async function fetchAdminEmailVerificationUsers(params?: AdminEmailVerificationUsersParams): Promise<{
  items: AdminEmailVerificationUserRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  status: "pending" | "expired";
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.status) sp.set("status", params.status);
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/email-verification/users${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export type AdminPasswordResetPendingRow = {
  id: string;
  emailMasked: string;
  expiresAt: string;
  attempts: number;
  createdAt: string;
};

export async function fetchAdminPasswordResetPending(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
}): Promise<{
  items: AdminPasswordResetPendingRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/password-reset/pending${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function postAdminEmailVerificationResend(userId: string): Promise<{
  ok: boolean;
  expiresAt: string;
}> {
  return fetchApi(
    "POST",
    `/api/admin/email-verification/users/${encodeURIComponent(userId)}/resend`,
    {},
    false
  );
}
