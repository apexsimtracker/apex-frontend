import { expect, test } from "@playwright/test";
import { authHeaders, gotoAuthenticated } from "./helpers/auth";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";
import {
  deleteSessionViaAdminApi,
  getFollowStatusViaApi,
  unfollowUserViaApi,
} from "./helpers/profile";
import {
  listHomeFeedSessionIds,
  uploadSessionJsonViaApi,
} from "./helpers/sessions";

type FollowListPage = {
  items?: Array<{ id?: string; displayName?: string | null }>;
  total?: number;
};

test.describe("@social", () => {
  test.describe.configure({ mode: "serial" });

  test("E1 — follow public user: challenge follows socialA → instant follow", async ({
    page,
    request,
  }) => {
    const challengeAuth = await loginPersona(request, "challenge");
    const socialAAuth = await loginPersona(request, "socialA");

    try {
      await unfollowUserViaApi(request, challengeAuth, socialAAuth.userId);

      await gotoAuthenticated(
        page,
        challengeAuth,
        `/user/${socialAAuth.userId}`,
      );
      await expect(
        page.getByRole("heading", { name: /E2E Social A/i }),
      ).toBeVisible();

      const followPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/users/${socialAAuth.userId}/follow`) &&
          res.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Follow", exact: true }).click();
      const followRes = await followPost;
      expect(followRes.ok()).toBeTruthy();

      await expect(
        page.getByRole("button", { name: "Unfollow", exact: true }),
      ).toBeVisible({
        timeout: 30_000,
      });

      const status = await getFollowStatusViaApi(
        request,
        challengeAuth,
        socialAAuth.userId,
      );
      expect(status.isFollowing).toBe(true);
    } finally {
      await unfollowUserViaApi(
        request,
        challengeAuth,
        socialAAuth.userId,
      ).catch(() => undefined);
    }
  });

  test("E2 — follow request + accept: socialB → private → bell accept", async ({
    page,
    request,
  }) => {
    const privateAuth = await loginPersona(request, "private");
    const socialBAuth = await loginPersona(request, "socialB");

    try {
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
    }
  });

  test("E3 — home feed: socialA uploads session; socialB sees on /", async ({
    page,
    request,
  }) => {
    const socialAAuth = await loginPersona(request, "socialA");
    const socialBAuth = await loginPersona(request, "socialB");
    const adminAuth = await loginPersona(request, "admin");

    let sessionId: string | null = null;

    try {
      const upload = await uploadSessionJsonViaApi(
        request,
        socialAAuth,
        "practice_spa_bmw-gt3_7laps.json",
      );
      sessionId = upload.sessionId;
      expect(upload.lapCount).toBe(7);

      const homeIds = await listHomeFeedSessionIds(request, socialBAuth);
      expect(homeIds).toContain(sessionId);

      await gotoAuthenticated(page, socialBAuth, "/");
      const card = page
        .locator(".rounded-lg.border")
        .filter({ hasText: /E2E Social A/i })
        .filter({ hasText: /Spa/i })
        .filter({ hasText: /BMW|GT3/i })
        .first();
      await expect(card).toBeVisible({ timeout: 30_000 });
    } finally {
      if (sessionId) {
        await deleteSessionViaAdminApi(request, adminAuth, sessionId).catch(
          () => undefined,
        );
      }
    }
  });

  test("E4 — followers/following dialogs: /user/:socialA lists include B", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const socialAAuth = await loginPersona(request, "socialA");
    const socialBAuth = await loginPersona(request, "socialB");

    const followersRes = await request.get(
      `${env.apiUrl}/api/users/${encodeURIComponent(socialAAuth.userId)}/followers?page=1&limit=20`,
      { headers: authHeaders(socialBAuth.token, socialBAuth.sessionToken) },
    );
    expect(followersRes.ok()).toBeTruthy();
    const followersBody = (await followersRes.json()) as FollowListPage;
    const followerIds = (followersBody.items ?? [])
      .map((user) => user.id?.trim())
      .filter((id): id is string => Boolean(id));
    expect(followerIds).toContain(socialBAuth.userId);
    expect((followersBody.total ?? 0) >= 1).toBeTruthy();

    const followingRes = await request.get(
      `${env.apiUrl}/api/users/${encodeURIComponent(socialAAuth.userId)}/following?page=1&limit=20`,
      { headers: authHeaders(socialBAuth.token, socialBAuth.sessionToken) },
    );
    expect(followingRes.ok()).toBeTruthy();

    await gotoAuthenticated(page, socialBAuth, `/user/${socialAAuth.userId}`);
    await expect(
      page.getByRole("heading", { name: /E2E Social A/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Followers$/ }).click();
    const followersDialog = page.getByRole("dialog");
    await expect(
      followersDialog.getByRole("heading", { name: "Followers" }),
    ).toBeVisible();
    await expect(followersDialog.getByText(/E2E Social B/i)).toBeVisible({
      timeout: 30_000,
    });
    await page.keyboard.press("Escape");
    await expect(followersDialog).toBeHidden({ timeout: 15_000 });

    await page.getByRole("button", { name: /Following$/ }).click();
    const followingDialog = page.getByRole("dialog");
    await expect(
      followingDialog.getByRole("heading", { name: "Following" }),
    ).toBeVisible();
    await expect(followingDialog).toBeVisible({ timeout: 15_000 });
  });
});
