import { expect, test, type APIRequestContext } from "@playwright/test";
import { authHeaders, gotoAuthenticated, type AuthSession } from "./helpers/auth";
import { getE2eEnv } from "./helpers/env";
import { ensureProSeedHasPro } from "./helpers/billing";
import { loginPersona } from "./helpers/personas";

type AgentOs = "macos" | "windows" | "linux";

const AGENT_DOWNLOAD_FILENAMES: Record<AgentOs, string> = {
  macos: "ApexAgent-mac.dmg",
  windows: "ApexAgent-windows.exe",
  linux: "ApexAgent-linux.AppImage",
};

const E2E_AGENT_OS: AgentOs = "macos";

async function fetchAgentDownloadLink(
  request: APIRequestContext,
  auth: AuthSession,
  os: AgentOs = E2E_AGENT_OS
) {
  const { apiUrl } = getE2eEnv();
  return request.get(`${apiUrl}/api/agent/download-link?os=${encodeURIComponent(os)}`, {
    headers: authHeaders(auth.token, auth.sessionToken),
  });
}

function skipIfAgentDownloadUnavailable(status: number, body: { code?: string; message?: string }) {
  if (status === 503) {
    test.skip(
      true,
      `Agent download unavailable (${body.code ?? status}): ${
        body.message ?? "Configure R2 agent keys or AGENT_DOWNLOAD_PATH_* for local dev"
      }`
    );
  }
}

test.describe("@agent-web", () => {
  test.describe.configure({ mode: "serial" });

  test.describe("H1 — free lock on /agent", () => {
    test("standard user sees Pro lock and upgrade CTA", async ({ page, request }) => {
      const auth = await loginPersona(request, "standard");
      await gotoAuthenticated(page, auth, "/agent");

      await expect(page.getByRole("heading", { name: "Apex Agent" })).toBeVisible();
      await expect(
        page.getByText("Apex Pro required for automatic telemetry uploads and agent download.")
      ).toBeVisible();

      const lockButton = page.getByRole("button", { name: /^Download for / });
      await expect(lockButton).toBeVisible();

      await lockButton.click();
      await expect(page.getByRole("heading", { name: "Apex Pro Required" })).toBeVisible();
      await expect(page.getByRole("button", { name: "Upgrade to Pro" })).toBeVisible();

      await page.getByRole("button", { name: "Upgrade to Pro" }).click();
      await expect(page).toHaveURL(/\/pricing$/);
    });

    test("standard user gets 403 on GET /api/agent/download-link", async ({ request }) => {
      const auth = await loginPersona(request, "standard");
      const res = await fetchAgentDownloadLink(request, auth);

      expect(res.status()).toBe(403);
      const body = (await res.json()) as { code?: string };
      expect(body.code).toBe("PRO_REQUIRED");
    });
  });

  test.describe("H2 — Pro download", () => {
    test("proSeed receives download link from GET /api/agent/download-link", async ({ request }) => {
      const auth = await ensureProSeedHasPro(request);

      const meRes = await request.get(`${getE2eEnv().apiUrl}/api/auth/me`, {
        headers: authHeaders(auth.token, auth.sessionToken),
      });
      expect(meRes.ok()).toBeTruthy();
      const me = (await meRes.json()) as { hasPro?: boolean };
      expect(me.hasPro).toBe(true);

      const res = await fetchAgentDownloadLink(request, auth);
      const contentType = res.headers()["content-type"] ?? "";

      if (!res.ok()) {
        skipIfAgentDownloadUnavailable(res.status(), (await res.json()) as { code?: string; message?: string });
      }

      expect(res.status()).toBe(200);

      if (contentType.includes("json")) {
        const body = (await res.json()) as {
          url?: string;
          expiresAt?: string;
          filename?: string;
          os?: string;
        };
        expect(body.url).toMatch(/^https?:\/\//);
        expect(body.expiresAt).toBeTruthy();
        expect(body.filename).toBe(AGENT_DOWNLOAD_FILENAMES[E2E_AGENT_OS]);
        expect(body.os).toBe(E2E_AGENT_OS);
        return;
      }

      expect(contentType).toMatch(/octet-stream/);
      const bytes = await res.body();
      expect(bytes.byteLength).toBeGreaterThan(0);
    });

    test("proSeed starts download from /agent UI", async ({ page, request }) => {
      const auth = await ensureProSeedHasPro(request);

      const preflight = await fetchAgentDownloadLink(request, auth);
      if (!preflight.ok()) {
        skipIfAgentDownloadUnavailable(
          preflight.status(),
          (await preflight.json()) as { code?: string; message?: string }
        );
      }

      await gotoAuthenticated(page, auth, "/agent");
      await page
        .getByRole("group", { name: "Download platform" })
        .getByRole("button", { name: "macOS" })
        .click();

      const downloadButton = page.getByRole("button", {
        name: new RegExp(`Download ${AGENT_DOWNLOAD_FILENAMES[E2E_AGENT_OS].replace(".", "\\.")}`),
      });
      await expect(downloadButton).toBeVisible();

      const downloadResponse = page.waitForResponse(
        (res) =>
          res.url().includes("/api/agent/download-link") && res.request().method() === "GET"
      );

      await downloadButton.click();
      const res = await downloadResponse;
      expect(res.ok()).toBeTruthy();

      const contentType = res.headers()["content-type"] ?? "";
      if (contentType.includes("json")) {
        const body = (await res.json()) as { url?: string; filename?: string };
        expect(body.url).toMatch(/^https?:\/\//);
        expect(body.filename).toBe(AGENT_DOWNLOAD_FILENAMES[E2E_AGENT_OS]);
        return;
      }

      expect(contentType).toMatch(/octet-stream/);
      const bytes = await res.body();
      expect(bytes.byteLength).toBeGreaterThan(0);
    });
  });
});
