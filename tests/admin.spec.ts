import { expect, test } from "@playwright/test";
import { clearGuestSession, gotoAuthenticated } from "./helpers/auth";
import {
  fetchAdminSubscriptionListViaApi,
  fetchOpenModerationFlagsViaAdminApi,
  lookupAdminUserByEmail,
  patchSystemFeatureViaAdminApi,
  patchUserStatusViaAdminApi,
  postManualUploadJsonViaApi,
  syncSubscriptionViaAdminApi,
} from "./helpers/admin";
import {
  createDiscussionViaApi,
  deleteDiscussionViaApi,
} from "./helpers/community";
import { getE2eEnv, isBillingConfigured } from "./helpers/env";
import { ensureProSeedHasPro } from "./helpers/billing";
import { loginPersona } from "./helpers/personas";
import { uploadSessionJsonViaApi } from "./helpers/sessions";

const METRIC_SECTIONS = [
  "Accounts",
  "Racing data",
  "Agent & sessions",
  "Community",
  "Social",
  "Subscriptions & challenges",
  "Auth & support signals",
] as const;

const ADMIN_PANELS = [
  { path: "/admin", heading: "Dashboard" },
  { path: "/admin/users", heading: "Users" },
  { path: "/admin/subscriptions", heading: "Subscriptions" },
  { path: "/admin/sessions", heading: "Sessions & laps" },
  { path: "/admin/tracks", heading: "Tracks & catalogs" },
  { path: "/admin/challenges", heading: "Challenges" },
  { path: "/admin/community", heading: "Community" },
  { path: "/admin/leaderboards", heading: "Global leaderboards" },
  { path: "/admin/notifications", heading: "Notifications" },
  { path: "/admin/follows", heading: "Follow graph" },
  { path: "/admin/contact", heading: "Contact inbox" },
  { path: "/admin/devices", heading: "Agent releases" },
  { path: "/admin/email-auth", heading: "Email & auth ops" },
  { path: "/admin/system", heading: "System" },
] as const;

const FLAGGED_DISCUSSION_BODY =
  "E2E admin moderation body with enough characters for validation and profanity review.";

function uniqueRunId(): string {
  return `e2e-${Date.now()}`;
}

