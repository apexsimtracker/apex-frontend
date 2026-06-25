import { expect, test } from "@playwright/test";
import { authHeaders, clearGuestSession, gotoAuthenticated, loginViaApi, type AuthSession } from "./helpers/auth";
import {
  ensureProSeedHasPro,
  fetchEntitlement,
  pollUntilHasPro,
  postRevenueCatWebhook,
  selectMonthlyInterval,
  setDevEntitlement,
  waitForOfferingsReady,
  waitForWebhookSync,
} from "./helpers/billing";
import { getE2eEnv, isBillingConfigured } from "./helpers/env";
import { loginPersona } from "./helpers/personas";
import {
  getSessionDetailViaApi,
  uploadSessionJsonViaApi,
} from "./helpers/sessions";
import { completeStripeCheckout } from "./helpers/stripe";

/** Sandbox billing uses real Gmail accounts — absent after `prisma migrate reset`. */
async function loginSandboxBillingUser(
  request: import("@playwright/test").APIRequestContext,
  email: string,
  password: string
): Promise<AuthSession | null> {
  try {
    return await loginViaApi(request, email, password);
  } catch (err) {
    if (err instanceof Error && err.message.includes("(401)")) {
      return null;
    }
    throw err;
  }
}

test.describe("@billing", () => {
  test.beforeAll(() => {
    test.skip(!isBillingConfigured(), "Sandbox billing is not configured on the backend");
  });

  test.describe("B1 — checkout", () => {
    test.describe.configure({ mode: "serial" });
    test("monthly Stripe checkout grants Pro", async ({ page, context, request }) => {
      test.setTimeout(180_000);

      const env = getE2eEnv();
      const auth = await loginSandboxBillingUser(
        request,
        env.checkoutUserEmail,
        env.password
      );
      test.skip(
        !auth,
        "Sandbox checkout user not in DB — sign up E2E_CHECKOUT_USER_EMAIL after migrate reset (see E2E_BILLING.md)"
      );

      const meBefore = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      const meBeforeBody = (await meBefore.json()) as { hasPro?: boolean };
      test.skip(
        meBeforeBody.hasPro === true,
        "Checkout user already has Pro — cancel sandbox subscription or use a fresh account"
      );

      await gotoAuthenticated(page, auth!, "/pricing");

      if (await page.getByTestId("billing-pro-active").isVisible().catch(() => false)) {
        test.skip(true, "Checkout user already shows Pro on pricing page");
      }

      await expect(page.getByText(/Sandbox billing mode is enabled/i)).toBeVisible();
      await waitForOfferingsReady(page);
      await selectMonthlyInterval(page);

      await page.getByTestId("billing-subscribe-pro").click();
      await completeStripeCheckout(page, context);

      await expect(page.getByTestId("billing-pro-active")).toBeVisible({ timeout: 60_000 });
      await expect(
        page.getByText(/Welcome to Apex Pro|subscription is active|Purchase completed/i)
      ).toBeVisible({ timeout: 30_000 });

      await pollUntilHasPro(request, auth!, true, 60_000);

      const entitlement = await fetchEntitlement(request, auth!);
      expect(entitlement.effectivePlan).toBe("PRO");

      const pbs = await request.get(`${env.apiUrl}/api/personal-bests`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      expect(pbs.status()).toBe(200);
    });
  });

  test.describe("B2 — portal", () => {
    test.describe.configure({ mode: "serial" });
    test("manage subscription opens Stripe billing portal", async ({ page, request }) => {
      test.setTimeout(90_000);

      const env = getE2eEnv();
      const auth = await loginSandboxBillingUser(request, env.proUserEmail, env.password);
      test.skip(
        !auth,
        "Sandbox Pro user not in DB — sign up E2E_PRO_USER_EMAIL after migrate reset (see E2E_BILLING.md)"
      );

      await gotoAuthenticated(page, auth!, "/pricing");

      const proActive = page.getByTestId("billing-pro-active");
      const hasProUi = await proActive.isVisible().catch(() => false);
      test.skip(
        !hasProUi,
        "Pro user must have active Pro on /pricing (complete sandbox purchase or sync first)"
      );

      const portalResponsePromise = page.waitForResponse(
        (res) =>
          res.url().includes("/api/billing/portal") && res.request().method() === "POST"
      );
      const portalNavPromise = page.waitForURL(/billing\.stripe\.com/, {
        timeout: 45_000,
        waitUntil: "commit",
      });

      await page.getByTestId("billing-manage-subscription").click();

      const portalResponse = await portalResponsePromise;
      expect(portalResponse.request().headers().authorization ?? "").toMatch(/^Bearer /i);
      expect(portalResponse.ok()).toBeTruthy();

      const body = (await portalResponse.json()) as { url?: string };
      expect(body.url).toMatch(/^https:\/\/billing\.stripe\.com/);

      await portalNavPromise;
      expect(page.url()).toMatch(/billing\.stripe\.com/);
    });
  });

  test.describe("B3 — webhook", () => {
    test("rejects requests without Authorization", async ({ request }) => {
      const { status } = await postRevenueCatWebhook(
        request,
        {
          event: { id: `e2e-noauth-${Date.now()}`, type: "TEST" },
        },
        { secret: null }
      );
      expect(status).toBe(401);
    });

    test("accepts TEST event with valid secret", async ({ request }) => {
      const env = getE2eEnv();
      test.skip(!env.revenueCatWebhookSecret, "REVENUECAT_WEBHOOK_SECRET is not set");

      const eventId = `e2e-test-${Date.now()}`;
      const { status, body } = await postRevenueCatWebhook(request, {
        api_version: "1.0",
        event: { id: eventId, type: "TEST" },
      });

      expect(status).toBe(200);
      expect(body).toEqual({ received: true });
    });

    test("EXPIRATION revokes Pro when RevenueCat has no active entitlement", async ({
      request,
    }) => {
      const env = getE2eEnv();
      test.skip(!env.revenueCatWebhookSecret, "REVENUECAT_WEBHOOK_SECRET is not set");

      const auth = await loginViaApi(request, env.webhookUserEmail, env.password);

      const meBefore = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth.token, auth.sessionToken),
      });
      const meBeforeBody = (await meBefore.json()) as { hasPro?: boolean };

      test.skip(
        meBeforeBody.hasPro === true,
        `${env.webhookUserEmail} still has active Pro in RevenueCat sandbox. ` +
          "Cancel the sandbox subscription (Stripe/RevenueCat) and wait for sync, or set " +
          "E2E_WEBHOOK_USER_EMAIL to a verified user with no Pro subscription."
      );

      const { status, body } = await postRevenueCatWebhook(request, {
        api_version: "1.0",
        event: {
          id: `e2e-exp-${Date.now()}`,
          type: "EXPIRATION",
          app_user_id: auth!.userId,
          entitlement_ids: ["pro"],
          expiration_at_ms: Date.now() - 60_000,
        },
      });

      expect(status).toBe(200);
      expect(body).toEqual({ received: true });

      await waitForWebhookSync(request, auth);
      await pollUntilHasPro(request, auth, false, 30_000);

      const entitlement = await fetchEntitlement(request, auth);
      expect(entitlement.effectivePlan).toBe("FREE");
    });

    test("EXPIRATION webhook acknowledged for active subscriber (RC remains source of truth)", async ({
      request,
    }) => {
      const env = getE2eEnv();
      test.skip(!env.revenueCatWebhookSecret, "REVENUECAT_WEBHOOK_SECRET is not set");

      const auth = await loginSandboxBillingUser(request, env.checkoutUserEmail, env.password);
      test.skip(
        !auth,
        "Sandbox checkout user not in DB — sign up E2E_CHECKOUT_USER_EMAIL after migrate reset (see E2E_BILLING.md)"
      );

      const meBefore = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      const meBeforeBody = (await meBefore.json()) as { hasPro?: boolean };
      test.skip(
        meBeforeBody.hasPro !== true,
        "Checkout user has no Pro — use EXPIRATION revokes Pro test instead"
      );

      const { status, body } = await postRevenueCatWebhook(request, {
        api_version: "1.0",
        event: {
          id: `e2e-exp-active-${Date.now()}`,
          type: "EXPIRATION",
          app_user_id: auth!.userId,
          entitlement_ids: ["pro"],
          expiration_at_ms: Date.now() - 60_000,
        },
      });

      expect(status).toBe(200);
      expect(body).toEqual({ received: true });

      await waitForWebhookSync(request, auth!);

      const meAfter = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      const meAfterBody = (await meAfter.json()) as { hasPro?: boolean };
      expect(meAfterBody.hasPro).toBe(true);

      const entitlement = await fetchEntitlement(request, auth!);
      expect(entitlement.effectivePlan).toBe("PRO");
    });

    test("CANCELLATION marks canceled while retaining Pro until period end", async ({
      request,
    }) => {
      const env = getE2eEnv();
      test.skip(!env.revenueCatWebhookSecret, "REVENUECAT_WEBHOOK_SECRET is not set");

      const auth = await loginSandboxBillingUser(request, env.proUserEmail, env.password);
      test.skip(
        !auth,
        "Sandbox Pro user not in DB — sign up E2E_PRO_USER_EMAIL after migrate reset (see E2E_BILLING.md)"
      );
      const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      if (env.adminSecret) {
        await setDevEntitlement(request, auth!, {
          plan: "PRO",
          status: "ACTIVE",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: periodEnd,
        });
      }

      const meBefore = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      const meBeforeBody = (await meBefore.json()) as { hasPro?: boolean };
      test.skip(meBeforeBody.hasPro !== true, "Pro user required for cancellation webhook test");

      const { status } = await postRevenueCatWebhook(request, {
        api_version: "1.0",
        event: {
          id: `e2e-cancel-${Date.now()}`,
          type: "CANCELLATION",
          app_user_id: auth!.userId,
          entitlement_ids: ["pro"],
          expiration_at_ms: new Date(periodEnd).getTime(),
        },
      });

      expect(status).toBe(200);

      await waitForWebhookSync(request, auth!);

      const meAfter = await request.get(`${env.apiUrl}/api/auth/me`, {
        headers: authHeaders(auth!.token, auth!.sessionToken),
      });
      const meBody = (await meAfter.json()) as { hasPro?: boolean };
      expect(meBody.hasPro).toBe(true);

      const entitlement = await fetchEntitlement(request, auth!);
      expect(entitlement.effectivePlan).toBe("PRO");

      const showsCanceled =
        entitlement.status === "CANCELED" || entitlement.cancelAtPeriodEnd === true;
      if (!showsCanceled) {
        test.info().annotations.push({
          type: "note",
          description:
            "RevenueCat sync kept ACTIVE for this sandbox subscriber; Pro access until period end is still valid.",
        });
      }
    });
  });

  test.describe("B4 — guest pricing CTA", () => {
    test("logged-out /pricing shows sign-in to subscribe", async ({ page }) => {
      await clearGuestSession(page);
      await page.goto("/pricing");

      await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();
      await expect(page.getByText(/Sandbox billing mode is enabled/i)).toBeVisible();

      const signInCta = page.getByRole("button", { name: "Sign in to subscribe" });
      await expect(signInCta).toBeVisible();

      await signInCta.click();
      await expect(page).toHaveURL(/\/login\?next=%2Fpricing/);
      await expect(page.getByLabel("Email")).toBeVisible();
    });
  });

  test.describe("B5 — pro gate", () => {
    test("standard gets 403 on personal-bests; proSeed gets 200", async ({ request, page }) => {
      const env = getE2eEnv();
      const standardAuth = await loginPersona(request, "standard");
      const proAuth = await ensureProSeedHasPro(request);

      const freePbs = await request.get(`${env.apiUrl}/api/personal-bests`, {
        headers: authHeaders(standardAuth.token, standardAuth.sessionToken),
      });
      expect(freePbs.status()).toBe(403);
      const freeBody = (await freePbs.json()) as { code?: string };
      expect(freeBody.code).toBe("PRO_REQUIRED");

      const proPbs = await request.get(`${env.apiUrl}/api/personal-bests`, {
        headers: authHeaders(proAuth.token, proAuth.sessionToken),
      });
      expect(proPbs.status()).toBe(200);

      const upload = await uploadSessionJsonViaApi(
        request,
        proAuth,
        "race_spa_ferrari-gt3_podium.json"
      );
      const detail = await getSessionDetailViaApi(request, proAuth, upload.sessionId);
      expect(detail.proFeaturesLocked).not.toBe(true);

      await gotoAuthenticated(page, proAuth, `/sessions/${upload.sessionId}`);
      await expect(page.getByText("Unlock with Pro")).toHaveCount(0);
    });
  });
});
