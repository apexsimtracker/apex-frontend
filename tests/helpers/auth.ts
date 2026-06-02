import type { APIRequestContext, Page } from "@playwright/test";
import { getE2eEnv } from "./env";

export type AuthSession = {
  token: string;
  sessionToken: string;
  userId: string;
};

type LoginResponse = {
  token?: string;
  accessToken?: string;
  sessionToken?: string;
};

type MeResponse = {
  id?: string;
  hasPro?: boolean;
  effectivePlan?: string;
};

export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<AuthSession> {
  const { apiUrl } = getE2eEnv();

  const loginRes = await request.post(`${apiUrl}/api/auth/login`, {
    data: { email, password },
  });

  if (!loginRes.ok()) {
    const body = await loginRes.text();
    throw new Error(`Login failed (${loginRes.status()}): ${body}`);
  }

  const data = (await loginRes.json()) as LoginResponse;
  const token = (data.accessToken ?? data.token)?.trim();
  const sessionToken = data.sessionToken?.trim();

  if (!token || !sessionToken) {
    throw new Error("Login response missing token or sessionToken");
  }

  const meRes = await request.get(`${apiUrl}/api/auth/me`, {
    headers: authHeaders(token, sessionToken),
  });

  if (!meRes.ok()) {
    throw new Error(`GET /api/auth/me failed (${meRes.status()})`);
  }

  const me = (await meRes.json()) as MeResponse;
  if (!me.id?.trim()) {
    throw new Error("GET /api/auth/me missing user id");
  }

  return { token, sessionToken, userId: me.id.trim() };
}

export function authHeaders(token: string, sessionToken: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "X-Apex-Session": sessionToken,
    "Content-Type": "application/json",
  };
}

export async function applyAuthToPage(page: Page, auth: AuthSession): Promise<void> {
  await page.addInitScript(
    ({ token, session }) => {
      localStorage.setItem("apex_token", token);
      localStorage.setItem("apex_session_token", session);
    },
    { token: auth.token, session: auth.sessionToken }
  );
}

export async function gotoAuthenticated(
  page: Page,
  auth: AuthSession,
  path: string
): Promise<void> {
  await applyAuthToPage(page, auth);
  await page.goto(path);
  await page.evaluate(() => window.dispatchEvent(new Event("apex:auth")));
}

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
  returnTo = "/pricing"
): Promise<void> {
  await page.goto("/login");
  await page.evaluate((from) => {
    window.history.replaceState({ usr: { from, message: null } }, "");
  }, returnTo);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });
}
