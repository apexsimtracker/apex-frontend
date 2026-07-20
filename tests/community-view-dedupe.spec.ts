import { expect, test } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import {
  createDiscussionViaApi,
  deleteDiscussionViaApi,
} from "./helpers/community";
import {
  clearDiscussionViewClientState,
  createViewPostTracker,
  dispatchAuthEvent,
  applyAuthInPage,
  DISCUSSION_ANON_COOKIE_NAME,
  getDiscussionViewsViaApi,
  isDiscussionInViewedSet,
  logoutInPage,
  recordDiscussionViewViaApi,
  removeDiscussionFromViewedSet,
  setAnonymousViewerId,
} from "./helpers/discussionViews";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";

const E2E_BODY =
  "E2E community discussion body with enough characters for validation.";

const VALID_ANON_UUID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
const ALT_ANON_UUID = "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

function uniqueRunId(): string {
  return `e2e-views-${Date.now()}`;
}

async function createFreshDiscussion(
  request: Parameters<typeof createDiscussionViaApi>[0],
  auth: Awaited<ReturnType<typeof loginPersona>>,
  runId: string,
): Promise<string> {
  const created = await createDiscussionViaApi(request, auth, {
    category: "general",
    title: `E2E Views ${runId}`,
    description: E2E_BODY,
  });
  return created.id;
}

