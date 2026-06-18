import type { APIRequestContext } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

export type NotificationApi = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string;
  entityId?: string | null;
  title?: string | null;
  body?: string | null;
  actor?: { id: string; displayName: string; avatarUrl: string | null } | null;
};

export type CreateBroadcastInput = {
  title: string;
  body: string;
  severity?: "INFO" | "SUCCESS" | "WARNING" | "CRITICAL" | "MAINTENANCE";
  status?: "DRAFT" | "SCHEDULED" | "ACTIVE";
  dismissible?: boolean;
  audienceType?: "ALL" | "ROLE" | "PLAN" | "USER_IDS" | "FILTER";
  audienceUserIds?: string[];
};

export async function createBroadcastViaAdminApi(
  request: APIRequestContext,
  adminAuth: AuthSession,
  input: CreateBroadcastInput
): Promise<string> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/admin/notifications/broadcasts`, {
    headers: authHeaders(adminAuth.token, adminAuth.sessionToken),
    data: {
      severity: "INFO",
      dismissible: true,
      audienceType: "ALL",
      status: "DRAFT",
      ...input,
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`createBroadcast failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as { id?: string };
  const id = data.id?.trim();
  if (!id) {
    throw new Error("createBroadcast response missing id");
  }
  return id;
}

export async function publishBroadcastViaAdminApi(
  request: APIRequestContext,
  adminAuth: AuthSession,
  broadcastId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(
    `${apiUrl}/api/admin/notifications/broadcasts/${encodeURIComponent(broadcastId)}/publish`,
    {
      headers: authHeaders(adminAuth.token, adminAuth.sessionToken),
      data: {},
    }
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`publishBroadcast failed (${res.status()}): ${body}`);
  }
}

export async function archiveBroadcastViaAdminApi(
  request: APIRequestContext,
  adminAuth: AuthSession,
  broadcastId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(
    `${apiUrl}/api/admin/notifications/broadcasts/${encodeURIComponent(broadcastId)}/archive`,
    {
      headers: authHeaders(adminAuth.token, adminAuth.sessionToken),
      data: {},
    }
  );

  if (!res.ok() && res.status() !== 404) {
    const body = await res.text();
    throw new Error(`archiveBroadcast failed (${res.status()}): ${body}`);
  }
}

export async function getActiveBroadcastsViaApi(
  request: APIRequestContext,
  auth: AuthSession
): Promise<{ id: string; title: string; body: string }[]> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(`${apiUrl}/api/broadcasts/active`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`GET /api/broadcasts/active failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as {
    broadcasts?: Array<{ id?: string; title?: string; body?: string }>;
  };
  return (data.broadcasts ?? [])
    .map((b) => ({
      id: b.id?.trim() ?? "",
      title: b.title?.trim() ?? "",
      body: b.body?.trim() ?? "",
    }))
    .filter((b) => b.id && b.title);
}

export async function getNotificationsViaApi(
  request: APIRequestContext,
  auth: AuthSession
): Promise<NotificationApi[]> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(`${apiUrl}/api/notifications`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`GET /api/notifications failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as { notifications?: NotificationApi[] };
  return data.notifications ?? [];
}

export async function countUnreadNotificationsViaApi(
  request: APIRequestContext,
  auth: AuthSession
): Promise<number> {
  const notifications = await getNotificationsViaApi(request, auth);
  return notifications.filter((n) => !n.read).length;
}

export async function markNotificationsReadViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  ids?: string[]
): Promise<number> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/notifications/read`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: ids?.length ? { ids } : {},
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`POST /api/notifications/read failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as { marked?: number };
  return data.marked ?? 0;
}
