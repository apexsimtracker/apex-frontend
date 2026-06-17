import { readFileSync } from "node:fs";
import type { APIRequestContext, Page } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";
import { sessionJsonFixture } from "./fixtures";

export type SessionUploadResult = {
  sessionId: string;
  lapCount: number;
  status: string;
  duplicate: boolean;
};

export type SessionDetailApi = {
  id?: string;
  sessionType?: string | null;
  manualSessionKind?: string | null;
  lapCount?: number | null;
  position?: number | null;
  qualifyingPosition?: number | null;
  track?: string | null;
  trackName?: string | null;
  car?: string | null;
  carName?: string | null;
  notes?: string | null;
  proFeaturesLocked?: boolean;
};

type ManualUploadResponse = {
  sessionId?: string;
  lapCount?: number;
  status?: string;
  duplicate?: boolean;
  error?: string;
  message?: string;
};

type SessionGetResponse =
  | SessionDetailApi
  | {
      session?: SessionDetailApi;
      proFeaturesLocked?: boolean;
    };

export async function authFromPage(page: Page): Promise<AuthSession> {
  const tokens = await page.evaluate(() => ({
    token: localStorage.getItem("apex_token")?.trim() ?? "",
    sessionToken: localStorage.getItem("apex_session_token")?.trim() ?? "",
  }));

  if (!tokens.token || !tokens.sessionToken) {
    throw new Error("Page is missing apex auth tokens in localStorage");
  }

  return { token: tokens.token, sessionToken: tokens.sessionToken, userId: "" };
}

export async function uploadSessionJsonViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  filename: string
): Promise<SessionUploadResult> {
  const { apiUrl } = getE2eEnv();
  const filePath = sessionJsonFixture(filename);

  const res = await request.post(`${apiUrl}/api/sessions/manual-upload`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "X-Apex-Session": auth.sessionToken,
    },
    multipart: {
      file: {
        name: filename,
        mimeType: "application/json",
        buffer: readFileSync(filePath),
      },
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`manual-upload failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as ManualUploadResponse;
  const sessionId = data.sessionId?.trim();
  if (!sessionId) {
    throw new Error(`manual-upload response missing sessionId: ${JSON.stringify(data)}`);
  }

  return {
    sessionId,
    lapCount: data.lapCount ?? 0,
    status: data.status ?? "processed",
    duplicate: Boolean(data.duplicate),
  };
}

/** Upload JSON telemetry using auth tokens already stored on `page`. */
export async function uploadSessionJson(
  page: Page,
  filename: string
): Promise<SessionUploadResult> {
  const auth = await authFromPage(page);
  return uploadSessionJsonViaApi(page.request, auth, filename);
}

export function parseSessionGetResponse(data: SessionGetResponse): SessionDetailApi {
  if (data && typeof data === "object" && "session" in data && data.session) {
    const session = data.session;
    return {
      ...session,
      proFeaturesLocked:
        (data as { proFeaturesLocked?: boolean }).proFeaturesLocked ??
        session.proFeaturesLocked,
    };
  }
  return data as SessionDetailApi;
}

export async function getSessionDetailViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string
): Promise<SessionDetailApi> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(`${apiUrl}/api/sessions/${encodeURIComponent(sessionId)}`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`GET session failed (${res.status()}): ${body}`);
  }

  return parseSessionGetResponse((await res.json()) as SessionGetResponse);
}

export type ManualActivityCreateInput = {
  sim?: string;
  trackId: string;
  manualSessionKind?: "PRACTICE" | "QUALIFY" | "RACE";
  carId?: string;
  position?: number;
  totalDrivers?: number;
  qualifyingPosition?: number;
  laps?: { lapTimeMs: number }[];
  notes?: string;
};

export async function createManualActivityViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  input: ManualActivityCreateInput
): Promise<string> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/sessions/manual-activity`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: {
      sim: input.sim ?? "iracing",
      trackId: input.trackId,
      manualSessionKind: input.manualSessionKind ?? "PRACTICE",
      ...(input.carId ? { carId: input.carId } : {}),
      ...(input.position != null ? { position: input.position } : {}),
      ...(input.totalDrivers != null ? { totalDrivers: input.totalDrivers } : {}),
      ...(input.qualifyingPosition != null
        ? { qualifyingPosition: input.qualifyingPosition }
        : {}),
      ...(input.laps?.length ? { laps: input.laps } : {}),
      ...(input.notes ? { notes: input.notes } : {}),
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`manual-activity create failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as { sessionId?: string };
  const sessionId = data.sessionId?.trim();
  if (!sessionId) {
    throw new Error("manual-activity response missing sessionId");
  }
  return sessionId;
}

export async function deleteManualActivityViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.delete(
    `${apiUrl}/api/sessions/manual-activity/${encodeURIComponent(sessionId)}`,
    {
      headers: authHeaders(auth.token, auth.sessionToken),
    }
  );

  if (!res.ok() && res.status() !== 404) {
    const body = await res.text();
    throw new Error(`manual-activity delete failed (${res.status()}): ${body}`);
  }
}

export async function followUserViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  userId: string
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/users/${encodeURIComponent(userId)}/follow`, {
    headers: authHeaders(auth.token, auth.sessionToken),
    data: {},
  });

  if (!res.ok() && res.status() !== 409) {
    const body = await res.text();
    throw new Error(`follow failed (${res.status()}): ${body}`);
  }
}

type ActivityFeedPayload = {
  items?: unknown[];
  hasMore?: boolean;
};

function collectFeedSessionIds(items: unknown[] | undefined): string[] {
  const ids: string[] = [];
  for (const item of items ?? []) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    if (rec.type === "standalone" && rec.session && typeof rec.session === "object") {
      const id = (rec.session as { id?: string }).id?.trim();
      if (id) ids.push(id);
      continue;
    }
    if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
      const sessions = (rec.group as { sessions?: unknown[] }).sessions ?? [];
      for (const session of sessions) {
        if (!session || typeof session !== "object") continue;
        const id = (session as { id?: string }).id?.trim();
        if (id) ids.push(id);
      }
    }
  }
  return ids;
}

