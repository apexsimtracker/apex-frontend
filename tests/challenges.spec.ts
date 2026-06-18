import { expect, test } from "@playwright/test";
import { gotoAuthenticated } from "./helpers/auth";
import {
  findLeaderboardRowForUser,
  getChallengeDetailViaApi,
  getChallengeLeaderboardViaApi,
  isChallengeParticipantViaApi,
  joinChallengeViaApi,
  leaveChallengeViaApi,
} from "./helpers/challenges";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";
import {
  getSessionDetailViaApi,
  uploadSessionJsonViaApi,
} from "./helpers/sessions";

const CHALLENGE_TITLE = /E2E Road Atlanta GT3/i;

test.describe("@challenges", () => {
  test.describe.configure({ mode: "serial" });

  test("G1 — join challenge: standard joins on /challenges, cleanup leave if allowed", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");

    try {
      if (await isChallengeParticipantViaApi(request, auth, env.challengeId)) {
        await leaveChallengeViaApi(request, auth, env.challengeId);
      }

      await gotoAuthenticated(page, auth, "/challenges");
      await expect(page.getByRole("heading", { name: "Challenges" })).toBeVisible();

      await page.getByRole("button", { name: "Live" }).click();
      const challengeCard = page
        .locator(".rounded-lg.border")
        .filter({ hasText: CHALLENGE_TITLE })
        .first();
      await expect(challengeCard).toBeVisible({ timeout: 30_000 });

      const joinPost = page.waitForResponse(
        (res) =>
          res.url().includes(`/api/challenges/${env.challengeId}/join`) &&
          res.request().method() === "POST"
      );
      await challengeCard.getByRole("button", { name: "Join" }).click();
      const joinRes = await joinPost;
      expect(joinRes.ok()).toBeTruthy();

      await expect(challengeCard.getByRole("button", { name: "Joined" })).toBeVisible({
        timeout: 15_000,
      });

      await page
        .locator(".mb-8.flex.flex-wrap")
        .getByRole("button", { name: "Joined" })
        .click();
      await expect(
        page.locator(".rounded-lg.border").filter({ hasText: CHALLENGE_TITLE }).first()
      ).toBeVisible({ timeout: 30_000 });

      const detail = await getChallengeDetailViaApi(request, auth, env.challengeId);
      expect(detail.joined).toBe(true);
    } finally {
      const detail = await getChallengeDetailViaApi(request, auth, env.challengeId).catch(
        () => null
      );
      if (detail?.joined && detail.canLeave !== false) {
        await leaveChallengeViaApi(request, auth, env.challengeId).catch(() => undefined);
      }
    }
  });

  test("G2 — challenge match upload: pre-joined persona posts JSON → leaderboard entry", async ({
    page,
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "challenge");

    const detailBefore = await getChallengeDetailViaApi(request, auth, env.challengeId);
    expect(detailBefore.joined).toBe(true);

    const upload = await uploadSessionJsonViaApi(
      request,
      auth,
      "challenge_match_road-atlanta_gt3.json",
      { challengeId: env.challengeId }
    );
    expect(upload.challengeAttachWarning).toBeNull();

    const session = await getSessionDetailViaApi(request, auth, upload.sessionId);
    expect(session.lapCount).toBe(7);

    const leaderboard = await getChallengeLeaderboardViaApi(request, auth, env.challengeId);
    const row = findLeaderboardRowForUser(leaderboard, auth.userId || "");
    expect(row).toBeTruthy();
    expect(row!.bestLapMs).toBe(118_380);
    expect(row!.attemptCount).toBeGreaterThanOrEqual(1);
    expect(row!.verification).toBe("VERIFIED");

    await gotoAuthenticated(page, auth, `/challenge/${env.challengeId}`);
    await expect(page.getByRole("heading", { name: CHALLENGE_TITLE })).toBeVisible();
    await page.getByRole("button", { name: "Leaderboard" }).click();
    await expect(page.getByRole("columnheader", { name: "Driver" })).toBeVisible();
    await expect(page.getByText("E2E Challenge")).toBeVisible();
    await expect(page.getByText("1:58.380")).toBeVisible();
  });

  test("G3 — challenge mismatch uploads: wrong track or car → warning, no credit", async ({
    request,
  }) => {
    const env = getE2eEnv();
    const challengeAuth = await loginPersona(request, "challenge");
    const wrongTrackAuth = await loginPersona(request, "webhookFree");
    const wrongCarAuth = await loginPersona(request, "sacrificial");

    try {
      await joinChallengeViaApi(request, wrongTrackAuth, env.challengeId);
      await joinChallengeViaApi(request, wrongCarAuth, env.challengeId);

      const leaderboardBefore = await getChallengeLeaderboardViaApi(
        request,
        challengeAuth,
        env.challengeId
      );
      const rowBefore = findLeaderboardRowForUser(leaderboardBefore, challengeAuth.userId);
      const attemptsBefore = rowBefore?.attemptCount ?? 0;
      const bestBefore = rowBefore?.bestLapMs ?? null;

      const wrongTrack = await uploadSessionJsonViaApi(
        request,
        wrongTrackAuth,
        "challenge_mismatch_monza_wrong-track.json",
        { challengeId: env.challengeId }
      );
      expect(wrongTrack.challengeAttachWarning).toMatch(/do not match/i);

      const wrongTrackSession = await getSessionDetailViaApi(
        request,
        wrongTrackAuth,
        wrongTrack.sessionId
      );
      expect(wrongTrackSession.track).toMatch(/Monza/i);

      const wrongCar = await uploadSessionJsonViaApi(
        request,
        wrongCarAuth,
        "challenge_mismatch_road-atlanta_wrong-car.json",
        { challengeId: env.challengeId }
      );
      expect(wrongCar.challengeAttachWarning).toMatch(/do not match/i);

      const wrongCarSession = await getSessionDetailViaApi(
        request,
        wrongCarAuth,
        wrongCar.sessionId
      );
      expect(wrongCarSession.car).toMatch(/Formula Renault/i);

      const leaderboardAfter = await getChallengeLeaderboardViaApi(
        request,
        challengeAuth,
        env.challengeId
      );
      const rowAfter = findLeaderboardRowForUser(leaderboardAfter, challengeAuth.userId);
      expect(rowAfter?.attemptCount ?? 0).toBe(attemptsBefore);
      expect(rowAfter?.bestLapMs ?? null).toBe(bestBefore);
    } finally {
      await leaveChallengeViaApi(request, wrongTrackAuth, env.challengeId).catch(() => undefined);
      await leaveChallengeViaApi(request, wrongCarAuth, env.challengeId).catch(() => undefined);
    }
  });

  test("G4 — leaderboards navigation: metric tabs load and row opens profile", async ({
    page,
    request,
  }) => {
    const auth = await loginPersona(request, "standard");
    await uploadSessionJsonViaApi(request, auth, "race_spa_ferrari-gt3_podium.json");

    await gotoAuthenticated(page, auth, "/leaderboards");
    await expect(page.getByRole("heading", { name: "Leaderboards" })).toBeVisible();

    const tabs = [
      "Most Wins",
      "Most Races",
      "Podiums",
      "Fastest Laps",
      "Avg Finish",
    ] as const;

    for (const tab of tabs) {
      const leaderboardReq = page.waitForResponse(
        (res) =>
          res.url().includes("/api/leaderboards") && res.request().method() === "GET"
      );
      await page.getByRole("button", { name: tab }).click();
      const leaderboardRes = await leaderboardReq;
      expect(leaderboardRes.ok()).toBeTruthy();
    }

    await page.getByRole("button", { name: "Most Races" }).click();
    const profileLink = page
      .locator("button")
      .filter({ hasText: /E2E Standard/i })
      .first();
    await expect(profileLink).toBeVisible({ timeout: 30_000 });
    await profileLink.click();
    await expect(page).toHaveURL(/\/user\//, { timeout: 15_000 });
    await expect(page.getByText("E2E Standard").first()).toBeVisible();
  });

  test("G5 — global upload without challenge: no challenge leaderboard side effect", async ({
    request,
  }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");
    const challengeAuth = await loginPersona(request, "challenge");

    const leaderboardBefore = await getChallengeLeaderboardViaApi(
      request,
      challengeAuth,
      env.challengeId
    );
    const totalBefore = leaderboardBefore.total;

    const upload = await uploadSessionJsonViaApi(
      request,
      auth,
      "qualify_spa_ferrari-gt3_multi-lap.json"
    );
    expect(upload.challengeAttachWarning).toBeNull();

    const session = await getSessionDetailViaApi(request, auth, upload.sessionId);
    expect(session.track).toMatch(/Spa/i);
    expect(session.qualifyingPosition).toBe(3);

    const leaderboardAfter = await getChallengeLeaderboardViaApi(
      request,
      challengeAuth,
      env.challengeId
    );
    expect(leaderboardAfter.total).toBe(totalBefore);
  });
});
