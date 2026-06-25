import { readFileSync } from "node:fs";
import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";
import { sessionJsonFixture } from "./fixtures";

export type SessionUploadResult = {
  sessionId: string;
  lapCount: number;
  status: string;
  duplicate: boolean;
  challengeAttachWarning?: string | null;
};

export type SessionUploadOptions = {
  challengeId?: string;
  /**
   * Rewrite fixture `startedAt` / `endedAt` (and session ids) so uploads land in a recent
   * window — required for weekend feed grouping after a long E2E run buries stale dates.
   */
  recentWeekendWindow?: {
    /** Index within the weekend sequence (0 = earliest). */
    index: number;
    /** Gap between session start times (default 1h). */
    spacingMs?: number;
    /** Hours before now for the last session in the pack (default 2). */
    hoursBeforeNow?: number;
  };
  /** Unique suffix for sessionId / clientSessionId (allows re-uploading the same fixture). */
  uniqueSuffix?: string;
};

type JsonFixture = Record<string, unknown>;

function loadSessionJsonFixture(filename: string): JsonFixture {
  const filePath = sessionJsonFixture(filename);
  return JSON.parse(readFileSync(filePath, "utf8")) as JsonFixture;
}

function applySessionUploadFixtureOptions(
  fixture: JsonFixture,
  options?: SessionUploadOptions
): Buffer {
  const next: JsonFixture = { ...fixture };

  if (options?.uniqueSuffix) {
    const suffix = options.uniqueSuffix.trim();
    for (const key of ["sessionId", "clientSessionId"] as const) {
      const raw = next[key];
      if (typeof raw === "string" && raw.trim()) {
        next[key] = `${raw}-${suffix}`;
      }
    }
  }

  const window = options?.recentWeekendWindow;
  if (window) {
    const spacingMs = window.spacingMs ?? 60 * 60 * 1000;
    const hoursBeforeNow = window.hoursBeforeNow ?? 2;
    const packEndMs = Date.now() - hoursBeforeNow * 60 * 60 * 1000;
    const packStartMs = packEndMs - window.index * spacingMs;
    const startedAt = new Date(packStartMs);
    const endedAt = new Date(packStartMs + 45 * 60 * 1000);
    next.startedAt = startedAt.toISOString();
    next.endedAt = endedAt.toISOString();
  }

  return Buffer.from(JSON.stringify(next));
}

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
  challengeAttachWarning?: string;
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

export async function clearUploadRateLimitViaApi(
  request: APIRequestContext,
  auth?: AuthSession,
  options?: { all?: boolean; userId?: string }
): Promise<void> {
  const { apiUrl, adminSecret } = getE2eEnv();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (adminSecret) {
    headers["x-admin-secret"] = adminSecret;
  }
  if (auth) {
    headers.Authorization = `Bearer ${auth.token}`;
    headers["X-Apex-Session"] = auth.sessionToken;
  }

  const res = await request.post(`${apiUrl}/api/sessions/dev/clear-upload-rate-limit`, {
    headers,
    data: {
      ...(options?.all ? { all: true } : {}),
      ...(options?.userId ? { userId: options.userId } : {}),
    },
  });

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`clear-upload-rate-limit failed (${res.status()}): ${body}`);
  }
}

