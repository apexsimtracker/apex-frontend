import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const FRONTEND_ROOT = resolve(import.meta.dirname);
const APEX_ROOT = resolve(FRONTEND_ROOT, "../apex");

loadEnv({ path: resolve(FRONTEND_ROOT, ".env.e2e.local"), quiet: true });
if (existsSync(resolve(APEX_ROOT, ".env"))) {
  loadEnv({ path: resolve(APEX_ROOT, ".env"), quiet: true });
}

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const apiHealthUrl =
  (process.env.E2E_API_URL ?? "http://127.0.0.1:10000").replace(/\/$/, "") +
  "/api/health";
const reuseExistingServer = !process.env.CI;

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/global-setup.ts",
  timeout: 60_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm dev",
      cwd: APEX_ROOT,
      url: apiHealthUrl,
      reuseExistingServer,
      timeout: 120_000,
      env: {
        ...process.env,
        DISABLE_MANUAL_UPLOAD_RATE_LIMIT: "1",
      },
    },
    {
      command: "pnpm dev",
      cwd: FRONTEND_ROOT,
      url: baseURL,
      reuseExistingServer,
      timeout: 60_000,
    },
  ],
});
