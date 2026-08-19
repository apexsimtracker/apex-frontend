import { expect, test, type Page } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";
import {
  clearUploadRateLimitViaApi,
  createManualActivityViaApi,
  deleteManualActivityViaApi,
  getSessionDetailViaApi,
  getActivityFeedGroupingForSession,
  findWeekendGroupContainingSession,
  listActivityFeedSessionIds,
  expectSessionOnSessionsFeedPage,
  uploadSessionJsonViaApi,
} from "./helpers/sessions";

async function selectManualTrack(
  page: Page,
  trackPattern: RegExp,
): Promise<void> {
  const trackSelect = page.locator("#track");
  await expect(trackSelect).toBeEnabled({ timeout: 30_000 });
  const options = trackSelect.locator("option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const label = (await options.nth(i).textContent())?.trim() ?? "";
    if (trackPattern.test(label)) {
      await trackSelect.selectOption({ index: i });
      return;
    }
  }
  throw new Error(`No track option matched ${trackPattern}`);
}

async function fillManualActivityBasics(page: Page): Promise<void> {
  await page.locator("#sim").selectOption({ label: "iRacing" });
  await selectManualTrack(page, /spa/i);
  await page
    .getByRole("group", { name: "Session type" })
    .getByRole("button", { name: "Practice" })
    .click();
  await page.getByLabel(/^Lap 1$/).fill("1:45.000");
}

