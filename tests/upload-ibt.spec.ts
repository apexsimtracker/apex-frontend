/**
 * @upload-ibt — Manual .ibt upload E2E (Pro happy path + Free block).
 *
 * Sessions created here are intentionally kept in the DB for visual QA.
 * Clean later with: `cd apex && npm run reset:e2e`
 *
 * Requires a real IBT binary at tests/fixtures/ibt/practice_road-atlanta_bmw-m-lmdh.ibt
 * (symlink into ibt-files/). Suite skips if missing.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { authHeaders, gotoAuthenticated, type AuthSession } from "./helpers/auth";
import { ensureProSeedHasPro } from "./helpers/billing";
import { getE2eEnv } from "./helpers/env";
import {
  IBT_PRACTICE_BMW_FIXTURE,
  ibtFixture,
  ibtFixtureExists,
} from "./helpers/fixtures";
import { loginPersona } from "./helpers/personas";
import {
  clearUploadRateLimitViaApi,
  getSessionDetailViaApi,
} from "./helpers/sessions";

const IBT_PATH = ibtFixture(IBT_PRACTICE_BMW_FIXTURE);
const HAS_IBT = ibtFixtureExists();

test.describe("@upload-ibt", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(() => {
    test.skip(!HAS_IBT, `IBT fixture missing: ${IBT_PATH}`);
  });

  test("I1 — Free user is blocked from .ibt upload (UI + API)", async ({
    page,
    request,
  }) => {
    const freeAuth = await loginPersona(request, "standard");
    await clearUploadRateLimitViaApi(request, freeAuth).catch(() => undefined);

    await gotoAuthenticated(page, freeAuth, "/upload");

    await expect(
      page.getByText(/Manual \.ibt upload is an Apex Pro feature/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /Upgrade to Pro/i }),
    ).toBeVisible();

    // Client-side: selecting a file then uploading should surface Pro error
    await page.locator('input[type="file"][accept=".ibt"]').setInputFiles(IBT_PATH);
    await expect(page.getByText(/practice_road-atlanta|bmw|\.ibt/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole("button", { name: "Upload session" }).click();
    await expect(
      page.getByText(/Apex Pro is required to upload/i),
    ).toBeVisible({ timeout: 15_000 });

    // API: free multipart must 403 PRO_REQUIRED
    const { apiUrl } = getE2eEnv();
    const bytes = readFileSync(IBT_PATH);
    const res = await request.post(`${apiUrl}/api/sessions/manual-upload`, {
      headers: {
        Authorization: `Bearer ${freeAuth.token}`,
        "X-Apex-Session": freeAuth.sessionToken,
      },
      multipart: {
        file: {
          name: IBT_PRACTICE_BMW_FIXTURE,
          mimeType: "application/octet-stream",
          buffer: bytes,
        },
      },
      timeout: 120_000,
    });
    expect(res.status()).toBe(403);
    const body = (await res.json()) as { code?: string };
    expect(body.code).toBe("PRO_REQUIRED");
  });

  test("I2 — Pro upload → session detail sectors + telemetry charts", async ({
    page,
    request,
  }) => {
    const auth = await ensureProSeedHasPro(request);
    await clearUploadRateLimitViaApi(request, auth).catch(() => undefined);

    await gotoAuthenticated(page, auth, "/upload");
    await expect(
      page.getByRole("heading", { name: /Upload session/i }),
    ).toBeVisible({ timeout: 15_000 });

    // Pro should not see the free-tier upgrade banner
    await expect(
      page.getByText(/Manual \.ibt upload is an Apex Pro feature/i),
    ).toHaveCount(0);

    await page.locator('input[type="file"][accept=".ibt"]').setInputFiles(IBT_PATH);
    await page.getByRole("button", { name: "Upload session" }).click();

    // Wait for processing + redirect (parse can take a while)
    await expect(page).toHaveURL(/\/sessions\/[a-zA-Z0-9_-]+/, {
      timeout: 180_000,
    });

    const appUrl = page.url();
    const sessionId = appUrl.match(/\/sessions\/([^/?#]+)/)?.[1];
    expect(sessionId).toBeTruthy();

    // --- Session detail (real telemetry data, no dummy laps) ---
    await expect(
      page.getByRole("heading", { name: /Lap history/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("No laps recorded yet.")).toHaveCount(0);
    await expect(page.getByText("Red Bull RB20")).toHaveCount(0);
    await expect(page.getByText("1:08.635")).toHaveCount(0);
    await expect(page.getByTestId(/lap-row-/).first()).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("session-telemetry")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("Telemetry Analysis").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Driving$/i })).toBeVisible({
      timeout: 30_000,
    });

    const lapRow = page.getByTestId(/lap-row-/).nth(1);
    if (await lapRow.count()) {
      await lapRow.click();
      const lapNum = (await lapRow.getAttribute("data-testid"))?.replace(
        "lap-row-",
        "",
      );
      if (lapNum) {
        await expect(page.getByTestId("telemetry-lap-picker")).toContainText(
          `Lap ${lapNum}`,
          { timeout: 15_000 },
        );
      }
    }

    // Leave session in DB — navigate to v1 detail for real sector/chart UI
    await page.goto(`/sessions/${sessionId}`);
    await expect(page.getByText(/Road Atlanta|Session best|Ideal Lap/i).first()).toBeVisible({
      timeout: 60_000,
    });

    // --- API cross-check (sectors + telemetry eligibility) ---
    const detail = await getSessionDetailViaApi(request, auth, sessionId!);
    expect((detail.lapCount ?? 0) > 0).toBe(true);
    expect(detail.proFeaturesLocked).not.toBe(true);
    // Manual IBT must use upload-time createdAt (not buried under sim sessionStart)
    expect(detail.createdAt).toBeTruthy();
    const createdAtMs = Date.parse(detail.createdAt!);
    expect(Number.isFinite(createdAtMs)).toBe(true);
    expect(Math.abs(Date.now() - createdAtMs)).toBeLessThan(15 * 60 * 1000);

    const laps = await fetchSessionLaps(request, auth, sessionId!);
    const realSectors = laps.filter(
      (l) =>
        l.sector1Ms != null &&
        l.sector2Ms != null &&
        l.sector3Ms != null &&
        Math.abs(l.sector1Ms - l.sector2Ms) > 2 &&
        l.sectorsEstimated !== true,
    );
    expect(realSectors.length).toBeGreaterThan(0);

    const telemetrySummary = await fetchTelemetrySummary(request, auth, sessionId!);
    expect(telemetrySummary.eligible).toBe(true);
    const traced = telemetrySummary.laps?.filter((l) => l.hasTraces) ?? [];
    expect(traced.length).toBeGreaterThan(0);

    const lapNum = traced[0]!.lapNumber;
    const traces = await fetchTelemetryTraces(request, auth, sessionId!, lapNum);
    expect(traces.speedKmh.length).toBeGreaterThan(1);
    const speedMin = Math.min(...traces.speedKmh);
    const speedMax = Math.max(...traces.speedKmh);
    expect(speedMax - speedMin).toBeGreaterThan(1);

    // --- UI: sectors (Pro legend / formatted times) ---
    await expect(page.getByText("Session best")).toBeVisible();
    // At least one sector cell should show a formatted time (contains ':' or '.')
    const sectorCells = page.locator("td, th").filter({ hasText: /\d+:\d+\.\d+/ });
    await expect(sectorCells.first()).toBeVisible({ timeout: 30_000 });

    // Highlight colors when Pro: purple for session best
    const purpleBest = page.locator(".text-purple-400");
    await expect(purpleBest.first()).toBeVisible({ timeout: 15_000 });

    // --- UI: telemetry charts (not agent-only empty state) ---
    await expect(
      page.getByText(/Upload with the Apex Agent for full telemetry analysis/i),
    ).toHaveCount(0);

    await expect(page.getByText("Telemetry Analysis").first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("button", { name: /^Driving$/i })).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("telemetry-driving-chart")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByTestId("telemetry-driving-chart").locator("svg").first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});

type ApiLap = {
  lap?: number;
  sector1Ms?: number | null;
  sector2Ms?: number | null;
  sector3Ms?: number | null;
  sectorsEstimated?: boolean;
};

async function fetchSessionLaps(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
): Promise<ApiLap[]> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/sessions/${encodeURIComponent(sessionId)}`,
    { headers: authHeaders(auth.token, auth.sessionToken) },
  );
  expect(res.ok()).toBe(true);
  const raw = (await res.json()) as {
    laps?: ApiLap[];
    session?: { laps?: ApiLap[] };
  };
  return raw.laps ?? raw.session?.laps ?? [];
}

async function fetchTelemetrySummary(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
): Promise<{
  eligible: boolean;
  laps?: { lapNumber: number; hasTraces: boolean }[];
}> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/sessions/${encodeURIComponent(sessionId)}/telemetry?view=summary`,
    { headers: authHeaders(auth.token, auth.sessionToken) },
  );
  expect(res.ok()).toBe(true);
  return (await res.json()) as {
    eligible: boolean;
    laps?: { lapNumber: number; hasTraces: boolean }[];
  };
}

async function fetchTelemetryTraces(
  request: APIRequestContext,
  auth: AuthSession,
  sessionId: string,
  lapNumber: number,
): Promise<{ speedKmh: number[] }> {
  const { apiUrl } = getE2eEnv();
  const res = await request.get(
    `${apiUrl}/api/sessions/${encodeURIComponent(sessionId)}/telemetry?lap=${lapNumber}`,
    { headers: authHeaders(auth.token, auth.sessionToken) },
  );
  expect(res.ok()).toBe(true);
  return (await res.json()) as { speedKmh: number[] };
}
