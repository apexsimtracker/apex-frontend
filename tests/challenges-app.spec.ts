import { expect, test } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import {
  banChallengeParticipantViaAdminApi,
  getAdminChallengeLeaderboardViaAdminApi,
  patchChallengeViaAdminApi,
  resetTransitionChallengeFixture,
  unbanChallengeParticipantViaAdminApi,
} from "./helpers/challenges-admin";
import {
  formatChallengeDateTimeForExpect,
  getChallengeDetailViaApi,
  getChallengeLeaderboardViaApi,
  getUserPublicProfileViaApi,
  listChallengesViaApi,
} from "./helpers/challenges";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";

const UPCOMING_TITLE = /E2E Upcoming Spa GT3/i;
const LIVE_TITLE = /E2E Road Atlanta GT3/i;
const PAST_TITLE = /E2E Past Monza GT3/i;
const CASCADE_TITLE = /E2E Cascade Silverstone GT3/i;
const TRANSITION_TITLE = /E2E Transition Dynamic GT3/i;

function challengeRow(page: import("@playwright/test").Page, title: RegExp) {
  return page.locator("article").filter({ hasText: title }).first();
}

test.describe("@challenges-app", () => {
  test.describe.configure({ mode: "serial" });

  test("V2-1 — browse tabs show correct time labels (Upcoming / Live / Past)", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");

    const upcomingDetail = await getChallengeDetailViaApi(
      request,
      auth,
      env.challengeUpcomingId,
    );
    const liveDetail = await getChallengeDetailViaApi(
      request,
      auth,
      env.challengeId,
    );
    const pastDetail = await getChallengeDetailViaApi(
      request,
      auth,
      env.challengePastId,
    );

    await gotoAuthenticated(page, auth, "/challenges");

    await page.getByRole("button", { name: "Upcoming", exact: true }).click();
    const upcomingRow = challengeRow(page, UPCOMING_TITLE);
    await expect(upcomingRow).toBeVisible({ timeout: 30_000 });
    const upcomingStarts = formatChallengeDateTimeForExpect(
      upcomingDetail.startsAt as string,
    );
    await expect(upcomingRow).toContainText(`Starts ${upcomingStarts}`);

    await page.getByRole("button", { name: "Live", exact: true }).click();
    const liveRow = challengeRow(page, LIVE_TITLE);
    await expect(liveRow).toBeVisible({ timeout: 30_000 });
    const liveEnds = formatChallengeDateTimeForExpect(
      liveDetail.endsAt as string,
    );
    await expect(liveRow).toContainText(`Ends ${liveEnds}`);
    await expect(liveRow).toContainText(/left/);

    await page.getByRole("button", { name: "Past", exact: true }).click();
    const pastRow = challengeRow(page, PAST_TITLE);
    await expect(pastRow).toBeVisible({ timeout: 30_000 });
    const pastStarts = formatChallengeDateTimeForExpect(
      pastDetail.startsAt as string,
    );
    const pastEnds = formatChallengeDateTimeForExpect(
      pastDetail.endsAt as string,
    );
    await expect(pastRow).toContainText(`${pastStarts} – ${pastEnds}`);
  });

  test("V2-2 — Past tab pagination matches discussion-style footer", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");

    const list = await listChallengesViaApi(request, auth, {
      status: "ENDED",
      page: 1,
      pageSize: 12,
    });
    expect(list.total).toBeGreaterThanOrEqual(13);
    expect(list.totalPages).toBeGreaterThanOrEqual(2);

    await gotoAuthenticated(page, auth, "/challenges");
    await page.getByRole("button", { name: "Past", exact: true }).click();

    await expect(
      page.getByText(`Showing 1–12 of ${list.total}`),
    ).toBeVisible({ timeout: 30_000 });

    const pagination = page.getByRole("navigation", { name: "Pagination" });
    await expect(pagination.getByRole("button", { name: /Previous/i })).toBeVisible();
    await expect(pagination.getByRole("button", { name: /Next page/i })).toBeVisible();

    const page2Response = page.waitForResponse(
      (res) =>
        res.url().includes("/api/challenges") &&
        res.url().includes("status=ENDED") &&
        res.url().includes("page=2") &&
        res.ok(),
    );
    await pagination.getByRole("button", { name: /Next page/i }).click();
    await page2Response;

    const endOnPage2 = Math.min(24, list.total);
    await expect(
      page.getByText(`Showing 13–${endOnPage2} of ${list.total}`),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("V2-3 — challenge transitions Upcoming → Live → Past on detail page", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);

    const env = getE2eEnv();
    const adminAuth = await loginPersona(request, "admin");
    const viewerAuth = await loginPersona(request, "standard");

    resetTransitionChallengeFixture();

    const now = Date.now();
    const startsAt = new Date(now + 8_000).toISOString();
    const endsAt = new Date(now + 35_000).toISOString();

    await patchChallengeViaAdminApi(
      request,
      adminAuth,
      env.challengeTransitionId,
      { startsAt, endsAt },
    );

    await gotoAuthenticated(
      page,
      viewerAuth,
      `/challenge/${env.challengeTransitionId}`,
    );

    await expect(page.getByText("Upcoming", { exact: true }).first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(page.getByText("Live", { exact: true }).first()).toBeVisible({
      timeout: 20_000,
    });

    await expect(page.getByText("Finished", { exact: true }).first()).toBeVisible({
      timeout: 45_000,
    });

    await gotoAuthenticated(page, viewerAuth, "/challenges");
    await page.getByRole("button", { name: "Past", exact: true }).click();

    await expect(challengeRow(page, TRANSITION_TITLE)).toBeVisible({
      timeout: 45_000,
    });
  });

  test("V2-4 — static cascade badges on profiles after seed disqualification", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");
    const standardAuth = await loginPersona(request, "standard");
    const socialBAuth = await loginPersona(request, "socialB");
    const sacrificialAuth = await loginPersona(request, "sacrificial");

    const standardProfile = await getUserPublicProfileViaApi(
      request,
      auth,
      standardAuth.userId,
    );
    const socialBProfile = await getUserPublicProfileViaApi(
      request,
      auth,
      socialBAuth.userId,
    );
    const sacrificialProfile = await getUserPublicProfileViaApi(
      request,
      auth,
      sacrificialAuth.userId,
    );

    const standardCascadeBadge = standardProfile.challengeBadges?.find(
      (b) => b.challengeId === env.challengeCascadeId,
    );
    expect(standardCascadeBadge?.place).toBe(1);
    expect(standardCascadeBadge?.tier).toBe("GOLD");

    const socialBCascadeBadge = socialBProfile.challengeBadges?.find(
      (b) => b.challengeId === env.challengeCascadeId,
    );
    expect(socialBCascadeBadge?.place).toBe(2);

    const sacrificialCascadeBadge = sacrificialProfile.challengeBadges?.find(
      (b) => b.challengeId === env.challengeCascadeId,
    );
    expect(sacrificialCascadeBadge).toBeUndefined();

    await gotoAuthenticated(page, auth, `/user/${standardAuth.userId}`);
    await expect(
      page.getByRole("button", {
        name: /P1 — GOLD — E2E Cascade Silverstone/i,
      }),
    ).toBeVisible({ timeout: 30_000 });

    await gotoAuthenticated(page, auth, `/user/${socialBAuth.userId}`);
    await expect(
      page.getByRole("button", {
        name: /P2 — SILVER — E2E Cascade Silverstone/i,
      }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("V2-5 — admin ban cascades ranks and updates profile badges", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const adminAuth = await loginPersona(request, "admin");
    const viewerAuth = await loginPersona(request, "standard");
    const proAuth = await loginPersona(request, "proSeed");
    const standardAuth = await loginPersona(request, "standard");
    const socialAAuth = await loginPersona(request, "socialA");

    try {
      await unbanChallengeParticipantViaAdminApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
        proAuth.userId,
      );

      let lb = await getChallengeLeaderboardViaApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
      );
      expect(lb.items[0]?.userId).toBe(proAuth.userId);
      expect(lb.items[1]?.userId).toBe(standardAuth.userId);
      expect(lb.items[2]?.userId).toBe(socialAAuth.userId);

      await gotoAuthenticated(page, viewerAuth, `/user/${proAuth.userId}`);
      await expect(
        page.getByRole("button", {
          name: /P1 — GOLD — E2E Ban Target Laguna GT3/i,
        }),
      ).toBeVisible({ timeout: 30_000 });

      await banChallengeParticipantViaAdminApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
        proAuth.userId,
        "E2E Playwright — disqualify 1st place",
      );

      lb = await getChallengeLeaderboardViaApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
      );
      expect(lb.items[0]?.userId).toBe(standardAuth.userId);
      expect(lb.items[1]?.userId).toBe(socialAAuth.userId);
      expect(lb.items.some((r) => r.userId === proAuth.userId)).toBe(false);

      const adminLb = await getAdminChallengeLeaderboardViaAdminApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
      );
      expect(
        adminLb.items.find((r) => r.userId === proAuth.userId)?.ban,
      ).toBeTruthy();

      const proProfile = await getUserPublicProfileViaApi(
        request,
        viewerAuth,
        proAuth.userId,
      );
      const proBanTargetBadge = proProfile.challengeBadges?.find(
        (b) => b.challengeId === env.challengeBanTargetId,
      );
      expect(proBanTargetBadge).toBeUndefined();

      const standardProfile = await getUserPublicProfileViaApi(
        request,
        viewerAuth,
        standardAuth.userId,
      );
      const standardBanTargetBadge = standardProfile.challengeBadges?.find(
        (b) => b.challengeId === env.challengeBanTargetId,
      );
      expect(standardBanTargetBadge?.place).toBe(1);
      expect(standardBanTargetBadge?.tier).toBe("GOLD");

      await gotoAuthenticated(page, viewerAuth, `/user/${standardAuth.userId}`);
      await expect(
        page.getByRole("button", {
          name: /P1 — GOLD — E2E Ban Target Laguna GT3/i,
        }),
      ).toBeVisible({ timeout: 30_000 });
    } finally {
      await unbanChallengeParticipantViaAdminApi(
        request,
        adminAuth,
        env.challengeBanTargetId,
        proAuth.userId,
      );
    }
  });

  test("V2-6 — multi-win user opens challenge badge history modal", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");
    const proAuth = await loginPersona(request, "proSeed");

    const proProfile = await getUserPublicProfileViaApi(
      request,
      auth,
      proAuth.userId,
    );
    expect((proProfile.challengeBadges ?? []).length).toBeGreaterThanOrEqual(2);

    await gotoAuthenticated(page, auth, `/user/${proAuth.userId}`);
    await expect(page.getByText("Podium badges")).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "View history" }).click();

    await expect(
      page.getByRole("dialog").getByText("Challenge podium history"),
    ).toBeVisible();
    await expect(page.getByRole("dialog").getByText(PAST_TITLE)).toBeVisible();
    await expect(page.getByRole("dialog").getByText(CASCADE_TITLE)).toBeVisible();

    await expect(
      page.getByRole("dialog").locator(
        `a[href="/challenge/${env.challengePastId}"]`,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").locator(
        `a[href="/challenge/${env.challengeCascadeId}"]`,
      ),
    ).toBeVisible();
  });
});
