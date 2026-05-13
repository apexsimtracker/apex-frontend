import { fetchApi } from "./fetchClient";
import type { AdminPaginated } from "./adminFollows";
import type { NotificationSeverity } from "./profile";

// --- Common types --------------------------------------------------------

export type BroadcastStatus =
  | "DRAFT"
  | "SCHEDULED"
  | "ACTIVE"
  | "PAUSED"
  | "ARCHIVED";
export type NotificationChannel = "IN_APP" | "EMAIL";
export type NotificationDeliveryStatus =
  | "PENDING"
  | "SENT"
  | "FAILED"
  | "SKIPPED";
export type NotificationAudienceType =
  | "ALL"
  | "ROLE"
  | "PLAN"
  | "USER_IDS"
  | "FILTER";
export type UserRoleSelect = "USER" | "ADMIN";
export type PlanSelect = "FREE" | "PRO";

export type AdvancedAudienceFilter = {
  role?: UserRoleSelect | null;
  plan?: PlanSelect | null;
  privateProfile?: boolean | null;
  emailVerified?: boolean | null;
  includeSuspended?: boolean | null;
  suspendedOnly?: boolean | null;
  signupAfter?: string | null;
  signupBefore?: string | null;
  minSessionCount?: number | null;
};

export type AudienceDescriptor = {
  audienceType: NotificationAudienceType;
  audienceFilter?: AdvancedAudienceFilter | null;
  audienceUserIds?: string[] | null;
  audienceRole?: UserRoleSelect | null;
  audiencePlan?: PlanSelect | null;
};

// --- Broadcasts -----------------------------------------------------------

export type AdminBroadcastRow = {
  id: string;
  title: string;
  body: string;
  ctaLabel: string | null;
  ctaUrl: string | null;
  severity: NotificationSeverity;
  status: BroadcastStatus;
  dismissible: boolean;
  startsAt: string;
  endsAt: string | null;
  audienceSummary: string;
  dismissalCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  createdByDisplayName: string | null;
};

export type AdminBroadcastDetail = AdminBroadcastRow & {
  audienceType: NotificationAudienceType;
  audienceRole: UserRoleSelect | null;
  audiencePlan: PlanSelect | null;
  audienceUserIds: string[];
  audienceFilter: AdvancedAudienceFilter | null;
  archivedAt: string | null;
  eligibleAudienceCount: number;
};

export type AdminBroadcastListParams = {
  page?: number;
  pageSize?: number;
  status?: BroadcastStatus;
  severity?: NotificationSeverity;
  q?: string;
};

export async function fetchAdminBroadcasts(
  params?: AdminBroadcastListParams
): Promise<AdminPaginated<AdminBroadcastRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.status) sp.set("status", params.status);
  if (params?.severity) sp.set("severity", params.severity);
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/notifications/broadcasts${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export type CreateBroadcastInput = AudienceDescriptor & {
  title: string;
  body: string;
  severity?: NotificationSeverity;
  dismissible?: boolean;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  startsAt?: string;
  endsAt?: string | null;
  status?: "DRAFT" | "SCHEDULED" | "ACTIVE";
};

export async function createBroadcast(
  input: CreateBroadcastInput
): Promise<{ id: string }> {
  return fetchApi("POST", "/api/admin/notifications/broadcasts", input);
}

export async function getAdminBroadcast(
  id: string
): Promise<AdminBroadcastDetail> {
  return fetchApi(
    "GET",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}`,
    undefined,
    false
  );
}

export async function updateBroadcast(
  id: string,
  input: Partial<CreateBroadcastInput>
): Promise<{ id: string }> {
  return fetchApi(
    "PATCH",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}`,
    input
  );
}

export async function publishBroadcast(
  id: string
): Promise<{ id: string; status: BroadcastStatus }> {
  return fetchApi(
    "POST",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}/publish`,
    {}
  );
}

export async function pauseBroadcast(
  id: string
): Promise<{ id: string; status: BroadcastStatus }> {
  return fetchApi(
    "POST",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}/pause`,
    {}
  );
}

export async function archiveBroadcast(
  id: string
): Promise<{ id: string; status: BroadcastStatus }> {
  return fetchApi(
    "POST",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}/archive`,
    {}
  );
}

export async function deleteBroadcast(id: string): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}`,
    undefined,
    false
  );
}

export async function unarchiveBroadcast(
  id: string
): Promise<{ id: string; status: BroadcastStatus }> {
  return fetchApi(
    "POST",
    `/api/admin/notifications/broadcasts/${encodeURIComponent(id)}/unarchive`,
    {}
  );
}

