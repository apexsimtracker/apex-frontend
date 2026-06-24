import { expect, test, type Page } from "@playwright/test";
import {
  authHeaders,
  clearGuestSession,
  gotoAuthenticated,
  loginViaUi,
  logoutViaApi,
} from "./helpers/auth";
import {
  assignKnownPasswordResetCode,
  assignKnownVerificationCode,
  knownPasswordResetCode,
  unverifiedPersonaCredentials,
} from "./helpers/email-bypass";
import { getE2eEnv } from "./helpers/env";
import { loginPersona } from "./helpers/personas";

function isEmailDeliveryConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

async function expectGuestRedirectToLogin(page: Page, path: string): Promise<void> {
  await clearGuestSession(page);
  await page.goto(path);
  await expect(page).toHaveURL(/\/login$/);
}

test.describe("@auth", () => {
  test.describe.configure({ mode: "serial" });

  test("A1 — guest redirect to protected route", async ({ page }) => {
    await expectGuestRedirectToLogin(page, "/profile");
    await expect(
      page.getByText(/Sign in to view your profile and stats/i)
    ).toBeVisible();
  });

  test("A2 — API login + session bootstrap", async ({ request }) => {
    const env = getE2eEnv();
    const auth = await loginPersona(request, "standard");

    const meRes = await request.get(`${env.apiUrl}/api/auth/me`, {
      headers: authHeaders(auth.token, auth.sessionToken),
    });
    expect(meRes.ok()).toBeTruthy();

    const me = (await meRes.json()) as {
      id?: string;
      hasPro?: boolean;
      effectivePlan?: string;
    };
    expect(me.id).toBe(auth.userId);
    expect(typeof me.hasPro).toBe("boolean");
  });

  test("A3 — UI login with return path", async ({ page, request }) => {
    const env = getE2eEnv();
    const email = env.personas.standard;

    await loginViaUi(page, email, env.password, "/pricing");
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole("heading", { name: "Choose your plan" })).toBeVisible();

    const token = await page.evaluate(() => localStorage.getItem("apex_token"));
    const sessionToken = await page.evaluate(() =>
      localStorage.getItem("apex_session_token")
    );
    expect(token?.trim()).toBeTruthy();
    expect(sessionToken?.trim()).toBeTruthy();

    await logoutViaApi(request, {
      token: token!,
      sessionToken: sessionToken!,
      userId: "",
    });
  });

  test("A4 — signup requires email verification", async ({ page }) => {
    test.skip(
      !isEmailDeliveryConfigured(),
      "RESEND_API_KEY must be set on the backend for signup verification email"
    );

    const env = getE2eEnv();
    const uniqueEmail = `e2e-signup-${Date.now()}@example.com`;

    await clearGuestSession(page);
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: "Create account" })).toBeVisible();

    await page.getByLabel("Name (optional)").fill("E2E Signup");
    await page.getByLabel("Email").fill(uniqueEmail);
    await page.getByLabel("Password").fill(env.password);

    const registerPost = page.waitForResponse(
      (res) => res.url().includes("/api/auth/register") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Sign up" }).click();

    const response = await registerPost;
    expect(response.ok()).toBeTruthy();
    const body = (await response.json()) as { verificationRequired?: boolean };
    expect(body.verificationRequired).toBe(true);

    await expect(page).toHaveURL(/\/verify-email$/);
    await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
    await expect(page.getByText(uniqueEmail)).toBeVisible();
  });

  test.describe("A5 — verify email", () => {
    test.beforeAll(() => {
      const { email } = unverifiedPersonaCredentials();
      assignKnownVerificationCode(email);
    });

    test("completes auth", async ({ page }) => {
      const { email, code } = unverifiedPersonaCredentials();

      await clearGuestSession(page);
      await page.goto("/verify-email");
      await page.evaluate((pendingEmail) => {
        sessionStorage.setItem("apex_verify_email", pendingEmail);
      }, email);
      await page.reload();

      await expect(page.getByRole("heading", { name: "Verify your email" })).toBeVisible();
      await page.getByLabel("Verification code").fill(code);

      const verifyPost = page.waitForResponse(
        (res) =>
          res.url().includes("/api/auth/verify-email") && res.request().method() === "POST"
      );
      await page.getByRole("button", { name: "Verify" }).click();

      const response = await verifyPost;
      if (!response.ok()) {
        const body = await response.text();
        expect(
          response.ok(),
          `verify-email failed (${response.status()}): ${body}`
        ).toBeTruthy();
      }

      await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });

      const token = await page.evaluate(() => localStorage.getItem("apex_token"));
      const sessionToken = await page.evaluate(() =>
        localStorage.getItem("apex_session_token")
      );
      expect(token?.trim()).toBeTruthy();
      expect(sessionToken?.trim()).toBeTruthy();
    });

    test.afterAll(() => {
      const { email } = unverifiedPersonaCredentials();
      assignKnownVerificationCode(email);
    });
  });

  test("A7 — logout clears session", async ({ page, request }) => {
    const auth = await loginPersona(request, "standard");

    await gotoAuthenticated(page, auth, "/settings");
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const logoutReq = page.waitForRequest(
      (req) => req.url().includes("/api/auth/logout") && req.method() === "POST"
    );
    await page.getByRole("button", { name: "Log out" }).click();
    await logoutReq;

    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("A6 — forgot-password wizard", async ({ page, request }) => {
    test.skip(
      !isEmailDeliveryConfigured(),
      "RESEND_API_KEY must be set on the backend for forgot-password email delivery"
    );

    const env = getE2eEnv();
    const email = env.personas.standard;
    const resetCode = knownPasswordResetCode();
    const rotatedPassword = `${env.password}Rotated`;

    await clearGuestSession(page);
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: "Forgot password" })).toBeVisible();

    await page.getByLabel("Email").fill(email);
    const forgotPost = page.waitForResponse(
      (res) => res.url().includes("/api/auth/forgot-password") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Send code" }).click();
    const forgotRes = await forgotPost;
    expect(forgotRes.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Check your email" })).toBeVisible();

    assignKnownPasswordResetCode(email, resetCode);

    await page.getByLabel("Verification code").fill(resetCode);
    const verifyPost = page.waitForResponse(
      (res) =>
        res.url().includes("/api/auth/verify-reset-code") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Verify code" }).click();
    const verifyRes = await verifyPost;
    expect(verifyRes.ok()).toBeTruthy();

    await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
    await page.getByLabel("New password").fill(rotatedPassword);
    await page.getByLabel("Confirm password").fill(rotatedPassword);

    const resetPost = page.waitForResponse(
      (res) => res.url().includes("/api/auth/reset-password") && res.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Reset password" }).click();
    const resetRes = await resetPost;
    expect(resetRes.ok()).toBeTruthy();

    await expect(
      page.getByText(/Your password has been updated/i)
    ).toBeVisible();
    await page.getByRole("button", { name: "Back to sign in" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await loginViaUi(page, email, rotatedPassword, "/profile");
    await expect(page).toHaveURL(/\/profile/, { timeout: 30_000 });

    assignKnownPasswordResetCode(email, resetCode);
    const restoreRes = await request.post(`${env.apiUrl}/api/auth/reset-password`, {
      data: { email, code: resetCode, password: env.password },
    });
    expect(restoreRes.ok()).toBeTruthy();
  });

  test("A8 — suspended account login blocked", async ({ page }) => {
    const env = getE2eEnv();

    await clearGuestSession(page);
    await page.goto("/login");
    await page.getByLabel("Email").fill(env.personas.suspended);
    await page.getByLabel("Password").fill(env.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("alert").getByText(/Your account has been suspended from this platform/i)
    ).toBeVisible();
    await expect(page.getByText(/E2E seed — suspended persona/i)).toBeVisible();
  });
});