async function fetchActivityFeedPage(
  request: APIRequestContext,
  auth: AuthSession,
  query: { type: string; page: number; limit?: number }
): Promise<ActivityFeedPayload> {
  const { apiUrl } = getE2eEnv();
  const limit = query.limit ?? 50;
  const res = await request.get(
    `${apiUrl}/api/activity?type=${encodeURIComponent(query.type)}&page=${query.page}&limit=${limit}`,
    { headers: authHeaders(auth.token, auth.sessionToken) }
  );
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`GET /api/activity failed (${res.status()}): ${body}`);
  }
  return (await res.json()) as ActivityFeedPayload;
}

export async function listActivityFeedSessionIds(
  request: APIRequestContext,
  auth: AuthSession,
  type: "all" | "telemetry" | "manual",
  maxPages = 10
): Promise<string[]> {
  const ids: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchActivityFeedPage(request, auth, { type, page });
    ids.push(...collectFeedSessionIds(body.items));
    if (!body.hasMore) break;
  }

  return ids;
}

export async function getActivityFeedGroupingForSession(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
  maxPages = 15
): Promise<"standalone" | "weekend" | "missing"> {
  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchActivityFeedPage(request, auth, { type: "all", page });

    for (const item of body.items ?? []) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      if (rec.type === "standalone" && rec.session && typeof rec.session === "object") {
        const id = (rec.session as { id?: string }).id?.trim();
        if (id === sessionId) return "standalone";
        continue;
      }
      if (rec.type === "weekend" && rec.group && typeof rec.group === "object") {
        const sessions = (rec.group as { sessions?: unknown[] }).sessions ?? [];
        for (const session of sessions) {
          if (!session || typeof session !== "object") continue;
          const id = (session as { id?: string }).id?.trim();
          if (id === sessionId) return "weekend";
        }
      }
    }

    if (!body.hasMore) break;
  }

  return "missing";
}

export async function findWeekendGroupContainingSession(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
  maxPages = 15
): Promise<{
  trackName: string;
  hasPractice: boolean;
  hasQualifying: boolean;
  hasRace: boolean;
  sessionIds: string[];
} | null> {
  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchActivityFeedPage(request, auth, { type: "all", page });

    for (const item of body.items ?? []) {
      if (!item || typeof item !== "object") continue;
      const rec = item as Record<string, unknown>;
      if (rec.type !== "weekend" || !rec.group || typeof rec.group !== "object") continue;

      const group = rec.group as {
        trackName?: string;
        hasPractice?: boolean;
        hasQualifying?: boolean;
        hasRace?: boolean;
        sessions?: Array<{ id?: string }>;
      };
      const ids = (group.sessions ?? [])
        .map((session) => session.id?.trim())
        .filter((id): id is string => Boolean(id));
      if (!ids.includes(sessionId)) continue;

      return {
        trackName: group.trackName ?? "",
        hasPractice: Boolean(group.hasPractice),
        hasQualifying: Boolean(group.hasQualifying),
        hasRace: Boolean(group.hasRace),
        sessionIds: ids,
      };
    }

    if (!body.hasMore) break;
  }

  return null;
}

export async function findWeekendGroupForSessions(
  request: APIRequestContext,
  auth: AuthSession,
  sessionIds: string[],
  maxPages = 15
): Promise<{
  trackName: string;
  hasPractice: boolean;
  hasQualifying: boolean;
  hasRace: boolean;
  sessionIds: string[];
} | null> {
  for (const sessionId of sessionIds) {
    const group = await findWeekendGroupContainingSession(request, auth, sessionId, maxPages);
    if (!group) continue;
    const wanted = new Set(sessionIds);
    if ([...wanted].every((id) => group.sessionIds.includes(id))) {
      return group;
    }
  }
  return null;
}