test.describe("@sessions", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    const adminAuth = await loginPersona(request, "admin");
    await clearUploadRateLimitViaApi(request, adminAuth, { all: true }).catch(
      () => undefined,
    );
  });

  test("D1 — manual activity lifecycle: create → detail → edit → delete", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    let sessionId: string | null = null;

    try {
      await gotoAuthenticated(page, auth, "/manual");
      await expect(
        page.getByRole("heading", { name: "Log manual activity" }),
      ).toBeVisible();

      await fillManualActivityBasics(page);
      await page.locator("#caption").fill("E2E manual session");

      const createPost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/sessions/manual-activity") &&
          res.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Log activity" }).click();
      const createRes = await createPost;
      expect(createRes.ok()).toBeTruthy();
      const createBody = (await createRes.json()) as { sessionId?: string };
      sessionId = createBody.sessionId?.trim() ?? null;
      expect(sessionId).toBeTruthy();

      await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}$`), {
        timeout: 30_000,
      });
      await expect(page.getByText("Manual", { exact: true })).toBeVisible();
      await expect(
        page.getByText("Total Laps").locator("..").getByText("1"),
      ).toBeVisible();

      await page.getByRole("button", { name: "Edit" }).click();
      await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}/edit$`));
      await page.locator("#caption").fill("E2E manual updated");

      const updatePost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/sessions/${sessionId}`) &&
          res.request().method() === "PUT",
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      await updatePost;
      await expect(page).toHaveURL(new RegExp(`/sessions/${sessionId}$`), {
        timeout: 30_000,
      });

      await page.getByRole("button", { name: "Delete" }).click();
      await expect(
        page.getByRole("heading", { name: "Delete this manual activity?" }),
      ).toBeVisible();
      const deleteReq = page.waitForRequest(
        (req) =>
          req.url().includes(`/api/sessions/manual-activity/${sessionId}`) &&
          req.method() === "DELETE",
      );
      await page.getByRole("button", { name: "Delete" }).last().click();
      await deleteReq;
      await expect(page).toHaveURL(/\/$|\/profile/, { timeout: 30_000 });
      sessionId = null;
    } finally {
      if (sessionId) {
        await deleteManualActivityViaApi(request, auth, sessionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("D2 — JSON upload (race podium): 8 laps, P2, qual P3", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const upload = await uploadSessionJsonViaApi(
      request,
      auth,
      "race_spa_ferrari-gt3_podium.json",
    );

    await gotoAuthenticated(page, auth, `/sessions/${upload.sessionId}`);
    await expect(page.getByRole("heading", { name: /Spa/i })).toBeVisible();
    await expect(
      page.getByText("Total Laps").locator("..").getByText("8"),
    ).toBeVisible();
    await expect(
      page.getByText("Position").locator("..").getByText("P2 / 24"),
    ).toBeVisible();
    await expect(
      page.getByText("Quali position").locator("..").getByText("P3 / 24"),
    ).toBeVisible();

    const detail = await getSessionDetailViaApi(
      request,
      auth,
      upload.sessionId,
    );
    expect(detail.lapCount).toBe(8);
    expect(detail.position).toBe(2);
    expect(detail.qualifyingPosition).toBe(3);
  });

  test("D2b — JSON upload (qualifying): P3 / 24 on detail and sessions feed", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const auth = await loginPersona(request, "standard");
    const upload = await uploadSessionJsonViaApi(
      request,
      auth,
      "qualify_spa_ferrari-gt3_multi-lap.json",
    );

    const detail = await getSessionDetailViaApi(
      request,
      auth,
      upload.sessionId,
    );
    expect(detail.qualifyingPosition).toBe(3);

    await gotoAuthenticated(page, auth, `/sessions/${upload.sessionId}`);
    await expect(
      page.getByText("Position").locator("..").getByText("P3 / 24"),
    ).toBeVisible();

    const feedIds = await listActivityFeedSessionIds(request, auth, "all", 25);
    expect(feedIds).toContain(upload.sessionId);

    await gotoAuthenticated(page, auth, "/sessions?sessionsType=telemetry");
    await expect(page.getByRole("tab", { name: "Telemetry" })).toHaveAttribute(
      "data-state",
      "active",
    );
    await expectSessionOnSessionsFeedPage(page, upload.sessionId, {
      containsText: /P3/i,
      feedType: "telemetry",
      request,
      auth,
    });
  });

  test("D3 — JSON upload (practice Monza): 7 laps", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "webhookFree");
    const upload = await uploadSessionJsonViaApi(
      request,
      auth,
      "practice_monza_lamborghini-gt3_7laps.json",
    );

    await gotoAuthenticated(page, auth, `/sessions/${upload.sessionId}`);
    await expect(page.getByRole("heading", { name: /Monza/i })).toBeVisible();
    await expect(
      page.getByText("Total Laps").locator("..").getByText("7"),
    ).toBeVisible();
    await expect(page.getByLabel("Session type: PRACTICE")).toBeVisible();
  });

  test("D4 — sessions library tabs: All / Telemetry / Manual", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "private");
    const telemetryUpload = await uploadSessionJsonViaApi(
      request,
      auth,
      "practice_spa_ferrari-gt3_8laps.json",
    );
    const manualId = await createManualActivityViaApi(request, auth, {
      trackId: "monza",
      manualSessionKind: "PRACTICE",
      caption: "E2E sessions tab manual",
      laps: [{ lapTimeMs: 98_500 }],
    });

    await gotoAuthenticated(page, auth, "/sessions");
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();

    const manualLink = page.locator(`a[href="/sessions/${manualId}"]`);

    await expect(page.getByRole("tab", { name: "All" })).toHaveAttribute(
      "data-state",
      "active",
    );
    const allIds = await listActivityFeedSessionIds(request, auth, "all");
    expect(allIds).toContain(telemetryUpload.sessionId);
    expect(allIds).toContain(manualId);

    await page.getByRole("tab", { name: "Telemetry" }).click();
    await expect(page).toHaveURL(/sessionsType=telemetry/);
    const telemetryIds = await listActivityFeedSessionIds(
      request,
      auth,
      "telemetry",
    );
    expect(telemetryIds).toContain(telemetryUpload.sessionId);
    expect(telemetryIds).not.toContain(manualId);

    await page.getByRole("tab", { name: "Manual" }).click();
    await expect(page).toHaveURL(/sessionsType=manual/);
    const manualIds = await listActivityFeedSessionIds(request, auth, "manual");
    expect(manualIds).toContain(manualId);
    expect(manualIds).not.toContain(telemetryUpload.sessionId);
    await expect(manualLink).toBeVisible({ timeout: 30_000 });
  });

  test("D5 — like + comment on uploaded session", async ({ page, request }) => {
    const env = getE2eEnv();
    const ownerAuth = await loginPersona(request, "socialA");
    const socialBAuth = await loginPersona(request, "socialB");

    const upload = await uploadSessionJsonViaApi(
      request,
      ownerAuth,
      "race_monza_bmw-gt3_midpack.json",
    );

    await gotoAuthenticated(page, socialBAuth, "/");
    const card = page
      .locator(".rounded-lg.border")
      .filter({ hasText: /E2E Social A/i })
      .filter({ hasText: /Monza/i })
      .filter({ hasText: /P12/i })
      .first();
    await expect(card).toBeVisible({ timeout: 30_000 });

    const footer = card.locator(".border-t").first();
    const likeButton = footer.locator("button").first();
    const likePost = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/sessions/${upload.sessionId}/like`) &&
        res.request().method() === "POST",
    );
    await likeButton.click();
    const likeRes = await likePost;
    expect(likeRes.ok()).toBeTruthy();
    let likeBody = (await likeRes.json()) as {
      liked?: boolean;
      likeCount?: number;
    };
    if (!likeBody.liked) {
      const likeAgain = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/sessions/${upload.sessionId}/like`) &&
          res.request().method() === "POST",
      );
      await likeButton.click();
      const likeAgainRes = await likeAgain;
      expect(likeAgainRes.ok()).toBeTruthy();
      likeBody = (await likeAgainRes.json()) as {
        liked?: boolean;
        likeCount?: number;
      };
    }
    expect(likeBody.liked).toBe(true);
    expect((likeBody.likeCount ?? 0) >= 1).toBeTruthy();

    await footer.locator("button").nth(1).click();
    await expect(page.getByRole("heading", { name: "Comments" })).toBeVisible();
    const commentText = `E2E comment ${Date.now()}`;
    await page.getByPlaceholder("Add a comment...").fill(commentText);
    const commentPost = page.waitForResponse(
      (res) =>
        res.url().includes(`/api/sessions/${upload.sessionId}/comments`) &&
        res.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Post" }).click();
    await commentPost;
    await expect(page.getByText(commentText)).toBeVisible();

    const commentsRes = await request.get(
      `${env.apiUrl}/api/sessions/${upload.sessionId}/comments?page=1&limit=20`,
    );
    expect(commentsRes.ok()).toBeTruthy();
    const commentsBody = (await commentsRes.json()) as {
      comments?: Array<{ body?: string }>;
      total?: number;
    };
    expect((commentsBody.total ?? 0) >= 1).toBeTruthy();
    expect(
      (commentsBody.comments ?? []).some((comment) =>
        comment.body?.includes(commentText),
      ),
    ).toBeTruthy();
  });

  // Pro-gate coverage (personal bests API + session detail unlock) lives in billing.spec.ts B5.

  test("D8 — dedupe JSON uploads: duplicate noop then extended laps", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const auth = await loginPersona(request, "admin");

    const original = await uploadSessionJsonViaApi(
      request,
      auth,
      "dedupe_race_spa_ferrari_original.json",
    );
    const sessionId = original.sessionId;
    const beforeDuplicate = await getSessionDetailViaApi(
      request,
      auth,
      sessionId,
    );
    const lapsBeforeDuplicate = beforeDuplicate.lapCount ?? original.lapCount;

    const duplicate = await uploadSessionJsonViaApi(
      request,
      auth,
      "dedupe_race_spa_ferrari_duplicate.json",
    );
    expect(duplicate.sessionId).toBe(sessionId);
    if (duplicate.duplicate) {
      expect(duplicate.status).toBe("duplicate");
      expect(duplicate.lapCount).toBe(lapsBeforeDuplicate);
    }

    const extended = await uploadSessionJsonViaApi(
      request,
      auth,
      "dedupe_race_spa_ferrari_extended-laps.json",
    );
    expect(extended.sessionId).toBe(sessionId);
    expect(extended.lapCount).toBe(9);

    await gotoAuthenticated(page, auth, `/sessions/${sessionId}`);
    await expect(
      page.getByText("Total Laps").locator("..").getByText("9"),
    ).toBeVisible();
  });

  test("D9 — weekend grouping on sessions feed", async ({ page, request }) => {
    test.setTimeout(120_000);
    const auth = await loginPersona(request, "sacrificial");

    const weekendFiles = [
      "practice_spa_ferrari-gt3_8laps.json",
      "qualify_spa_ferrari-gt3_multi-lap.json",
      "warmup_spa_ferrari-gt3_5laps.json",
      "race_spa_ferrari-gt3_podium.json",
    ] as const;

    const runSuffix = `d9-${Date.now()}`;
    const weekendIds: string[] = [];
    for (let i = 0; i < weekendFiles.length; i++) {
      const upload = await uploadSessionJsonViaApi(
        request,
        auth,
        weekendFiles[i]!,
        {
          recentWeekendWindow: {
            index: weekendFiles.length - 1 - i,
            spacingMs: 60 * 60 * 1000,
          },
          uniqueSuffix: runSuffix,
        },
      );
      weekendIds.push(upload.sessionId);
    }
    const staleUpload = await uploadSessionJsonViaApi(
      request,
      auth,
      "practice_spa_ferrari-gt3_stale-weekend.json",
      {
        recentWeekendWindow: {
          index: 72,
          spacingMs: 60 * 60 * 1000,
          hoursBeforeNow: 96,
        },
        uniqueSuffix: runSuffix,
      },
    );

    for (const sessionId of weekendIds) {
      expect(
        await getActivityFeedGroupingForSession(request, auth, sessionId),
      ).toBe("weekend");
    }
    expect(
      await getActivityFeedGroupingForSession(
        request,
        auth,
        staleUpload.sessionId,
      ),
    ).toBe("standalone");

    const weekendGroup = await findWeekendGroupContainingSession(
      request,
      auth,
      weekendIds[weekendIds.length - 1]!,
    );
    expect(weekendGroup).not.toBeNull();
    expect(weekendGroup?.trackName).toMatch(/Spa/i);
    expect(weekendGroup?.hasPractice).toBe(true);
    expect(weekendGroup?.hasRace).toBe(true);

    await gotoAuthenticated(page, auth, "/sessions");
    await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "All" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  test("D10 — edge case JSON uploads", async ({ page, request }) => {
    test.setTimeout(120_000);
    const auth = await loginPersona(request, "challenge");

    const shortLaps = await uploadSessionJsonViaApi(
      request,
      auth,
      "edge_short_interlagos_2laps.json",
    );
    const timeTrial = await uploadSessionJsonViaApi(
      request,
      auth,
      "edge_time-trial_monza_ferrari-gt3_6laps.json",
    );
    const offlineTesting = await uploadSessionJsonViaApi(
      request,
      auth,
      "race_spa_ferrari-gt3_offline-testing.json",
    );

    const shortDetail = await getSessionDetailViaApi(
      request,
      auth,
      shortLaps.sessionId,
    );
    expect(shortDetail.lapCount).toBe(2);

    const trialDetail = await getSessionDetailViaApi(
      request,
      auth,
      timeTrial.sessionId,
    );
    expect(trialDetail.sessionType).toBe("TIME_TRIAL");
    expect(trialDetail.lapCount).toBe(6);

    const offlineDetail = await getSessionDetailViaApi(
      request,
      auth,
      offlineTesting.sessionId,
    );
    expect(offlineDetail.sessionType).toBe("PRACTICE");
    expect(offlineDetail.lapCount).toBe(6);

    await gotoAuthenticated(page, auth, `/sessions/${shortLaps.sessionId}`);
    await expect(
      page.getByText("Total Laps").locator("..").getByText("2"),
    ).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      /Pace|Interlagos|Carlos/i,
    );

    await gotoAuthenticated(page, auth, `/sessions/${timeTrial.sessionId}`);
    await expect(page.getByLabel("Session type: PRACTICE")).toBeVisible();

    await gotoAuthenticated(
      page,
      auth,
      `/sessions/${offlineTesting.sessionId}`,
    );
    await expect(page.getByLabel("Session type: PRACTICE")).toBeVisible();
  });
});