export async function uploadSessionJsonViaApi(
  request: APIRequestContext,
  auth: AuthSession,
  filename: string,
  options?: SessionUploadOptions
): Promise<SessionUploadResult> {
  const { apiUrl } = getE2eEnv();
  const challengeId = options?.challengeId?.trim();
  const fixtureBuffer = applySessionUploadFixtureOptions(
    loadSessionJsonFixture(filename),
    options
  );

  const multipart: {
    file: { name: string; mimeType: string; buffer: Buffer };
    challengeId?: string;
  } = {
    file: {
      name: filename,
      mimeType: "application/json",
      buffer: fixtureBuffer,
    },
  };
  if (challengeId) {
    multipart.challengeId = challengeId;
  }

  const uploadHeaders = {
    Authorization: `Bearer ${auth.token}`,
    "X-Apex-Session": auth.sessionToken,
  };

  let res = await request.post(`${apiUrl}/api/sessions/manual-upload`, {
    headers: uploadHeaders,
    multipart,
  });

  if (res.status() === 429) {
    await clearUploadRateLimitViaApi(request, auth, {
      userId: auth.userId || undefined,
    }).catch(() => clearUploadRateLimitViaApi(request, auth, { all: true }));
    res = await request.post(`${apiUrl}/api/sessions/manual-upload`, {
      headers: uploadHeaders,
      multipart,
    });
  }

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
    challengeAttachWarning: data.challengeAttachWarning?.trim() || null,
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

const ACTIVITY_FEED_UI_PAGE_SIZE = 5;

/** Page index (1-based) where a session appears in the UI feed pagination (limit 5). */
export async function findActivityFeedPageForSession(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
  type: "all" | "telemetry" | "manual" = "all",
  maxPages = 150
): Promise<number | null> {
  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchActivityFeedPage(request, auth, {
      type,
      page,
      limit: ACTIVITY_FEED_UI_PAGE_SIZE,
    });
    if (collectFeedSessionIds(body.items).includes(sessionId)) {
      return page;
    }
    if (!body.hasMore) break;
  }
  return null;
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

async function clickActivityFeedLoadMore(page: Page): Promise<boolean> {
  const loadMore = page
    .locator("main")
    .getByRole("button", { name: "Load more", exact: true })
    .first();
  if (!(await loadMore.isVisible())) {
    return false;
  }

  const activityResponse = page.waitForResponse(
    (res) =>
      (res.url().includes("/api/activity") || res.url().includes("/api/activity/home")) &&
      res.request().method() === "GET" &&
      res.ok()
  );
  await loadMore.click();
  await activityResponse.catch(() => undefined);

  try {
    await loadMore.waitFor({ state: "visible", timeout: 20_000 });
  } catch {
    // No further pages — caller will decide if the target row is missing.
  }
  return true;
}

/** `/sessions` uses the global activity feed; paginate until a session link appears. */
export async function expectSessionOnSessionsFeedPage(
  page: Page,
  sessionId: string,
  options?: {
    containsText?: RegExp | string;
    maxLoadMoreClicks?: number;
    feedType?: "all" | "telemetry" | "manual";
    request?: APIRequestContext;
    auth?: AuthSession;
  }
): Promise<void> {
  const link = page.locator(`a[href="/sessions/${sessionId}"]`);

  if (options?.request && options?.auth) {
    const feedPage = await findActivityFeedPageForSession(
      options.request,
      options.auth,
      sessionId,
      options.feedType ?? "all"
    );
    expect(feedPage, `session ${sessionId} not found in activity feed`).not.toBeNull();
    for (let pageIndex = 1; pageIndex < feedPage!; pageIndex++) {
      expect(await clickActivityFeedLoadMore(page)).toBe(true);
    }
  } else {
    const maxLoadMoreClicks = options?.maxLoadMoreClicks ?? 60;

    for (let attempt = 0; attempt <= maxLoadMoreClicks; attempt++) {
      try {
        await expect(link).toBeVisible({ timeout: attempt === 0 ? 5_000 : 1_500 });
        if (options?.containsText) {
          await expect(link).toContainText(options.containsText);
        }
        return;
      } catch {
        // Not on the loaded pages yet — load more if available.
      }

      if (!(await clickActivityFeedLoadMore(page))) {
        break;
      }
    }
  }

  await expect(link).toBeVisible({ timeout: 15_000 });
  if (options?.containsText) {
    await expect(link).toContainText(options.containsText);
  }
}

async function fetchHomeFeedPage(
  request: APIRequestContext,
  auth: AuthSession,
  query: { type: string; page: number; limit?: number }
): Promise<ActivityFeedPayload> {
  const { apiUrl } = getE2eEnv();
  const limit = query.limit ?? 50;
  const res = await request.get(
    `${apiUrl}/api/activity/home?type=${encodeURIComponent(query.type)}&page=${query.page}&limit=${limit}`,
    { headers: authHeaders(auth.token, auth.sessionToken) }
  );
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`GET /api/activity/home failed (${res.status()}): ${body}`);
  }
  return (await res.json()) as ActivityFeedPayload;
}

/** Home feed (GET /api/activity/home) — sessions from self + followed users. */
export async function listHomeFeedSessionIds(
  request: APIRequestContext,
  auth: AuthSession,
  maxPages = 10
): Promise<string[]> {
  const ids: string[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const body = await fetchHomeFeedPage(request, auth, { type: "all", page });
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
