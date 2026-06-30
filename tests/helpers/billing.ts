import { expect, type APIRequestContext, type Page } from "@playwright/test";
import { authHeaders, type AuthSession } from "./auth";
import { getE2eEnv } from "./env";
import { loginPersona } from "./personas";

export type RevenueCatWebhookPayload = {
  api_version?: string;
  event: {
    id: string;
    type: string;
    app_user_id?: string;
    original_app_user_id?: string | null;
    aliases?: string[] | null;
    entitlement_ids?: string[] | null;
    expiration_at_ms?: number | null;
    purchased_at_ms?: number | null;
    environment?: string | null;
  };
};

export async function waitForOfferingsReady(page: Page): Promise<void> {
  const subscribe = page.getByTestId("billing-subscribe-pro");
  await expect(subscribe).toBeVisible({ timeout: 30_000 });
  await expect(subscribe).toBeEnabled({ timeout: 30_000 });
}

export async function selectMonthlyInterval(page: Page): Promise<void> {
  await page.getByTestId("billing-interval-monthly").click();
}

export async function postRevenueCatWebhook(
  request: APIRequestContext,
  payload: RevenueCatWebhookPayload,
  options?: { secret?: string | null },
): Promise<{ status: number; body: unknown }> {
  const { apiUrl } = getE2eEnv();
  const secret =
    options && "secret" in options
      ? options.secret
      : getE2eEnv().revenueCatWebhookSecret;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (secret) {
    headers.Authorization = secret;
  }

  const res = await request.post(`${apiUrl}/webhooks/revenuecat`, {
    headers,
    data: payload,
  });

  let body: unknown = null;
  const contentType = res.headers()["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  return { status: res.status(), body };
}

export async function refreshBillingSubscription(
  request: APIRequestContext,
  auth: AuthSession,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const res = await request.post(`${apiUrl}/api/billing/refresh`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });
  if (!res.ok() && res.status() !== 503) {
    const text = await res.text();
    throw new Error(
      `POST /api/billing/refresh failed (${res.status()}): ${text}`,
    );
  }
}

/** Wait for async webhook handler (setImmediate) then nudge RC sync. */
export async function waitForWebhookSync(
  request: APIRequestContext,
  auth: AuthSession,
): Promise<void> {
  await new Promise((r) => setTimeout(r, 1_500));
  await refreshBillingSubscription(request, auth).catch(() => undefined);
  await new Promise((r) => setTimeout(r, 500));
}

export async function pollUntilHasPro(
  request: APIRequestContext,
  auth: AuthSession,
  expected: boolean,
  timeoutMs = 30_000,
): Promise<void> {
  const { apiUrl } = getE2eEnv();
  const headers = authHeaders(auth.token, auth.sessionToken);
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await request.get(`${apiUrl}/api/auth/me`, { headers });
    if (res.ok()) {
      const me = (await res.json()) as { hasPro?: boolean };
      if (me.hasPro === expected) {
        return;
      }
    }
    await new Promise((r) => setTimeout(r, 500));
  }

  throw new Error(`Timed out waiting for hasPro === ${String(expected)}`);
}

export async function fetchEntitlement(
  request: APIRequestContext,
  auth: AuthSession,
): Promise<{
  effectivePlan?: string;
  status?: string;
  cancelAtPeriodEnd?: boolean;
}> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(`${apiUrl}/api/auth/me`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });
  if (!res.ok()) {
    throw new Error(`GET /api/auth/me failed (${res.status()})`);
  }
  const me = (await res.json()) as {
    effectivePlan?: string;
    subscriptionStatus?: string;
    cancelAtPeriodEnd?: boolean;
  };
  return {
    effectivePlan: me.effectivePlan,
    status: me.subscriptionStatus,
    cancelAtPeriodEnd: me.cancelAtPeriodEnd,
  };
}

/** Restore seeded Pro on e2e-pro@example.com after admin RC sync or webhook side effects. */
export async function ensureProSeedHasPro(
  request: APIRequestContext,
): Promise<AuthSession> {
  const auth = await loginPersona(request, "proSeed");
  const { apiUrl, adminSecret } = getE2eEnv();
  const headers = authHeaders(auth.token, auth.sessionToken);

  const meRes = await request.get(`${apiUrl}/api/auth/me`, { headers });
  if (meRes.ok()) {
    const me = (await meRes.json()) as { hasPro?: boolean };
    if (me.hasPro === true) {
      return auth;
    }
  }

  if (!adminSecret) {
    throw new Error(
      "proSeed lost Pro entitlement. Re-run `cd apex && E2E_SEED_PASSWORD=... npm run seed:e2e` " +
        "or set ADMIN_SECRET so tests can restore via /api/billing/dev/set-entitlement.",
    );
  }

  const periodEnd = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000,
  ).toISOString();
  await setDevEntitlement(request, auth, {
    plan: "PRO",
    status: "ACTIVE",
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: periodEnd,
  });
  await pollUntilHasPro(request, auth, true);
  return auth;
}

export async function setDevEntitlement(
  request: APIRequestContext,
  auth: AuthSession,
  body: {
    plan: "FREE" | "PRO";
    status?: "ACTIVE" | "PAST_DUE" | "CANCELED" | "EXPIRED";
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  },
): Promise<void> {
  const { apiUrl, adminSecret } = getE2eEnv();
  const headers = authHeaders(auth.token, auth.sessionToken);
  if (adminSecret) {
    headers["x-admin-secret"] = adminSecret;
  }

  const res = await request.post(`${apiUrl}/api/billing/dev/set-entitlement`, {
    headers,
    data: body,
  });

  if (!res.ok()) {
    const text = await res.text();
    throw new Error(`dev/set-entitlement failed (${res.status()}): ${text}`);
  }
}
