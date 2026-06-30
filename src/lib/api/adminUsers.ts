import { fetchApi } from "./fetchClient";
import type { SessionVisibility } from "./profile";

/** Mirrors Prisma `Sim` returned by admin session rows */
export type AdminSessionSim = "IRACING" | "F1_25" | "LMU";

export type AdminUserListRow = {
  id: string;
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  suspendedAt: string | null;
  isDeleted: boolean;
  isSuspicious: boolean;
  suspicionReason: string | null;
  emailStatus?: "VALID" | "DISPOSABLE" | "RISKY";
  emailRiskScore?: number;
  lastValidatedAt?: string | null;
  createdAt: string;
  plan: "FREE" | "PRO";
  effectivePlan: "FREE" | "PRO";
  entitlementStatus: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
  subscriptionStatus: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
  billingInterval: "MONTHLY" | "ANNUAL" | null;
  planDisplayName: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  lastSyncedAt: string | null;
};

export type AdminUserListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: "USER" | "ADMIN";
  status?: "active" | "suspended" | "deleted";
  /** When true, only users flagged as suspicious (e.g. disposable email). */
  suspiciousOnly?: boolean;
  plan?: "free" | "pro";
  subscriptionStatus?: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED";
  billingInterval?: "MONTHLY" | "ANNUAL";
};

/** POST /api/admin/users/scan-disposable-emails — preview or backfill disposable-domain flags */
export type AdminDisposableEmailScanPreview = {
  dryRun: true;
  scanned: number;
  totalMatching: number;
  matchesTruncated: boolean;
  matching: Array<{
    id: string;
    email: string;
    alreadyFlagged: boolean;
  }>;
  pendingFlagCount: number;
};

export type AdminDisposableEmailScanApply = {
  dryRun: false;
  scanned: number;
  totalMatching: number;
  updated: number;
  updatedSample: Array<{ id: string; email: string }>;
};

export type AdminDisposableEmailScanResponse =
  | AdminDisposableEmailScanPreview
  | AdminDisposableEmailScanApply;

export async function postAdminDisposableEmailScan(body: {
  dryRun: boolean;
}): Promise<AdminDisposableEmailScanResponse> {
  return fetchApi(
    "POST",
    "/api/admin/users/scan-disposable-emails",
    body,
    false,
  );
}

export async function fetchAdminUserList(
  params?: AdminUserListParams,
): Promise<{
  items: AdminUserListRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.role) sp.set("role", params.role);
  if (params?.status) sp.set("status", params.status);
  if (params?.suspiciousOnly === true) sp.set("suspiciousOnly", "true");
  if (params?.plan) sp.set("plan", params.plan);
  if (params?.subscriptionStatus)
    sp.set("subscriptionStatus", params.subscriptionStatus);
  if (params?.billingInterval)
    sp.set("billingInterval", params.billingInterval);
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/users${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export type AdminUserProfilePatchResult = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  displayName: string;
};

export type AdminUserDetailResponse = {
  user: {
    id: string;
    email: string;
    name: string | null;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    emailVerified: boolean;
    emailStatus?: "VALID" | "DISPOSABLE" | "RISKY";
    emailRiskScore?: number;
    lastValidatedAt?: string | null;
    role: "USER" | "ADMIN";
    suspendedAt: string | null;
    suspensionReason: string | null;
    isSuspicious: boolean;
    suspicionReason: string | null;
    isDeleted: boolean;
    deletedAt: string | null;
    /** ISO */
    createdAt: string;
    privateProfile: boolean;
    sessionVisibility: SessionVisibility;
    subscription: {
      userId: string;
      effectivePlan: "FREE" | "PRO";
      plan: "FREE" | "PRO";
      status: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED" | null;
      billingInterval: "MONTHLY" | "ANNUAL" | null;
      planDisplayName: string | null;
      entitlementIdentifier: string | null;
      revenuecatAppUserId: string | null;
      stripeCustomerId: string | null;
      currentPeriodStart: string | null;
      currentPeriodEnd: string | null;
      cancelAtPeriodEnd: boolean;
      lastSyncedAt: string | null;
      isSyncStale: boolean;
    };
  };
  counts: {
    discussions: number;
    discussionComments: number;
  };
  recentSessions: {
    id: string;
    createdAt: string;
    sim: AdminSessionSim;
    track: string;
    car: string;
    sessionType: string | null;
    manualSessionKind: string | null;
    challengeId: string | null;
    challengeTitle: string | null;
  }[];
  challengeBans: {
    challengeId: string;
    challengeTitle: string;
    reason: string | null;
    createdAt: string;
  }[];
};

