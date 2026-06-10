import { fetchApi } from "./fetchClient";

export type AdminSubscriptionSummary = {
  userId: string;
  effectivePlan: "FREE" | "PRO";
  plan: "FREE" | "PRO";
  status: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED" | null;
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

export type AdminSubscriptionListRow = AdminSubscriptionSummary & {
  email: string;
  displayName: string;
  role: "USER" | "ADMIN";
  isDeleted: boolean;
  suspendedAt: string | null;
};

export type AdminSubscriptionListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  effectivePlan?: "free" | "pro";
  plan?: "free" | "pro";
  subscriptionStatus?: "ACTIVE" | "CANCELED" | "PAST_DUE" | "EXPIRED";
  billingInterval?: "MONTHLY" | "ANNUAL";
  cancelAtPeriodEnd?: boolean;
  staleSyncOnly?: boolean;
};

export type AdminSubscriptionMetrics = {
  proAccessActive: number;
  proEntitlementsActive: number;
  proCanceledAtPeriodEnd: number;
  proPastDue: number;
  proExpired: number;
  freeNoSubscriptionRow: number;
  proNewLast7d: number;
  proChurnedLast7d: number;
  byIntervalMonthly: number;
  byIntervalAnnual: number;
  staleSyncCount: number;
  challengeJoinsTotal: number;
  challengesWithJoins: number;
};

function buildSubscriptionQuery(params?: AdminSubscriptionListParams): string {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const plan = params?.effectivePlan ?? params?.plan;
  if (plan) sp.set("effectivePlan", plan);
  if (params?.subscriptionStatus) sp.set("subscriptionStatus", params.subscriptionStatus);
  if (params?.billingInterval) sp.set("billingInterval", params.billingInterval);
  if (params?.cancelAtPeriodEnd === true) sp.set("cancelAtPeriodEnd", "true");
  if (params?.cancelAtPeriodEnd === false) sp.set("cancelAtPeriodEnd", "false");
  if (params?.staleSyncOnly === true) sp.set("staleSyncOnly", "true");
  return sp.toString();
}

export async function fetchAdminSubscriptionList(
  params?: AdminSubscriptionListParams
): Promise<{
  items: AdminSubscriptionListRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}> {
  const qs = buildSubscriptionQuery(params);
  return fetchApi("GET", `/api/admin/subscriptions${qs ? `?${qs}` : ""}`, undefined, false);
}

export async function fetchAdminSubscriptionMetrics(): Promise<AdminSubscriptionMetrics> {
  return fetchApi("GET", "/api/admin/subscriptions/metrics", undefined, false);
}

export async function fetchAdminSubscriptionDetail(
  userId: string
): Promise<AdminSubscriptionSummary> {
  return fetchApi(
    "GET",
    `/api/admin/subscriptions/${encodeURIComponent(userId)}`,
    undefined,
    false
  );
}

export async function postAdminSubscriptionSync(userId: string): Promise<{
  success: boolean;
  subscription: AdminSubscriptionSummary;
}> {
  return fetchApi(
    "POST",
    `/api/admin/subscriptions/${encodeURIComponent(userId)}/sync`,
    {},
    false
  );
}

export type AdminSubscriptionSyncBatchResult = {
  success: boolean;
  synced: number;
  failed: number;
  results: { userId: string; success: boolean; error: string | null }[];
};

export async function postAdminSubscriptionSyncBatch(
  userIds: string[]
): Promise<AdminSubscriptionSyncBatchResult> {
  return fetchApi(
    "POST",
    "/api/admin/subscriptions/sync-batch",
    { userIds },
    false
  );
}
