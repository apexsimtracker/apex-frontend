import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const FRONTEND_ROOT = resolve(import.meta.dirname, "..");
const APEX_ENV = resolve(FRONTEND_ROOT, "../apex/.env");

loadEnv({ path: resolve(FRONTEND_ROOT, ".env.e2e.local"), quiet: true });
if (existsSync(APEX_ENV)) {
  loadEnv({ path: APEX_ENV, quiet: true });
}

const apiUrl = (process.env.E2E_API_URL ?? "http://127.0.0.1:10000").replace(
  /\/$/,
  "",
);

export type BillingPreflight = {
  configured: boolean;
  mode: string | null;
};

async function globalSetup(): Promise<void> {
  let configured = false;
  let mode: string | null = null;

  try {
    const res = await fetch(`${apiUrl}/api/billing/config`);
    if (res.ok) {
      const body = (await res.json()) as { enabled?: boolean; mode?: string };
      configured = body.enabled === true && body.mode === "sandbox";
      mode = body.mode ?? null;
    }
  } catch {
    configured = false;
  }

  process.env.E2E_BILLING_CONFIGURED = configured ? "1" : "0";
  process.env.E2E_BILLING_MODE = mode ?? "";

  if (!configured) {
    console.warn(
      "[e2e] Billing preflight failed: GET /api/billing/config must return enabled=true and mode=sandbox. " +
        "Ensure apex backend is running with sandbox billing env vars set.",
    );
  }
}

export default globalSetup;
