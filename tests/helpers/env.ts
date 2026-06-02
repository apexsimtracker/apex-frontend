import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const FRONTEND_ROOT = resolve(import.meta.dirname, "../..");
const APEX_ENV = resolve(FRONTEND_ROOT, "../apex/.env");

loadEnv({ path: resolve(FRONTEND_ROOT, ".env.e2e.local"), quiet: true });
if (existsSync(APEX_ENV)) {
  loadEnv({ path: APEX_ENV, quiet: true });
}

export type E2eEnv = {
  baseUrl: string;
  apiUrl: string;
  checkoutUserEmail: string;
  proUserEmail: string;
  /** User for EXPIRATION webhook test; defaults to checkout user when unset. */
  webhookUserEmail: string;
  password: string;
  revenueCatWebhookSecret: string;
  adminSecret: string;
  billingConfigured: boolean;
};

function requireNonEmpty(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`Missing required E2E env var: ${name}`);
  }
  return trimmed;
}

export function getE2eEnv(): E2eEnv {
  return {
    baseUrl: (process.env.E2E_BASE_URL ?? "http://localhost:8080").replace(/\/$/, ""),
    apiUrl: (process.env.E2E_API_URL ?? "http://127.0.0.1:10000").replace(/\/$/, ""),
    checkoutUserEmail: requireNonEmpty(
      "E2E_CHECKOUT_USER_EMAIL",
      process.env.E2E_CHECKOUT_USER_EMAIL
    ),
    proUserEmail: requireNonEmpty("E2E_PRO_USER_EMAIL", process.env.E2E_PRO_USER_EMAIL),
    webhookUserEmail:
      process.env.E2E_WEBHOOK_USER_EMAIL?.trim() ||
      requireNonEmpty("E2E_CHECKOUT_USER_EMAIL", process.env.E2E_CHECKOUT_USER_EMAIL),
    password: requireNonEmpty("E2E_USER_PASSWORD", process.env.E2E_USER_PASSWORD),
    revenueCatWebhookSecret:
      process.env.REVENUECAT_WEBHOOK_SECRET?.trim() ?? "",
    adminSecret: process.env.ADMIN_SECRET?.trim() ?? "",
    billingConfigured: process.env.E2E_BILLING_CONFIGURED === "1",
  };
}

export function isBillingConfigured(): boolean {
  return process.env.E2E_BILLING_CONFIGURED === "1";
}
