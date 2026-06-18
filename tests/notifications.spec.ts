import { expect, test, type Page } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import {
  archiveBroadcastViaAdminApi,
  countUnreadNotificationsViaApi,
  createBroadcastViaAdminApi,
  getActiveBroadcastsViaApi,
  publishBroadcastViaAdminApi,
} from "./helpers/notifications";
import { loginPersona } from "./helpers/personas";
import { unfollowUserViaApi } from "./helpers/profile";
import { followUserViaApi } from "./helpers/sessions";

function uniqueRunId(): string {
  return `e2e-${Date.now()}`;
}

function headerNotificationsBell(page: Page) {
  return page.locator("header").getByRole("button", { name: "Notifications" });
}

test.describe("@notifications", () => {
  test.describe.configure({ mode: "serial" });

  test("J1 — broadcast banner: admin publish → standard sees banner → dismiss", async ({
    page,
    request,
  }) => {
    const adminAuth = await loginPersona(request, "admin");
    const standardAuth = await loginPersona(request, "standard");
    const runId = uniqueRunId();
    const title = `E2E Broadcast ${runId}`;
    const body = `Playwright broadcast body ${runId}.`;
    let broadcastId: string | null = null;

    try {
      broadcastId = await createBroadcastViaAdminApi(request, adminAuth, {
        title,
        body,
        audienceType: "USER_IDS",
        audienceUserIds: [standardAuth.userId],
      });
      await publishBroadcastViaAdminApi(request, adminAuth, broadcastId);

      const activeBefore = await getActiveBroadcastsViaApi(request, standardAuth);
      expect(activeBefore.some((b) => b.id === broadcastId)).toBe(true);

      await gotoAuthenticated(page, standardAuth, "/");
      await expect(page.getByText(title)).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(body)).toBeVisible();

      const banner = page
        .locator("div.border-b")
        .filter({ hasText: title })
        .filter({ hasText: body })
        .first();

      const dismissPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/broadcasts/${broadcastId}/dismiss`) &&
          res.request().method() === "POST" &&
          res.ok()
      );
      await banner.getByRole("button", { name: "Dismiss" }).click();
      await dismissPost;

      await expect(page.getByText(title)).toBeHidden({ timeout: 15_000 });

      const activeAfterDismiss = await getActiveBroadcastsViaApi(request, standardAuth);
      expect(activeAfterDismiss.some((b) => b.id === broadcastId)).toBe(false);

      await page.reload();
      await page.evaluate(() => window.dispatchEvent(new Event("apex:auth")));
      await expect(page.getByText(title)).toHaveCount(0);
    } finally {
      if (broadcastId) {
        await archiveBroadcastViaAdminApi(request, adminAuth, broadcastId).catch(
          () => undefined
        );
      }
    }
  });

  test("J2 — notification bell: follow request → badge → mark all as viewed", async ({
    page,
    request,
  }) => {
    const privateAuth = await loginPersona(request, "private");
    const socialBAuth = await loginPersona(request, "socialB");
    const bell = headerNotificationsBell(page);

    try {
      await unfollowUserViaApi(request, socialBAuth, privateAuth.userId);
      await followUserViaApi(request, socialBAuth, privateAuth.userId);

      await expect
        .poll(async () => countUnreadNotificationsViaApi(request, privateAuth), {
          timeout: 30_000,
        })
        .toBeGreaterThan(0);

      await gotoAuthenticated(page, privateAuth, "/");
      await expect(bell.locator("span")).toBeVisible({ timeout: 30_000 });

      await bell.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog.getByRole("heading", { name: "Notifications" })).toBeVisible();
      await expect(dialog.getByText(/E2E Social B/i)).toBeVisible();
      await expect(dialog.getByText(/requested to follow you/i)).toBeVisible();

      const markReadPost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/notifications/read") &&
          res.request().method() === "POST" &&
          res.ok()
      );
      await dialog.getByRole("button", { name: "Mark all as viewed" }).click();
      await markReadPost;

      await expect(bell.locator("span")).toHaveCount(0, { timeout: 15_000 });
      expect(await countUnreadNotificationsViaApi(request, privateAuth)).toBe(0);
    } finally {
      await unfollowUserViaApi(request, socialBAuth, privateAuth.userId).catch(() => undefined);
    }
  });
});