test.describe("@admin", () => {
  test.describe.configure({ mode: "serial" });

  test("I1 — route guard rejects guest and standard user", async ({
    page,
    request,
  }) => {
    await clearGuestSession(page);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByText(/Sign in to access the admin dashboard/i),
    ).toBeVisible();

    const standardAuth = await loginPersona(request, "standard");
    await gotoAuthenticated(page, standardAuth, "/admin");
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toHaveCount(
      0,
    );

    const adminAuth = await loginPersona(request, "admin");
    await gotoAuthenticated(page, adminAuth, "/admin");
    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/?$/);
  });

  test("I2 — dashboard metrics and admin panels load", async ({
    page,
    request,
  }) => {
    const adminAuth = await loginPersona(request, "admin");
    await gotoAuthenticated(page, adminAuth, "/admin");

    await expect(
      page.getByRole("heading", { name: "Dashboard" }),
    ).toBeVisible();

    for (const section of METRIC_SECTIONS) {
      await expect(
        page.getByRole("heading", { name: section, level: 2 }),
      ).toBeVisible({
        timeout: 30_000,
      });
    }

    await expect(page.getByText("Registered users")).toBeVisible();
    await expect(page.getByText("Sessions").first()).toBeVisible();

    for (const panel of ADMIN_PANELS) {
      await gotoAuthenticated(page, adminAuth, panel.path);
      await expect(
        page.getByRole("heading", { name: panel.heading, level: 1 }),
      ).toBeVisible({
        timeout: 30_000,
      });
    }
  });

  test("I3 — suspend sacrificial blocks login", async ({ page, request }) => {
    const env = getE2eEnv();
    const adminAuth = await loginPersona(request, "admin");
    const sacrificialEmail = env.personas.sacrificial;
    const suspendReason = `E2E admin suspend ${uniqueRunId()}`;

    const sacrificial = await lookupAdminUserByEmail(
      request,
      adminAuth,
      sacrificialEmail,
    );
    expect(sacrificial).toBeTruthy();
    const sacrificialUserId = sacrificial!.id;

    if (sacrificial!.suspendedAt) {
      await patchUserStatusViaAdminApi(request, adminAuth, sacrificialUserId, {
        suspended: false,
      });
    }

    try {
      await gotoAuthenticated(
        page,
        adminAuth,
        `/admin/users/${sacrificialUserId}`,
      );
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      await page.getByRole("button", { name: "Suspend account" }).click();
      await expect(
        page.getByRole("heading", { name: "Suspend account" }),
      ).toBeVisible();
      await page.getByLabel("Reason (required)").fill(suspendReason);

      const statusPatch = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/admin/users/${sacrificialUserId}/status`) &&
          res.request().method() === "PATCH" &&
          res.ok(),
      );
      await page.getByRole("button", { name: "Suspend", exact: true }).click();
      await statusPatch;

      await expect(
        page.getByText("Suspended", { exact: true }).first(),
      ).toBeVisible({
        timeout: 30_000,
      });

      const loginRes = await request.post(`${env.apiUrl}/api/auth/login`, {
        data: { email: sacrificialEmail, password: env.password },
      });
      expect(loginRes.status()).toBe(403);
      const loginBody = (await loginRes.json()) as {
        code?: string;
        suspensionReason?: string | null;
      };
      expect(loginBody.code).toBe("ACCOUNT_SUSPENDED");
      expect(loginBody.suspensionReason).toBe(suspendReason);
    } finally {
      await patchUserStatusViaAdminApi(request, adminAuth, sacrificialUserId, {
        suspended: false,
      }).catch(() => undefined);
    }
  });

  test("I4 — subscription search and sync", async ({ page, request }) => {
    test.skip(
      !isBillingConfigured(),
      "Sandbox billing is not configured on the backend",
    );

    const env = getE2eEnv();
    const adminAuth = await loginPersona(request, "admin");
    const proEmail = env.personas.proSeed;

    const proUser = await lookupAdminUserByEmail(request, adminAuth, proEmail);
    expect(proUser).toBeTruthy();

    try {
      const beforeList = await fetchAdminSubscriptionListViaApi(
        request,
        adminAuth,
        {
          q: proEmail,
          pageSize: 5,
        },
      );
      const beforeRow = beforeList.items.find((row) => row.email === proEmail);
      expect(beforeRow).toBeTruthy();
      const beforeSyncedAt = beforeRow!.lastSyncedAt;

      await gotoAuthenticated(page, adminAuth, "/admin/subscriptions");
      await expect(
        page.getByRole("heading", { name: "Subscriptions" }),
      ).toBeVisible();

      await page
        .getByPlaceholder("Email, user id, RC or Stripe id…")
        .fill(proEmail);
      const row = page.getByRole("row").filter({ hasText: proEmail });
      await expect(row).toBeVisible({ timeout: 30_000 });

      const syncPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/admin/subscriptions/${proUser!.id}/sync`) &&
          res.request().method() === "POST",
      );
      await row.getByRole("button").click();
      const syncRes = await syncPost;
      expect(syncRes.ok()).toBeTruthy();

      await expect(
        page.getByText(/Subscription synced from RevenueCat/i),
      ).toBeVisible({
        timeout: 30_000,
      });

      const apiSync = await syncSubscriptionViaAdminApi(
        request,
        adminAuth,
        proUser!.id,
      );
      expect(apiSync.success).toBe(true);
      expect(apiSync.subscription?.lastSyncedAt).toBeTruthy();

      const afterList = await fetchAdminSubscriptionListViaApi(
        request,
        adminAuth,
        {
          q: proEmail,
          pageSize: 5,
        },
      );
      const afterRow = afterList.items.find((row) => row.email === proEmail);
      expect(afterRow?.lastSyncedAt).toBeTruthy();
      if (beforeSyncedAt) {
        expect(Date.parse(afterRow!.lastSyncedAt!)).toBeGreaterThanOrEqual(
          Date.parse(beforeSyncedAt),
        );
      }
    } finally {
      await ensureProSeedHasPro(request).catch(() => undefined);
    }
  });

  test("I5 — community moderation resolves flagged content", async ({
    page,
    request,
  }) => {
    const standardAuth = await loginPersona(request, "standard");
    const adminAuth = await loginPersona(request, "admin");
    const runId = uniqueRunId();
    const title = `E2E Flagged ${runId} shit`;
    let discussionId: string | null = null;

    try {
      const created = await createDiscussionViaApi(request, standardAuth, {
        category: "general",
        title,
        description: FLAGGED_DISCUSSION_BODY,
      });
      discussionId = created.id;

      await expect
        .poll(async () => {
          const flags = await fetchOpenModerationFlagsViaAdminApi(
            request,
            adminAuth,
          );
          return flags.some((flag) => flag.discussionId === discussionId);
        })
        .toBe(true);

      await gotoAuthenticated(page, adminAuth, "/admin/community");
      await page.getByRole("tab", { name: "Moderation queue" }).click();
      await expect(
        page.getByText("Open profanity / moderation flags"),
      ).toBeVisible();

      const flagRow = page.locator("tr").filter({
        has: page.locator(`a[href="/admin/community/${discussionId}"]`),
      });
      await expect(flagRow).toBeVisible({ timeout: 30_000 });

      const resolvePost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/admin/community/moderation-flags/") &&
          res.url().endsWith("/resolve") &&
          res.request().method() === "POST" &&
          res.ok(),
      );
      await flagRow.getByRole("button", { name: "Resolve" }).click();
      await resolvePost;

      const openFlags = await fetchOpenModerationFlagsViaAdminApi(
        request,
        adminAuth,
      );
      expect(openFlags.some((flag) => flag.discussionId === discussionId)).toBe(
        false,
      );
    } finally {
      if (discussionId) {
        await deleteDiscussionViaApi(request, standardAuth, discussionId).catch(
          () => undefined,
        );
      }
    }
  });

  test.describe("I6 — MANUAL_UPLOAD feature flag", () => {
    test.afterAll(async ({ request }) => {
      const adminAuth = await loginPersona(request, "admin");
      await patchSystemFeatureViaAdminApi(request, adminAuth, "MANUAL_UPLOAD", {
        enabled: true,
        environment: "ALL",
        reason: "E2E cleanup — restore manual upload",
      }).catch(() => undefined);
    });

    test("disabling blocks JSON upload with 503", async ({ page, request }) => {
      const adminAuth = await loginPersona(request, "admin");
      const standardAuth = await loginPersona(request, "standard");

      await gotoAuthenticated(page, adminAuth, "/admin/system");
      await page.getByRole("tab", { name: "Features" }).click();
      await expect(page.getByText("Curated feature controls")).toBeVisible();

      await page.getByPlaceholder("Search features").fill("Manual upload");
      const featureRow = page
        .getByRole("row")
        .filter({ hasText: "Manual upload" });
      await expect(featureRow).toBeVisible({ timeout: 30_000 });

      await featureRow.getByRole("button", { name: "Actions" }).click();
      await page.getByRole("menuitem", { name: "Edit" }).click();
      await expect(
        page.getByRole("heading", { name: "Edit feature" }),
      ).toBeVisible();

      const enabledSwitch = page.getByRole("switch", { name: "Enabled" });
      if (await enabledSwitch.isChecked()) {
        await enabledSwitch.click();
      }

      const featurePatch = page.waitForResponse(
        (res) =>
          res.url().includes("/api/admin/system/features/MANUAL_UPLOAD") &&
          res.request().method() === "PATCH" &&
          res.ok(),
      );
      await page.getByRole("button", { name: "Save changes" }).click();
      await featurePatch;

      const upload = await postManualUploadJsonViaApi(
        request,
        standardAuth,
        "practice_spa_ferrari-gt3_8laps.json",
      );
      expect(upload.status).toBe(503);
      expect(upload.body).toMatchObject({
        code: "MANUAL_UPLOAD_DISABLED",
      });
    });
  });

  test("I7 — impersonation shows exit FAB and blocks admin API", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const adminAuth = await loginPersona(request, "admin");
    const standardEmail = env.personas.standard;

    const standardUser = await lookupAdminUserByEmail(
      request,
      adminAuth,
      standardEmail,
    );
    expect(standardUser).toBeTruthy();

    await gotoAuthenticated(
      page,
      adminAuth,
      `/admin/users/${standardUser!.id}`,
    );
    await expect(
      page.getByRole("button", { name: "Open session" }),
    ).toBeVisible();

    const impersonatePost = page.waitForResponse(
      (res) =>
        res
          .url()
          .includes(`/api/admin/users/${standardUser!.id}/impersonate`) &&
        res.request().method() === "POST" &&
        res.ok(),
    );
    await page.getByRole("button", { name: "Open session" }).click();
    await impersonatePost;

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Back to admin" }),
    ).toBeVisible();

    const impToken = await page.evaluate(
      () => localStorage.getItem("apex_token")?.trim() ?? "",
    );
    expect(impToken).toBeTruthy();
    const adminProbe = await request.get(
      `${env.apiUrl}/api/admin/users?page=1&pageSize=1`,
      {
        headers: { Authorization: `Bearer ${impToken}` },
      },
    );
    expect(adminProbe.status()).toBe(403);

    await page.getByRole("button", { name: "Back to admin" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/, { timeout: 30_000 });
    await expect(
      page.getByRole("button", { name: "Back to admin" }),
    ).toHaveCount(0);
  });

  test("Optional — uploaded session visible in admin sessions", async ({
    page,
    request,
  }) => {
    const standardAuth = await loginPersona(request, "standard");
    const adminAuth = await loginPersona(request, "admin");
    const upload = await uploadSessionJsonViaApi(
      request,
      standardAuth,
      "practice_spa_ferrari-gt3_8laps.json",
    );
    expect(upload.lapCount).toBe(8);

    await gotoAuthenticated(page, adminAuth, "/admin/sessions");
    await expect(
      page.getByRole("heading", { name: "Sessions & laps" }),
    ).toBeVisible();

    const standardUser = await lookupAdminUserByEmail(
      request,
      adminAuth,
      getE2eEnv().personas.standard,
    );
    expect(standardUser).toBeTruthy();

    const listResponse = page.waitForResponse(
      (res) =>
        res.url().includes("/api/admin/sessions") &&
        res.url().includes(`userId=${encodeURIComponent(standardUser!.id)}`) &&
        res.request().method() === "GET" &&
        res.ok(),
    );
    await page.getByPlaceholder("User ID…").fill(standardUser!.id);
    await listResponse;

    await expect(
      page.getByRole("checkbox", {
        name: `Select session ${upload.sessionId}`,
      }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
