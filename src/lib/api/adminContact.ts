import { fetchApi } from "./fetchClient";

export type ContactSubmissionStatus =
  | "NEW"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "ARCHIVED"
  | "SPAM";

export type AdminContactListItem = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string | null;
  status: ContactSubmissionStatus;
  hasSubmitter: boolean;
  hasLinkedUser: boolean;
};

export type AdminContactListResponse = {
  items: AdminContactListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminContactUserSummary = {
  id: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  emailVerified: boolean;
  suspendedAt: string | null;
  isDeleted: boolean;
  plan: string;
  entitlementStatus: string | null;
};

export type AdminContactDetail = {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  requestId: string;
  ip: string | null;
  status: ContactSubmissionStatus;
  internalNotes: string | null;
  submitterUserId: string | null;
  linkedUserId: string | null;
  submitterEmailMismatch: boolean;
  submitterUser: AdminContactUserSummary | null;
  linkedUser: AdminContactUserSummary | null;
};

export type AdminContactListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  status?: string;
  hasLinkedUser?: "true" | "false";
  hasSubmitter?: "true" | "false";
  from?: string;
  to?: string;
};

export async function fetchAdminContactList(
  params?: AdminContactListParams
): Promise<AdminContactListResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.status?.trim()) sp.set("status", params.status.trim());
  if (params?.hasLinkedUser) sp.set("hasLinkedUser", params.hasLinkedUser);
  if (params?.hasSubmitter) sp.set("hasSubmitter", params.hasSubmitter);
  if (params?.from?.trim()) sp.set("from", params.from.trim());
  if (params?.to?.trim()) sp.set("to", params.to.trim());
  const qs = sp.toString();
  return fetchApi<AdminContactListResponse>(
    "GET",
    `/api/admin/contact${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function fetchAdminContactDetail(id: string): Promise<AdminContactDetail> {
  return fetchApi<AdminContactDetail>(
    "GET",
    `/api/admin/contact/${encodeURIComponent(id)}`,
    undefined,
    false
  );
}

export async function patchAdminContact(
  id: string,
  body: { status?: ContactSubmissionStatus; internalNotes?: string | null }
): Promise<AdminContactDetail> {
  return fetchApi<AdminContactDetail>(
    "PATCH",
    `/api/admin/contact/${encodeURIComponent(id)}`,
    body,
    false
  );
}
