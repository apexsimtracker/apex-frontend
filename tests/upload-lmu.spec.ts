/**
 * @upload-lmu — Manual .duckdb (Le Mans Ultimate) upload E2E (Pro happy path + Free block).
 *
 * Created sessions are deleted via admin API in afterAll.
 *
 * Requires a real DuckDB at tests/fixtures/lmu/practice_sebring_lmu.duckdb
 * (symlink into ibt-files/). Suite skips if missing.
 */
import { expect, test, type APIRequestContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import { authHeaders, gotoAuthenticated, type AuthSession } from "./helpers/auth";
import { ensureProSeedHasPro } from "./helpers/billing";
import { getE2eEnv } from "./helpers/env";
import {
  DUCKDB_PRACTICE_SEBRING,
  duckdbFixture,
  duckdbFixtureExists,
} from "./helpers/fixtures";
import { loginPersona } from "./helpers/personas";
import { deleteSessionViaAdminApi } from "./helpers/profile";
import {
  clearUploadRateLimitViaApi,
  getSessionDetailViaApi,
} from "./helpers/sessions";

const DUCKDB_PATH = duckdbFixture(DUCKDB_PRACTICE_SEBRING);
const HAS_DUCKDB = duckdbFixtureExists();

const createdSessionIds: string[] = [];

test.describe("@upload-lmu", () => {
  test.describe.configure({ mode: "serial", timeout: 300_000 });

  test.beforeAll(() => {
    test.skip(!HAS_DUCKDB, `LMU DuckDB fixture missing: ${DUCKDB_PATH}`);
  });

  test.afterAll(async ({ request }) => {
    if (createdSessionIds.length === 0) return;
    const adminAuth = await loginPersona(request, "admin");
    for (const sessionId of createdSessionIds) {
      await deleteSessionViaAdminApi(request, adminAuth, sessionId).catch(
        () => undefined,
      );
    }
  });

  test("L1 — Free user is blocked from .duckdb upload (UI + API)", async ({
    page,
    request,
  }) => {
    const freeAuth = await loginPersona(request, "standard");
    await clearUploadRateLimitViaApi(request, freeAuth).catch(() => undefined);

    await gotoAuthenticated(page, freeAuth, "/v2/upload");

    await expect(
      page.getByText(/Manual telemetry upload is an Apex Pro feature/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByRole("button", { name: /Upgrade to Pro/i }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Le Mans Ultimate/i }).click();
    await page
      .locator('input[type="file"][accept=".duckdb"]')
      .setInputFiles(DUCKDB_PATH);
    await expect(
      page.getByText(/practice_sebring|sebring|\.duckdb/i).first(),
    ).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Upload session" }).click();
    await expect(
      page.getByText(/Apex Pro is required to upload/i),
    ).toBeVisible({ timeout: 15_000 });

    const { apiUrl } = getE2eEnv();
    const bytes = readFileSync(DUCKDB_PATH);
    const res = await request.post(`${apiUrl}/api/sessions/manual-upload`, {
      headers: {
        Authorization: `Bearer ${freeAuth.token}`,
        "X-Apex-Session": freeAuth.sessionToken,
      },
      multipart: {
        file: {
          name: DUCKDB_PRACTICE_SEBRING,
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

  test("L2 — Pro upload → processing → lmu_* session detail + charts", async ({
    page,
    request,
  }) => {
    const auth = await ensureProSeedHasPro(request);
    await clearUploadRateLimitViaApi(request, auth).catch(() => undefined);

    const pageErrors: Error[] = [];
    page.on("pageerror", (err) => pageErrors.push(err));

    await gotoAuthenticated(page, auth, "/v2/upload");
    await expect(
      page.getByRole("heading", { name: /Upload session/i }),
    ).toBeVisible({ timeout: 15_000 });

    await expect(
      page.getByText(/Manual telemetry upload is an Apex Pro feature/i),
    ).toHaveCount(0);

    await page.getByRole("button", { name: /Le Mans Ultimate/i }).click();
    await page
      .locator('input[type="file"][accept=".duckdb"]')
      .setInputFiles(DUCKDB_PATH);
    await page.getByRole("button", { name: "Upload session" }).click();

    await expect(
      page.getByText(/Processing telemetry/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    await expect(page).toHaveURL(/\/v2\/sessions\/lmu_[a-f0-9]{32}/, {
      timeout: 180_000,
    });

    const v2Url = page.url();
    const sessionId = v2Url.match(/\/v2\/sessions\/([^/?#]+)/)?.[1];
    expect(sessionId).toBeTruthy();
    expect(sessionId).toMatch(/^lmu_[a-f0-9]{32}$/);
    createdSessionIds.push(sessionId!);

    await expect(
      page.getByRole("heading", { name: /Lap history/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("No laps recorded yet.")).toHaveCount(0);
    await expect(page.getByText("Red Bull RB20")).toHaveCount(0);
    await expect(page.getByTestId(/lap-row-/).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Sebring/i).first()).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByTestId("session-telemetry-v2")).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText("Telemetry Analysis").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Driving$/i })).toBeVisible({
      timeout: 30_000,
    });

    const detail = await getSessionDetailViaApi(request, auth, sessionId!);
    expect((detail.lapCount ?? 0) > 0).toBe(true);
    expect(String(detail.sim ?? "")).toMatch(/LMU|Le Mans Ultimate/i);
    expect(String(detail.track ?? detail.trackName ?? "")).toMatch(/Sebring/i);

    const laps = await fetchSessionLaps(request, auth, sessionId!);
    const realSectors = laps.filter(
      (l) =>
        l.sector1Ms != null &&
        l.sector2Ms != null &&
        l.sector3Ms != null &&
        Math.abs(l.sector1Ms - l.sector2Ms) > 2,
    );
    expect(realSectors.length).toBeGreaterThan(0);

    const telemetrySummary = await fetchTelemetrySummary(
      request,
      auth,
      sessionId!,
    );
    expect(telemetrySummary.eligible).toBe(true);
    const traced = telemetrySummary.laps?.filter((l) => l.hasTraces) ?? [];
    expect(traced.length).toBeGreaterThan(0);

    const lapNum = traced[0]!.lapNumber;
    const traces = await fetchTelemetryTraces(
      request,
      auth,
      sessionId!,
      lapNum,
    );
    expect(traces.speedKmh.length).toBeGreaterThan(1);
    const speedMin = Math.min(...traces.speedKmh);
    const speedMax = Math.max(...traces.speedKmh);
    expect(speedMax - speedMin).toBeGreaterThan(1);

    await page.getByRole("tab", { name: /^Driving$/i }).click();
    await expect(page.getByTestId("telemetry-driving-charts-v2")).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page.getByTestId("telemetry-driving-charts-v2").locator("canvas").first(),
    ).toBeVisible({ timeout: 30_000 });

    // Synced cursor copy across distance-based charts
    await expect(page.getByText(/synced cursor/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText("Throttle / Brake")).toBeVisible();
    await expect(page.getByText("Gear").first()).toBeVisible();

    // Graceful empty: fuel/tyre tabs may be absent — page must still show Driving + laps
    await expect(
      page.getByRole("heading", { name: /Lap history/i }),
    ).toBeVisible();
    await expect(page.getByTestId(/lap-row-/).first()).toBeVisible();
    await expect(page.getByRole("tab", { name: /^Driving$/i })).toBeVisible();

    expect(pageErrors).toEqual([]);
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