export async function fetchAdminUserDetail(
  userId: string,
): Promise<AdminUserDetailResponse> {
  return fetchApi(
    "GET",
    `/api/admin/users/${encodeURIComponent(userId)}`,
    undefined,
    false,
  );
}

export async function patchAdminUserRole(
  userId: string,
  body: { role: "USER" | "ADMIN" },
): Promise<{ id: string; role: "USER" | "ADMIN" }> {
  return fetchApi(
    "PATCH",
    `/api/admin/users/${encodeURIComponent(userId)}/role`,
    body,
    false,
  );
}

export async function patchAdminUserStatus(
  userId: string,
  body: { suspended: boolean; reason?: string },
): Promise<{ suspendedAt: string | null; suspensionReason: string | null }> {
  return fetchApi(
    "PATCH",
    `/api/admin/users/${encodeURIComponent(userId)}/status`,
    body,
    false,
  );
}

export async function patchAdminUserProfile(
  userId: string,
  body: { name?: string; email?: string; avatarUrl?: string | null },
): Promise<AdminUserProfilePatchResult> {
  return fetchApi(
    "PATCH",
    `/api/admin/users/${encodeURIComponent(userId)}/profile`,
    body,
    false,
  );
}

export async function postAdminUserSetPassword(
  userId: string,
  body: { password: string },
): Promise<{ ok: boolean }> {
  return fetchApi(
    "POST",
    `/api/admin/users/${encodeURIComponent(userId)}/password`,
    body,
    false,
  );
}

export async function deleteAdminUser(
  userId: string,
  body: { confirmationEmail: string },
): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/users/${encodeURIComponent(userId)}`,
    body,
    false,
  );
}

export async function postAdminUserImpersonate(userId: string): Promise<{
  token: string;
  expiresAt: string | null;
  userId: string;
  displayName: string;
}> {
  return fetchApi(
    "POST",
    `/api/admin/users/${encodeURIComponent(userId)}/impersonate`,
    {},
    false,
  );
}

export async function postAdminUserReverify(userId: string): Promise<{
  user: {
    id: string;
    email: string;
    emailStatus: "VALID" | "DISPOSABLE" | "RISKY";
    emailRiskScore: number;
    lastValidatedAt: string | null;
    isSuspicious: boolean;
    suspicionReason: string | null;
  };
  validation: {
    isDisposable: boolean;
    score: number;
    reason: string;
    status: "VALID" | "DISPOSABLE" | "RISKY";
  };
}> {
  return fetchApi(
    "POST",
    `/api/admin/users/reverify/${encodeURIComponent(userId)}`,
    {},
    false,
  );
}

export type AdminDiscussionsStartedRow = {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminDiscussionsCommentedRow = {
  discussionId: string;
  title: string;
  category: string;
  lastCommentAt: string;
};

export type AdminUserDiscussionsPaginated<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export async function fetchAdminUserDiscussionsStarted(
  userId: string,
  params?: { page?: number; pageSize?: number },
): Promise<AdminUserDiscussionsPaginated<AdminDiscussionsStartedRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/users/${encodeURIComponent(userId)}/discussions-started${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}

export async function fetchAdminUserDiscussionsCommented(
  userId: string,
  params?: { page?: number; pageSize?: number },
): Promise<AdminUserDiscussionsPaginated<AdminDiscussionsCommentedRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/users/${encodeURIComponent(userId)}/discussions-commented${qs ? `?${qs}` : ""}`,
    undefined,
    false,
  );
}
