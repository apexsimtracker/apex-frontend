import { fetchApi } from "./fetchClient";
import type { SessionVisibility } from "./profile";

/** User counterpart shown in admin follow rows. */
export type AdminFollowUserSide = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isDeleted: boolean;
  isSuspended: boolean;
  privateProfile: boolean;
};

export type AdminFollowEdgeRow = {
  id: string;
  createdAt: string;
  follower: AdminFollowUserSide;
  following: AdminFollowUserSide;
};

export type AdminFollowRequestRow = {
  id: string;
  createdAt: string;
  follower: AdminFollowUserSide;
  following: AdminFollowUserSide;
};

export type AdminPaginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type AdminFollowsOverview = {
  followsTotal: number;
  followRequestsTotal: number;
  followsLast7Days: number;
  followsLast24h: number;
  followRequestsLast7Days: number;
  followRequestsOlderThanThreshold: number;
  staleRequestDays: number;
};

export async function fetchAdminFollowsOverview(): Promise<AdminFollowsOverview> {
  return fetchApi("GET", "/api/admin/follows/overview", undefined, false);
}

export type AdminFollowEdgesParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  followerId?: string;
  followingId?: string;
  /** ISO date; only rows created on/after this point. */
  createdSince?: string;
  sort?: "newest" | "oldest";
};

export async function fetchAdminFollowEdges(
  params?: AdminFollowEdgesParams,
): Promise<AdminPaginated<AdminFollowEdgeRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.followerId?.trim())
    sp.set("followerId", params.followerId.trim());
  if (params?.followingId?.trim())
    sp.set("followingId", params.followingId.trim());
  if (params?.createdSince?.trim())
    sp.set("createdSince", params.createdSince.trim());
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/follows/edges${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export type AdminFollowRequestsParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  followerId?: string;
  followingId?: string;
  /** Only rows older than this number of days. */
  ageMinDays?: number;
  sort?: "newest" | "oldest";
};

export async function fetchAdminFollowRequests(
  params?: AdminFollowRequestsParams,
): Promise<AdminPaginated<AdminFollowRequestRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.followerId?.trim())
    sp.set("followerId", params.followerId.trim());
  if (params?.followingId?.trim())
    sp.set("followingId", params.followingId.trim());
  if (params?.ageMinDays != null)
    sp.set("ageMinDays", String(params.ageMinDays));
  if (params?.sort) sp.set("sort", params.sort);
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/follows/requests${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export type AdminFollowsAnomalies = {
  burstThreshold24h: number;
  staleRequestDays: number;
  followerBursts: { user: AdminFollowUserSide; count: number }[];
  followingBursts: { user: AdminFollowUserSide; count: number }[];
  stalePending: {
    id: string;
    createdAt: string;
    ageDays: number;
    follower: AdminFollowUserSide;
    following: AdminFollowUserSide;
  }[];
  suspendedInGraph: {
    id: string;
    createdAt: string;
    follower: AdminFollowUserSide;
    following: AdminFollowUserSide;
  }[];
  highPendingQueues: { user: AdminFollowUserSide; pendingCount: number }[];
  ratioOutliers: {
    user: AdminFollowUserSide;
    followingCount: number;
    followersCount: number;
    ratio: number;
  }[];
};

export async function fetchAdminFollowAnomalies(): Promise<AdminFollowsAnomalies> {
  return fetchApi("GET", "/api/admin/follows/anomalies", undefined, false);
}

export type AdminFollowAuditRow = {
  id: string;
  action: "FOLLOW_REMOVED" | "FOLLOW_REQUEST_REMOVED";
  createdAt: string;
  actor: { id: string; displayName: string };
  targetUser: { id: string; displayName: string };
  metadata: {
    reason?: string | null;
    followerId?: string;
    followerDisplayName?: string;
    followId?: string;
    requestId?: string;
  } | null;
};

export type AdminUserSocialGraph = {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    email: string;
    role: "USER" | "ADMIN";
    isDeleted: boolean;
    deletedAt: string | null;
    suspendedAt: string | null;
    isSuspicious: boolean;
    privateProfile: boolean;
    manualFollowApproval: boolean;
    sessionVisibility: SessionVisibility;
    createdAt: string;
  };
  stats: {
    followersCount: number;
    followingCount: number;
    pendingIn: number;
    pendingOut: number;
    newFollowersLast7d: number;
    newFollowingLast7d: number;
    newFollowersLast24h: number;
    newFollowingLast24h: number;
    reciprocityPercent: number;
  };
  daily: { day: string; followers: number; following: number }[];
  audit: AdminFollowAuditRow[];
};

export async function fetchAdminUserSocialGraph(
  userId: string,
): Promise<AdminUserSocialGraph> {
  return fetchApi(
    "GET",
    `/api/admin/follows/users/${encodeURIComponent(userId)}`,
    undefined,
    false,
  );
}

export type AdminUserFollowListRow = {
  id: string;
  createdAt: string;
  counterpart: AdminFollowUserSide;
};

export type AdminUserFollowListKind =
  | "followers"
  | "following"
  | "requests-in"
  | "requests-out";

export async function fetchAdminUserFollowList(
  userId: string,
  kind: AdminUserFollowListKind,
  params?: { page?: number; pageSize?: number; q?: string },
): Promise<AdminPaginated<AdminUserFollowListRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/follows/users/${encodeURIComponent(userId)}/${kind}${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export async function removeAdminFollow(
  followId: string,
  reason: string | null,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/follows/${encodeURIComponent(followId)}`,
    { reason: reason ?? "" },
    false,
  );
}

export async function removeAdminFollowRequest(
  requestId: string,
  reason: string | null,
): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/follows/requests/${encodeURIComponent(requestId)}`,
    { reason: reason ?? "" },
    false,
  );
}
