import { apiPatch, apiPost } from "./httpVerbs";
import { fetchApi } from "./fetchClient";
import type { DiscussionAuthor } from "./community";

export type AdminCommunityDiscussionListItem = {
  id: string;
  title: string;
  category: string;
  authorUserId: string;
  authorDisplayName: string;
  createdAt: string;
  deletedAt: string | null;
  deletedBy: "USER" | "ADMIN" | null;
  editedAt: string | null;
  profanityFlaggedAt: string | null;
  openModerationFlags: number;
  views: number;
  commentCount: number;
};

export type AdminCommunityDiscussionListResult = {
  items: AdminCommunityDiscussionListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminCommunityDiscussionDetail = {
  id: string;
  userId: string;
  category: string;
  title: string;
  body: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  deletedBy: "USER" | "ADMIN" | null;
  originalTitle: string | null;
  originalBody: string | null;
  editedAt: string | null;
  profanityFlaggedAt: string | null;
  author: DiscussionAuthor;
};

export type AdminCommunityCommentRow = {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  deletedAt: string | null;
  deletedBy: "USER" | "ADMIN" | null;
  profanityFlaggedAt: string | null;
  author: DiscussionAuthor;
};

export type AdminCommunityDiscussionDetailResponse = {
  discussion: AdminCommunityDiscussionDetail;
  comments: {
    items: AdminCommunityCommentRow[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  openModerationFlags: {
    id: string;
    kind: string;
    createdAt: string;
    actorUserId: string;
    commentId: string | null;
    matchedTerms: unknown;
  }[];
};

export type AdminModerationFlagRow = {
  id: string;
  kind: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  discussionId: string | null;
  commentId: string | null;
  actorUserId: string;
  matchedTerms: unknown;
};

export async function fetchAdminCommunityDiscussions(params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  category?: string;
  includeDeleted?: boolean;
  deletedBy?: "USER" | "ADMIN";
  flagged?: boolean;
}): Promise<AdminCommunityDiscussionListResult> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.category?.trim()) sp.set("category", params.category.trim());
  if (params?.includeDeleted) sp.set("includeDeleted", "true");
  if (params?.deletedBy) sp.set("deletedBy", params.deletedBy);
  if (params?.flagged) sp.set("flagged", "true");
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/community/discussions${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function fetchAdminCommunityDiscussionDetail(
  discussionId: string,
  params?: { page?: number; limit?: number }
): Promise<AdminCommunityDiscussionDetailResponse> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/community/discussions/${encodeURIComponent(discussionId)}${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function patchAdminCommunityDiscussion(
  discussionId: string,
  body: { title: string; body: string }
): Promise<{ id: string; title: string; body: string; profanityFlaggedAt: string | null }> {
  return apiPatch(`/api/admin/community/discussions/${encodeURIComponent(discussionId)}`, body);
}

export async function softDeleteAdminCommunityDiscussion(discussionId: string): Promise<void> {
  await apiPost(
    `/api/admin/community/discussions/${encodeURIComponent(discussionId)}/soft-delete`,
    undefined
  );
}

export async function restoreAdminCommunityDiscussion(discussionId: string): Promise<void> {
  await apiPost(
    `/api/admin/community/discussions/${encodeURIComponent(discussionId)}/restore`,
    undefined
  );
}

export async function hardDeleteAdminCommunityDiscussion(discussionId: string): Promise<void> {
  await fetchApi(
    "DELETE",
    `/api/admin/community/discussions/${encodeURIComponent(discussionId)}`,
    undefined,
    false
  );
}

export async function deleteAdminCommunityComment(
  discussionId: string,
  commentId: string,
  options?: { hard?: boolean }
): Promise<void> {
  const qs =
    options?.hard === true ? "?hard=1" : "";
  await fetchApi(
    "DELETE",
    `/api/admin/community/discussions/${encodeURIComponent(discussionId)}/comments/${encodeURIComponent(commentId)}${qs}`,
    undefined,
    false
  );
}

export async function fetchAdminCommunityModerationFlags(params?: {
  page?: number;
  pageSize?: number;
  unresolvedOnly?: boolean;
}): Promise<{
  items: AdminModerationFlagRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.unresolvedOnly === false) sp.set("unresolvedOnly", "false");
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/community/moderation-flags${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function resolveAdminCommunityModerationFlag(flagId: string): Promise<void> {
  await apiPost(
    `/api/admin/community/moderation-flags/${encodeURIComponent(flagId)}/resolve`,
    undefined
  );
}
