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
  password: string,
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

export function authHeaders(
  token: string,
  sessionToken: string,
): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    "X-Apex-Session": sessionToken,
    "Content-Type": "application/json",
  };
}

export async function applyAuthToPage(
  page: Page,
  auth: AuthSession,
): Promise<void> {
  await page.addInitScript(
    ({ token, session }) => {
      localStorage.setItem("apex_token", token);
      localStorage.setItem("apex_session_token", session);
    },
    { token: auth.token, session: auth.sessionToken },
  );
}

export async function gotoAuthenticated(
  page: Page,
  auth: AuthSession,
  path: string,
): Promise<void> {
  await applyAuthToPage(page, auth);
  await page.goto(path);
  await page.evaluate(() => window.dispatchEvent(new Event("apex:auth")));
}

function matchesReturnPath(url: URL, returnTo: string): boolean {
  const expected = new URL(returnTo, url.origin);
  return (
    url.pathname === expected.pathname &&
    url.search === expected.search &&
    url.hash === expected.hash
  );
}

export async function loginViaUi(
  page: Page,
  email: string,
  password: string,
  returnTo = "/pricing",
): Promise<void> {
  const next = encodeURIComponent(returnTo);
  await page.goto(`/login?next=${next}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((url) => matchesReturnPath(url, returnTo), {
    timeout: 30_000,
  });
}

export async function logoutViaApi(
  request: APIRequestContext,
  auth: AuthSession,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/auth/logout`, {
    headers: {
      Authorization: `Bearer ${auth.token}`,
      "X-Apex-Session": auth.sessionToken,
    },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Logout failed (${res.status()}): ${body}`);
  }
}

export async function clearGuestSession(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.removeItem("apex_token");
    localStorage.removeItem("apex_session_token");
    sessionStorage.removeItem("apex_verify_email");
  });
}
