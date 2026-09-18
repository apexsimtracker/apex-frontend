import { apiDelete, apiGet, apiPost } from "./httpVerbs";

export type HiddenContentType =
  | "DISCUSSION"
  | "DISCUSSION_COMMENT"
  | "SESSION"
  | "SESSION_COMMENT";

export type ReportTargetType = HiddenContentType | "USER";

export const REPORT_REASONS = [
  "Spam",
  "Harassment",
  "Inappropriate content",
  "Other",
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
export const REPORT_DETAILS_MIN = 10;
export const REPORT_DETAILS_MAX = 500;

export type BlockedUserListItem = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  blockedAt: string;
};

export type BlockedUsersPage = {
  items: BlockedUserListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type HiddenContentListItem = {
  id: string;
  contentType: HiddenContentType;
  targetContentId: string;
  parentContentId: string | null;
  createdAt: string;
  preview: string | null;
  available: boolean;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

export type HiddenContentPage = {
  items: HiddenContentListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function blockUser(userId: string): Promise<{ blocked: boolean }> {
  return apiPost<{ blocked: boolean }>(
    `/api/users/${encodeURIComponent(userId)}/block`,
    {},
  );
}

export async function unblockUser(
  userId: string,
): Promise<{ blocked: boolean }> {
  return apiDelete<{ blocked: boolean }>(
    `/api/users/${encodeURIComponent(userId)}/block`,
  );
}

export async function fetchBlockedUsers(params?: {
  page?: number;
  limit?: number;
}): Promise<BlockedUsersPage> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const q = sp.toString();
  return apiGet<BlockedUsersPage>(`/api/users/blocked${q ? `?${q}` : ""}`);
}

export async function hideContent(
  contentType: HiddenContentType,
  targetContentId: string,
): Promise<void> {
  await apiPost("/api/content/hide", { contentType, targetContentId });
}

export async function fetchHiddenContent(params?: {
  page?: number;
  pageSize?: number;
  contentType?: HiddenContentType;
}): Promise<HiddenContentPage> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.contentType) sp.set("contentType", params.contentType);
  const q = sp.toString();
  return apiGet<HiddenContentPage>(
    `/api/content/hidden${q ? `?${q}` : ""}`,
  );
}

export async function unhideContent(
  contentType: HiddenContentType,
  targetContentId: string,
): Promise<void> {
  await apiDelete("/api/content/hide", { contentType, targetContentId });
}

export async function submitReport(body: {
  contentType: ReportTargetType;
  reason: ReportReason;
  details?: string;
  targetUserId?: string;
  targetContentId?: string;
}): Promise<{ id: string; status: string }> {
  return apiPost<{ id: string; status: string }>("/api/reports", body);
}