test.describe("@community @views", () => {
  test.describe.configure({ mode: "serial" });

  test("V1 — anonymous first view increments once", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await page.goto(`/discussion/${discussionId}`);
      await expect(
        page.getByRole("heading", { level: 1, name: `E2E Views ${runId}` }),
      ).toBeVisible();

      const viewRes = await viewTracker.waitForFirst();
      const body = (await viewRes.json()) as { views: number; recorded: boolean };
      expect(body.recorded).toBe(true);
      expect(body.views).toBe(1);
      expect(viewTracker.getCount()).toBe(1);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V2 — refresh does not POST or increment", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await page.goto(`/discussion/${discussionId}`);
      await viewTracker.waitForFirst();
      expect(viewTracker.getCount()).toBe(1);

      await expect
        .poll(() => isDiscussionInViewedSet(page, discussionId!))
        .toBe(true);

      await page.reload();
      await expect(
        page.getByRole("heading", { level: 1, name: `E2E Views ${runId}` }),
      ).toBeVisible();

      const extra = await viewTracker.waitForNext(2_000);
      expect(extra).toBeNull();
      expect(viewTracker.getCount()).toBe(1);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V3 — login after anonymous view does not double-count", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await page.goto(`/discussion/${discussionId}`);
      await viewTracker.waitForFirst();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      await applyAuthInPage(page, auth);
      await dispatchAuthEvent(page);

      const second = await viewTracker.waitForNext(3_000);
      expect(second).toBeNull();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, auth, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V4 — server merges anon identity on login when viewed-set cleared", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await setAnonymousViewerId(page, VALID_ANON_UUID);
      await page.goto(`/discussion/${discussionId}`);
      const first = await viewTracker.waitForFirst();
      const firstBody = (await first.json()) as {
        views: number;
        recorded: boolean;
      };
      expect(firstBody.recorded).toBe(true);

      await removeDiscussionFromViewedSet(page, discussionId);

      await applyAuthInPage(page, auth);
      await dispatchAuthEvent(page);

      const second = await viewTracker.waitForNext(10_000);
      expect(second).not.toBeNull();
      const secondBody = (await second!.json()) as {
        views: number;
        recorded: boolean;
      };
      expect(secondBody.recorded).toBe(false);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, auth, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V5 — logout on same discussion does not increment", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await gotoAuthenticated(page, auth, `/discussion/${discussionId}`);
      await viewTracker.waitForFirst();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, auth, discussionId!))
        .toBe(1);

      await logoutInPage(page);

      const afterLogout = await viewTracker.waitForNext(3_000);
      expect(afterLogout).toBeNull();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V6 — logged-in first view increments once", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await gotoAuthenticated(page, auth, `/discussion/${discussionId}`);

      const viewRes = await viewTracker.waitForFirst();
      const body = (await viewRes.json()) as { views: number; recorded: boolean };
      expect(body.recorded).toBe(true);
      expect(viewTracker.getCount()).toBe(1);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, auth, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V7 — logged-in refresh does not increment", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await gotoAuthenticated(page, auth, `/discussion/${discussionId}`);
      await viewTracker.waitForFirst();

      await page.reload();
      await expect(
        page.getByRole("heading", { level: 1, name: `E2E Views ${runId}` }),
      ).toBeVisible();

      const extra = await viewTracker.waitForNext(2_000);
      expect(extra).toBeNull();
      expect(viewTracker.getCount()).toBe(1);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, auth, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V8 — cross-tab login does not double-count", async ({
    context,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(tabA, discussionId);

      await clearDiscussionViewClientState(tabA);
      await tabA.goto(`/discussion/${discussionId}`);
      await viewTracker.waitForFirst();

      await gotoAuthenticated(tabB, auth, "/community");
      await expect(tabB.getByRole("heading", { name: "Sim Racing Community" })).toBeVisible({
        timeout: 30_000,
      });

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);
      expect(viewTracker.getCount()).toBe(1);

      viewTracker.dispose();
    } finally {
      await tabA.close();
      await tabB.close();
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V9 — shared anon id across tabs", async ({ context, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;
    const tabA = await context.newPage();
    const tabB = await context.newPage();

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const trackerA = createViewPostTracker(tabA, discussionId);
      const trackerB = createViewPostTracker(tabB, discussionId);

      await clearDiscussionViewClientState(tabA);
      await tabA.goto(`/discussion/${discussionId}`);
      await trackerA.waitForFirst();

      await tabB.goto(`/discussion/${discussionId}`);
      const second = await trackerB.waitForNext(5_000);
      if (second) {
        const body = (await second.json()) as { recorded: boolean };
        expect(body.recorded).toBe(false);
      }

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      trackerA.dispose();
      trackerB.dispose();
    } finally {
      await tabA.close();
      await tabB.close();
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V10 — different authenticated user adds one view", async ({
    page,
    request,
  }) => {
    const standardAuth = await loginPersona(request, "standard");
    const socialAAuth = await loginPersona(request, "socialA");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, standardAuth, runId);

      await clearDiscussionViewClientState(page);
      await gotoAuthenticated(page, standardAuth, `/discussion/${discussionId}`);
      const tracker = createViewPostTracker(page, discussionId);
      await tracker.waitForFirst();
      tracker.dispose();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, standardAuth, discussionId!))
        .toBe(1);

      const result = await recordDiscussionViewViaApi(
        request,
        socialAAuth,
        discussionId,
        { anonymousId: VALID_ANON_UUID },
      );
      expect(result.recorded).toBe(true);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, socialAAuth, discussionId!))
        .toBe(2);
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, standardAuth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V11 — discussion route dedupes on revisit", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await page.goto(`/discussion/${discussionId}`);
      await viewTracker.waitForFirst();

      await page.goto(`/discussion/${discussionId}`);
      await expect(
        page.getByRole("heading", { level: 1, name: `E2E Views ${runId}` }),
      ).toBeVisible();

      const extra = await viewTracker.waitForNext(2_000);
      expect(extra).toBeNull();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V12 — first anon view sets apex_discussion_anon cookie", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);
      const viewTracker = createViewPostTracker(page, discussionId);

      await clearDiscussionViewClientState(page);
      await setAnonymousViewerId(page, VALID_ANON_UUID);
      await page.goto(`/discussion/${discussionId}`);
      const viewRes = await viewTracker.waitForFirst();

      const setCookie =
        (await viewRes.headerValue("set-cookie")) ??
        viewRes.headers()["set-cookie"] ??
        "";
      expect(setCookie).toContain(DISCUSSION_ANON_COOKIE_NAME);

      const cookies = await page.context().cookies();
      const anonCookie = cookies.find((c) => c.name === DISCUSSION_ANON_COOKIE_NAME);
      expect(anonCookie?.value).toBe(VALID_ANON_UUID.toLowerCase());

      viewTracker.dispose();
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V13 — cookie identity wins over mismatched anonymousId", async ({
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;
    const { apiUrl } = getE2eEnv();

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);

      const first = await request.post(
        `${apiUrl}/api/community/discussions/${encodeURIComponent(discussionId)}/view`,
        {
          data: { anonymousId: VALID_ANON_UUID },
        },
      );
      expect(first.ok()).toBe(true);
      const firstBody = (await first.json()) as { recorded: boolean; views: number };
      expect(firstBody.recorded).toBe(true);

      const cookieHeader = first.headers()["set-cookie"] ?? "";
      expect(cookieHeader).toContain(DISCUSSION_ANON_COOKIE_NAME);

      const second = await request.post(
        `${apiUrl}/api/community/discussions/${encodeURIComponent(discussionId)}/view`,
        {
          headers: { Cookie: cookieHeader.split(";")[0] },
          data: { anonymousId: ALT_ANON_UUID },
        },
      );
      expect(second.ok()).toBe(true);
      const secondBody = (await second.json()) as { recorded: boolean; views: number };
      expect(secondBody.recorded).toBe(false);
      expect(secondBody.views).toBe(firstBody.views);

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(1);
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V14 — invalid anonymousId returns 400", async ({ request }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;
    const { apiUrl } = getE2eEnv();

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);

      const res = await request.post(
        `${apiUrl}/api/community/discussions/${encodeURIComponent(discussionId)}/view`,
        { data: { anonymousId: "not-a-uuid" } },
      );
      expect(res.status()).toBe(400);
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V15 — isolated context counts as separate anonymous viewer", async ({
    browser,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    let discussionId: string | null = null;

    const contextA = await browser.newContext();
    const contextB = await browser.newContext();
    const pageA = await contextA.newPage();
    const pageB = await contextB.newPage();

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);

      await clearDiscussionViewClientState(pageA);
      await clearDiscussionViewClientState(pageB);

      const trackerA = createViewPostTracker(pageA, discussionId);
      const trackerB = createViewPostTracker(pageB, discussionId);

      await pageA.goto(`/discussion/${discussionId}`);
      await trackerA.waitForFirst();

      await pageB.goto(`/discussion/${discussionId}`);
      await trackerB.waitForFirst();

      await expect
        .poll(() => getDiscussionViewsViaApi(request, null, discussionId!))
        .toBe(2);

      trackerA.dispose();
      trackerB.dispose();
    } finally {
      await contextA.close();
      await contextB.close();
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("V16 — view tracking does not block discussion content", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    const commentText = "E2E view dedupe regression comment.";
    let discussionId: string | null = null;

    try {
      discussionId = await createFreshDiscussion(request, auth, runId);

      await clearDiscussionViewClientState(page);
      await gotoAuthenticated(page, auth, `/discussion/${discussionId}`);

      await expect(
        page.getByRole("heading", { level: 1, name: `E2E Views ${runId}` }),
      ).toBeVisible();
      await expect(page.getByText(E2E_BODY)).toBeVisible();

      const commentPost = page.waitForResponse(
        (res) =>
          res
            .url()
            .includes(`/api/community/discussions/${discussionId}/comments`) &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await page.getByPlaceholder("Write a reply…").fill(commentText);
      await page.getByRole("button", { name: "Post reply" }).click();
      await commentPost;

      await expect(page.getByText(commentText)).toBeVisible({ timeout: 30_000 });
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, auth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });
});
