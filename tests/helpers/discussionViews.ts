import { expect, type APIRequestContext, type Page, type Response } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";

/** Matches apex-frontend/src/lib/discussionViewerId.ts */
export const ANON_VIEWER_STORAGE_KEY = "apex_discussion_anon_viewer";
export const VIEWED_DISCUSSIONS_STORAGE_KEY = "apex_discussion_viewed";
/** Matches apex/src/lib/discussionAnonCookie.ts */
export const DISCUSSION_ANON_COOKIE_NAME = "apex_discussion_anon";

export type DiscussionViewResult = {
  views: number;
  recorded: boolean;
};

function viewPostUrl(discussionId: string): string {
  return `/api/community/discussions/${encodeURIComponent(discussionId)}/view`;
}

function isViewPost(req: { url(): string; method(): string }, discussionId: string): boolean {
  return req.url().includes(viewPostUrl(discussionId)) && req.method() === "POST";
}

export async function getDiscussionViewsViaApi(
  request: APIRequestContext,
  auth: AuthSession | null,
  discussionId: string,
): Promise<number> {
  const { apiUrl } = getE2eEnv();
  const headers = auth
    ? authHeaders(auth.token, auth.sessionToken)
    : { "Content-Type": "application/json" };

  const res = await request.get(
    `${apiUrl}/api/community/discussions/${encodeURIComponent(discussionId)}`,
    { headers },
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`getDiscussion failed (${res.status()}): ${body}`);
  }

  const data = (await res.json()) as { views?: number };
  return typeof data.views === "number" ? data.views : 0;
}

export async function recordDiscussionViewViaApi(
  request: APIRequestContext,
  auth: AuthSession | null,
  discussionId: string,
  options?: { anonymousId?: string },
): Promise<DiscussionViewResult> {
  const { apiUrl } = getE2eEnv();
  const headers = auth
    ? authHeaders(auth.token, auth.sessionToken)
    : { "Content-Type": "application/json" };

  const data =
    options?.anonymousId?.trim() != null && options.anonymousId.trim() !== ""
      ? { anonymousId: options.anonymousId.trim() }
      : undefined;

  const res = await request.post(
    `${apiUrl}${viewPostUrl(discussionId)}`,
    { headers, data },
  );

  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`recordDiscussionView failed (${res.status()}): ${body}`);
  }

  return (await res.json()) as DiscussionViewResult;
}

export async function clearDiscussionViewClientState(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(
    ([anonKey, viewedKey]) => {
      localStorage.removeItem("apex_token");
      localStorage.removeItem("apex_session_token");
      sessionStorage.removeItem("apex_verify_email");
      localStorage.removeItem(anonKey);
      localStorage.removeItem(viewedKey);
      sessionStorage.removeItem(anonKey);
    },
    [ANON_VIEWER_STORAGE_KEY, VIEWED_DISCUSSIONS_STORAGE_KEY] as const,
  );
}

export async function setAnonymousViewerId(page: Page, uuid: string): Promise<void> {
  await page.evaluate(
    ([key, value]) => {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    },
    [ANON_VIEWER_STORAGE_KEY, uuid] as const,
  );
}

export async function getAnonymousViewerId(page: Page): Promise<string | null> {
  return page.evaluate(
    (key) => localStorage.getItem(key),
    ANON_VIEWER_STORAGE_KEY,
  );
}

export async function isDiscussionInViewedSet(
  page: Page,
  discussionId: string,
): Promise<boolean> {
  return page.evaluate(
    ([key, id]) => {
      const raw = localStorage.getItem(key);
      if (!raw) return false;
      try {
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) && parsed.includes(id);
      } catch {
        return false;
      }
    },
    [VIEWED_DISCUSSIONS_STORAGE_KEY, discussionId] as const,
  );
}

export async function removeDiscussionFromViewedSet(
  page: Page,
  discussionId: string,
): Promise<void> {
  await page.evaluate(
    ([key, id]) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return;
        const next = parsed.filter((x) => x !== id);
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* ignore */
      }
    },
    [VIEWED_DISCUSSIONS_STORAGE_KEY, discussionId] as const,
  );
}

export type ViewPostTracker = {
  waitForFirst(): Promise<Response>;
  waitForNext(timeoutMs?: number): Promise<Response | null>;
  getCount(): number;
  dispose(): void;
};

export function createViewPostTracker(
  page: Page,
  discussionId: string,
): ViewPostTracker {
  let count = 0;
  const pending: Array<{
    resolve: (res: Response) => void;
    reject: (err: Error) => void;
  }> = [];

  const onRequest = (req: { url(): string; method(): string }) => {
    if (isViewPost(req, discussionId)) {
      count += 1;
    }
  };

  const onResponse = (res: Response) => {
    const req = res.request();
    if (!isViewPost(req, discussionId)) return;
    const waiter = pending.shift();
    if (waiter) {
      waiter.resolve(res);
    }
  };

  page.on("request", onRequest);
  page.on("response", onResponse);

  const waitForResponse = (timeoutMs: number): Promise<Response | null> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = pending.findIndex((w) => w.resolve === resolveWrapper);
        if (idx >= 0) pending.splice(idx, 1);
        resolve(null);
      }, timeoutMs);

      const resolveWrapper = (res: Response) => {
        clearTimeout(timer);
        resolve(res);
      };

      pending.push({
        resolve: resolveWrapper,
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
    });
  };

  return {
    async waitForFirst(): Promise<Response> {
      const res = await waitForResponse(30_000);
      expect(res, "expected first view POST").not.toBeNull();
      return res!;
    },
    waitForNext(timeoutMs = 5_000): Promise<Response | null> {
      return waitForResponse(timeoutMs);
    },
    getCount(): number {
      return count;
    },
    dispose(): void {
      page.off("request", onRequest);
      page.off("response", onResponse);
      pending.length = 0;
    },
  };
}

export async function applyAuthInPage(
  page: Page,
  auth: AuthSession,
): Promise<void> {
  await page.evaluate(
    ({ token, session }) => {
      localStorage.setItem("apex_token", token);
      localStorage.setItem("apex_session_token", session);
    },
    { token: auth.token, session: auth.sessionToken },
  );
}

export async function dispatchAuthEvent(page: Page): Promise<void> {
  await page.evaluate(() => window.dispatchEvent(new Event("apex:auth")));
}

export async function logoutInPage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem("apex_token");
    localStorage.removeItem("apex_session_token");
    window.dispatchEvent(new Event("apex:auth"));
  });
}
