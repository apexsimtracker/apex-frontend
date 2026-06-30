import { expect, test } from "@playwright/test";
import { authHeaders, gotoAuthenticated, loginViaUi } from "./helpers/auth";
import { avatarFixture } from "./helpers/fixtures";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";
import {
  DEFAULT_WEEKLY_GOALS,
  deleteAvatarFromR2ByPublicUrl,
  deleteSessionViaAdminApi,
  getFollowStatusViaApi,
  getMeViaApi,
  isR2Configured,
  patchMeViaApi,
  patchPrivacyViaApi,
  patchWeeklyGoalsViaApi,
  reseedE2eUsers,
  unfollowUserViaApi,
} from "./helpers/profile";
import {
  followUserViaApi,
  getSessionDetailViaApi,
  uploadSessionJsonViaApi,
} from "./helpers/sessions";

test.describe("@profile", () => {
  test.describe.configure({ mode: "serial" });

  test("C1 — edit profile: display name and bio", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");
    const baseline = await getMeViaApi(request, auth);
    const originalName = baseline.displayName?.trim() || "E2E Standard";
    const originalBio = baseline.bio ?? null;

    const updatedName = `E2E Profile ${Date.now()}`.slice(0, 40);
    const updatedBio = "E2E bio updated by Playwright";

    try {
      await gotoAuthenticated(page, auth, "/profile");
      await page.getByRole("button", { name: "Edit Profile" }).click();
      await expect(
        page.getByRole("heading", { name: "Edit Profile" }),
      ).toBeVisible();

      await page.getByLabel("Display name").fill(updatedName);
      await page.getByLabel("Bio").fill(updatedBio);

      const patchMe = page.waitForResponse(
        (res) =>
          res.url().includes("/api/auth/me") &&
          res.request().method() === "PATCH",
      );
      await page.getByRole("button", { name: "Save" }).click();
      const patchRes = await patchMe;
      expect(patchRes.ok()).toBeTruthy();

      await expect(
        page.getByRole("heading", { name: "Edit Profile" }),
      ).toBeHidden({
        timeout: 30_000,
      });
      await expect(
        page.getByRole("heading", { name: updatedName, level: 1 }),
      ).toBeVisible();
      await expect(page.getByText(updatedBio)).toBeVisible();

      const me = await getMeViaApi(request, auth);
      expect(me.displayName).toBe(updatedName);
      expect(me.bio).toBe(updatedBio);
    } finally {
      await patchMeViaApi(request, auth, {
        displayName: originalName,
        bio: originalBio,
      }).catch(() => undefined);
    }
  });

  test("C2 — avatar upload via profile edit", async ({ page, request }) => {
    test.skip(
      !isR2Configured(),
      "R2 env vars must be set on the backend for avatar upload",
    );
    test.setTimeout(120_000);

    const auth = await loginPersona(request, "standard");
    const baseline = await getMeViaApi(request, auth);
    const originalAvatarUrl = baseline.avatarUrl ?? null;
    let uploadedAvatarUrl: string | null = null;

    try {
      await gotoAuthenticated(page, auth, "/profile");
      await page.getByRole("button", { name: "Edit Profile" }).click();
      await expect(
        page.getByRole("heading", { name: "Edit Profile" }),
      ).toBeVisible();

      await page.locator("#edit-avatar-file").setInputFiles(avatarFixture());
      await expect(page.locator('img[alt="Preview"]')).toBeVisible();

      const avatarUpload = page.waitForResponse(
        (res) =>
          res.url().includes("/api/profile/avatar") &&
          res.request().method() === "POST",
      );
      const patchMe = page.waitForResponse(
        (res) =>
          res.url().includes("/api/auth/me") &&
          res.request().method() === "PATCH",
      );
      await page.getByRole("button", { name: "Save" }).click();

      const uploadRes = await avatarUpload;
      if (uploadRes.status() === 503) {
        test.skip(true, "Avatar storage unavailable (R2 returned 503)");
      }
      if (!uploadRes.ok()) {
        const body = await uploadRes.text();
        throw new Error(
          `Avatar upload failed (${uploadRes.status()}): ${body}`,
        );
      }
      const uploadBody = (await uploadRes.json()) as {
        avatarUrl?: string | null;
      };
      expect(uploadBody.avatarUrl?.trim()).toBeTruthy();
      uploadedAvatarUrl = uploadBody.avatarUrl?.trim() ?? null;

      const patchRes = await patchMe;
      expect(patchRes.ok()).toBeTruthy();

      const me = await getMeViaApi(request, auth);
      expect(me.avatarUrl?.trim()).toBeTruthy();
    } finally {
      if (uploadedAvatarUrl && uploadedAvatarUrl !== originalAvatarUrl) {
        deleteAvatarFromR2ByPublicUrl(uploadedAvatarUrl);
      }
      await patchMeViaApi(request, auth, {
        avatarUrl: originalAvatarUrl,
      }).catch(() => undefined);
    }
  });

  test("C3 — weekly goals: PATCH targets reflected on home", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    const customTargets = {
      weeklyRacesTarget: 15,
      weeklyPodiumsTarget: 8,
      weeklyLapsTarget: 200,
    };

    try {
      const patchBody = await patchWeeklyGoalsViaApi(
        request,
        auth,
        customTargets,
      );
      expect(patchBody.weeklyGoals.races.target).toBe(15);
      expect(patchBody.weeklyGoals.podiums.target).toBe(8);
      expect(patchBody.weeklyGoals.laps.target).toBe(200);

      await gotoAuthenticated(page, auth, "/");
      await expect(
        page.getByRole("heading", { name: "Weekly Goals" }),
      ).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText("/15")).toBeVisible();
      await expect(page.getByText("/8")).toBeVisible();
      await expect(page.getByText("/200")).toBeVisible();
    } finally {
      await patchWeeklyGoalsViaApi(request, auth, DEFAULT_WEEKLY_GOALS).catch(
        () => undefined,
      );
    }
  });

  test("C4 — privacy profile: follow request and bell accept", async ({
    page,
    request,
  }) => {
    const privateAuth = await loginPersona(request, "private");
    const socialBAuth = await loginPersona(request, "socialB");

    try {
      await patchPrivacyViaApi(request, privateAuth, {
        privateProfile: true,
        manualFollowApproval: true,
      });
      await unfollowUserViaApi(request, socialBAuth, privateAuth.userId);

      await gotoAuthenticated(page, socialBAuth, `/user/${privateAuth.userId}`);
      await expect(
        page.getByRole("heading", { name: /E2E Private/i }),
      ).toBeVisible();

      const followPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/users/${privateAuth.userId}/follow`) &&
          res.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Request to follow" }).click();
      const followRes = await followPost;
      expect(followRes.ok()).toBeTruthy();

      await gotoAuthenticated(page, privateAuth, "/settings");
      await page.getByRole("button", { name: "Notifications" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page.getByRole("button", { name: "Follow requests" }).click();
      await expect(page.getByText(/E2E Social B/i)).toBeVisible({
        timeout: 30_000,
      });

      const acceptPost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/me/follow-requests/") &&
          res.request().method() === "POST" &&
          res.url().includes("/accept"),
      );
      await page.getByRole("button", { name: "Approve" }).first().click();
      await acceptPost;

      const status = await getFollowStatusViaApi(
        request,
        socialBAuth,
        privateAuth.userId,
      );
      expect(status.isFollowing).toBe(true);
    } finally {
      await unfollowUserViaApi(request, socialBAuth, privateAuth.userId).catch(
        () => undefined,
      );
      await patchPrivacyViaApi(request, privateAuth, {
        privateProfile: true,
        manualFollowApproval: true,
        sessionVisibility: "PUBLIC",
      }).catch(() => undefined);
    }
  });

  test("C5 — session visibility: FOLLOWERS_ONLY gating", async ({
    page,
    request,
  }) => {
    const ownerAuth = await loginPersona(request, "standard");
    const followerAuth = await loginPersona(request, "socialB");
    const strangerAuth = await loginPersona(request, "webhookFree");
    const adminAuth = await loginPersona(request, "admin");

    let sessionId: string | null = null;

    try {
      await patchPrivacyViaApi(request, ownerAuth, {
        sessionVisibility: "FOLLOWERS_ONLY",
      });
      await unfollowUserViaApi(request, followerAuth, ownerAuth.userId);
      await followUserViaApi(request, followerAuth, ownerAuth.userId);

      const upload = await uploadSessionJsonViaApi(
        request,
        ownerAuth,
        "practice_spa_ferrari-gt3_8laps.json",
      );
      sessionId = upload.sessionId;

      await gotoAuthenticated(page, strangerAuth, `/sessions/${sessionId}`);
      await expect(
        page.getByText(/limited to the driver's followers|don't have access/i),
      ).toBeVisible({ timeout: 30_000 });

      const env = getE2eEnv();
      const strangerRes = await request.get(
        `${env.apiUrl}/api/sessions/${encodeURIComponent(sessionId)}`,
        { headers: authHeaders(strangerAuth.token, strangerAuth.sessionToken) },
      );
      expect(strangerRes.status()).toBe(403);

      await gotoAuthenticated(page, followerAuth, `/sessions/${sessionId}`);
      await expect(page.getByRole("heading", { name: /Spa/i })).toBeVisible({
        timeout: 30_000,
      });
      await expect(
        page.getByText("Total Laps").locator("..").getByText("8"),
      ).toBeVisible();

      const followerDetail = await getSessionDetailViaApi(
        request,
        followerAuth,
        sessionId,
      );
      expect(followerDetail.lapCount).toBe(8);
    } finally {
      if (sessionId) {
        await deleteSessionViaAdminApi(request, adminAuth, sessionId).catch(
          () => undefined,
        );
      }
      await unfollowUserViaApi(request, followerAuth, ownerAuth.userId).catch(
        () => undefined,
      );
      await patchPrivacyViaApi(request, ownerAuth, {
        sessionVisibility: "PUBLIC",
      }).catch(() => undefined);
    }
  });

  test("C6 — change password (sacrificial persona)", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "sacrificial");
    const rotatedPassword = `${env.password}Rotated`;

    try {
      await gotoAuthenticated(page, auth, "/settings");
      await expect(
        page.getByRole("heading", { name: "Settings" }),
      ).toBeVisible();

      await page.getByPlaceholder("Current password").fill(env.password);
      await page.getByPlaceholder("New password").fill(rotatedPassword);

      const changePost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/settings/change-password") &&
          res.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Update password" }).click();
      const changeRes = await changePost;
      expect(changeRes.ok()).toBeTruthy();
      await expect(page.getByText("Password updated.")).toBeVisible();

      await loginViaUi(
        page,
        env.personas.sacrificial,
        rotatedPassword,
        "/profile",
      );
      await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });
    } finally {
      reseedE2eUsers();
    }
  });

  test("C7 — data export with prior session upload", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    await uploadSessionJsonViaApi(
      request,
      auth,
      "practice_spa_ferrari-gt3_8laps.json",
    );

    await gotoAuthenticated(page, auth, "/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const exportGet = page.waitForResponse(
      (res) =>
        res.url().includes("/api/settings/data-export") &&
        res.request().method() === "GET",
    );
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export data" }).click();

    const exportRes = await exportGet;
    expect(exportRes.ok()).toBeTruthy();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/apex-data-export-.*\.xlsx$/);
  });

  test("C8 — account deletion (sacrificial persona)", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "sacrificial");

    await gotoAuthenticated(page, auth, "/settings");
    await page.getByRole("button", { name: "Delete account" }).click();
    const deleteDialog = page.getByRole("alertdialog");
    await expect(
      deleteDialog.getByRole("heading", { name: "Delete account" }),
    ).toBeVisible();

    await deleteDialog.getByPlaceholder("Current password").fill(env.password);
    await deleteDialog.getByPlaceholder("Type DELETE").fill("DELETE");

    const deleteReq = page.waitForResponse(
      (res) =>
        res.url().includes("/api/settings/account") &&
        res.request().method() === "DELETE",
    );
    await deleteDialog
      .getByRole("button", { name: "Delete permanently" })
      .click();
    const deleteRes = await deleteReq;
    expect(deleteRes.ok()).toBeTruthy();

    await expect(page).toHaveURL(/\/login$/, { timeout: 30_000 });

    const meRes = await request.get(`${env.apiUrl}/api/auth/me`, {
      headers: authHeaders(auth.token, auth.sessionToken),
    });
    expect(meRes.status()).toBe(401);
  });

  test.afterAll(() => {
    reseedE2eUsers();
  });
});
