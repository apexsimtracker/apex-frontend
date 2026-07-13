import { expect, test } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import { loginPersona } from "./helpers/personas";

test.describe("@sessions-v2", () => {
  test("loads library dashboard with meta + list APIs (not activity feed)", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");

    const activityHits: string[] = [];
    page.on("response", (res) => {
      const url = res.url();
      if (
        url.includes("/api/activity") &&
        !url.includes("/api/sessions/library")
      ) {
        activityHits.push(url);
      }
    });

    const metaWait = page.waitForResponse(
      (res) =>
        res.url().includes("/api/sessions/library/meta") &&
        res.request().method() === "GET",
    );
    const listWait = page.waitForResponse(
      (res) =>
        /\/api\/sessions\/library(\?|$)/.test(res.url()) &&
        !res.url().includes("/meta") &&
        !res.url().includes("/stats") &&
        res.request().method() === "GET",
    );

    await gotoAuthenticated(page, auth, "/v2/sessions");

    const [metaRes, listRes] = await Promise.all([metaWait, listWait]);
    expect(metaRes.ok()).toBeTruthy();
    expect(listRes.ok()).toBeTruthy();

    await expect(
      page.getByRole("heading", { name: "Sessions", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Your sim racing library")).toBeVisible();
    expect(activityHits).toEqual([]);
  });

  test("syncs type filter and view toggle to URL", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    await gotoAuthenticated(page, auth, "/v2/sessions");

    await expect(
      page.getByRole("heading", { name: "Sessions", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    await page.getByRole("tab", { name: /Telemetry/i }).click();
    await expect(page).toHaveURL(/type=telemetry/);

    await page.getByRole("button", { name: /Table/i }).click();
    await expect(page).toHaveURL(/view=table/);

    const statsWait = page.waitForResponse(
      (res) =>
        res.url().includes("/api/sessions/library/stats") &&
        res.url().includes("tab=racing") &&
        res.ok(),
    );
    await page.getByRole("tab", { name: /Racing/i }).click();
    await expect(page).toHaveURL(/statsTab=racing/);
    await statsWait;
  });

  test("session kind filter resets page and updates list query", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    await gotoAuthenticated(page, auth, "/v2/sessions?page=2");

    await expect(
      page.getByRole("heading", { name: "Sessions", exact: true }),
    ).toBeVisible({ timeout: 30_000 });

    const listWait = page.waitForResponse(
      (res) =>
        /\/api\/sessions\/library\?/.test(res.url()) &&
        res.url().includes("sessionKind=race") &&
        res.request().method() === "GET",
    );

    await page.getByLabel("Session kind").selectOption("race");
    const listRes = await listWait;
    expect(listRes.ok()).toBeTruthy();
    await expect(page).toHaveURL(/sessionKind=race/);
    await expect(page).not.toHaveURL(/page=2/);
  });
});