// --- Campaigns ------------------------------------------------------------

export type AdminCampaignRow = {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  channels: NotificationChannel[];
  bypassUserPrefs: boolean;
  audienceSummary: string;
  recipientCount: number;
  inAppSentCount: number;
  emailSentCount: number;
  emailFailedCount: number;
  emailSkippedCount: number;
  createdAt: string;
  createdByDisplayName: string | null;
};

export type AdminCampaignDetail = AdminCampaignRow & {
  linkUrl: string | null;
  audienceType: NotificationAudienceType;
  audienceRole: UserRoleSelect | null;
  audiencePlan: PlanSelect | null;
  audienceUserIds: string[];
  audienceFilter: AdvancedAudienceFilter | null;
  updatedAt: string;
};

export type AdminCampaignsListParams = {
  page?: number;
  pageSize?: number;
  q?: string;
  channel?: NotificationChannel;
};

export async function fetchAdminCampaigns(
  params?: AdminCampaignsListParams
): Promise<AdminPaginated<AdminCampaignRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  if (params?.channel) sp.set("channel", params.channel);
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/notifications/campaigns${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export type CreateCampaignInput = AudienceDescriptor & {
  title: string;
  body: string;
  linkUrl?: string | null;
  severity?: NotificationSeverity;
  channels: NotificationChannel[];
  bypassUserPrefs?: boolean;
};

export async function createCampaign(
  input: CreateCampaignInput
): Promise<{ id: string }> {
  return fetchApi("POST", "/api/admin/notifications/campaigns", input);
}

export async function getAdminCampaign(
  id: string
): Promise<AdminCampaignDetail> {
  return fetchApi(
    "GET",
    `/api/admin/notifications/campaigns/${encodeURIComponent(id)}`,
    undefined,
    false
  );
}

export type AdminDeliveryRow = {
  id: string;
  userId: string;
  userEmail: string;
  userDisplayName: string;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  providerMessageId: string | null;
  errorMessage: string | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminCampaignDeliveriesParams = {
  page?: number;
  pageSize?: number;
  status?: NotificationDeliveryStatus;
  channel?: NotificationChannel;
  q?: string;
};

export async function fetchCampaignDeliveries(
  campaignId: string,
  params?: AdminCampaignDeliveriesParams
): Promise<AdminPaginated<AdminDeliveryRow>> {
  const sp = new URLSearchParams();
  if (params?.page != null) sp.set("page", String(params.page));
  if (params?.pageSize != null) sp.set("pageSize", String(params.pageSize));
  if (params?.status) sp.set("status", params.status);
  if (params?.channel) sp.set("channel", params.channel);
  if (params?.q?.trim()) sp.set("q", params.q.trim());
  const qs = sp.toString();
  return fetchApi(
    "GET",
    `/api/admin/notifications/campaigns/${encodeURIComponent(campaignId)}/deliveries${qs ? `?${qs}` : ""}`,
    undefined,
    false
  );
}

export async function deleteCampaign(id: string): Promise<{ ok: boolean }> {
  return fetchApi(
    "DELETE",
    `/api/admin/notifications/campaigns/${encodeURIComponent(id)}`,
    undefined,
    false
  );
}

export async function resendFailedCampaignEmails(
  campaignId: string
): Promise<{
  retried: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  return fetchApi(
    "POST",
    `/api/admin/notifications/campaigns/${encodeURIComponent(campaignId)}/resend-failed`,
    {}
  );
}

// --- Audience preview + overview KPIs ------------------------------------

export type AudiencePreviewResponse = {
  count: number;
  summary: string;
  sample: { id: string; email: string; displayName: string }[];
};

export async function previewAudience(
  descriptor: AudienceDescriptor
): Promise<AudiencePreviewResponse> {
  return fetchApi(
    "POST",
    "/api/admin/notifications/audience/preview",
    descriptor
  );
}

export type AdminNotificationsOverview = {
  activeBroadcasts: number;
  totalBroadcasts: number;
  dismissedLast24h: number;
  deliveriesLast24h: number;
  campaignsLast24h: number;
  emailSent: number;
  emailFailed: number;
  emailSkipped: number;
  emailSuccessRate: number | null;
};

export async function fetchAdminNotificationsOverview(): Promise<AdminNotificationsOverview> {
  return fetchApi(
    "GET",
    "/api/admin/notifications/overview",
    undefined,
    false
  );
}
