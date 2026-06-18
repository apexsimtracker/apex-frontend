import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const FRONTEND_ROOT = resolve(import.meta.dirname, "../..");
const APEX_ENV = resolve(FRONTEND_ROOT, "../apex/.env");

loadEnv({ path: resolve(FRONTEND_ROOT, ".env.e2e.local"), quiet: true });
if (existsSync(APEX_ENV)) {
  loadEnv({ path: APEX_ENV, quiet: true });
}

export type E2ePersonaKey =
  | "admin"
  | "checkoutSeed"
  | "proSeed"
  | "webhookFree"
  | "standard"
  | "socialA"
  | "socialB"
  | "private"
  | "sacrificial"
  | "suspended"
  | "unverified"
  | "challenge";

const PERSONA_ENV: Record<E2ePersonaKey, string> = {
  admin: "E2E_ADMIN_EMAIL",
  checkoutSeed: "E2E_CHECKOUT_SEED_EMAIL",
  proSeed: "E2E_PRO_SEED_EMAIL",
  webhookFree: "E2E_WEBHOOK_FREE_EMAIL",
  standard: "E2E_STANDARD_USER_EMAIL",
  socialA: "E2E_SOCIAL_A_EMAIL",
  socialB: "E2E_SOCIAL_B_EMAIL",
  private: "E2E_PRIVATE_USER_EMAIL",
  sacrificial: "E2E_SACRIFICIAL_EMAIL",
  suspended: "E2E_SUSPENDED_EMAIL",
  unverified: "E2E_UNVERIFIED_EMAIL",
  challenge: "E2E_CHALLENGE_USER_EMAIL",
};

const PERSONA_DEFAULTS: Record<E2ePersonaKey, string> = {
  admin: "e2e-admin@example.com",
  checkoutSeed: "e2e-checkout@example.com",
  proSeed: "e2e-pro@example.com",
  webhookFree: "e2e-webhook-free@example.com",
  standard: "e2e-standard@example.com",
  socialA: "e2e-social-a@example.com",
  socialB: "e2e-social-b@example.com",
  private: "e2e-private@example.com",
  sacrificial: "e2e-sacrificial@example.com",
  suspended: "e2e-suspended@example.com",
  unverified: "e2e-unverified@example.com",
  challenge: "e2e-challenge@example.com",
};

export type E2eEnv = {
  baseUrl: string;
  apiUrl: string;
  password: string;
  checkoutUserEmail: string;
  proUserEmail: string;
  webhookUserEmail: string;
  revenueCatWebhookSecret: string;
  adminSecret: string;
  billingConfigured: boolean;
  challengeId: string;
  unverifiedKnownCode: string;
  personas: Record<E2ePersonaKey, string>;
};

function requireNonEmpty(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`Missing required E2E env var: ${name}`);
  }
  return trimmed;
}

function personaEmail(key: E2ePersonaKey): string {
  const envName = PERSONA_ENV[key];
  return process.env[envName]?.trim() || PERSONA_DEFAULTS[key];
}

export function getE2eEnv(): E2eEnv {
  const personas = Object.fromEntries(
    (Object.keys(PERSONA_ENV) as E2ePersonaKey[]).map((key) => [key, personaEmail(key)])
  ) as Record<E2ePersonaKey, string>;

  return {
    baseUrl: (process.env.E2E_BASE_URL ?? "http://localhost:8080").replace(/\/$/, ""),
    apiUrl: (process.env.E2E_API_URL ?? "http://127.0.0.1:10000").replace(/\/$/, ""),
    password: requireNonEmpty("E2E_USER_PASSWORD", process.env.E2E_USER_PASSWORD),
    checkoutUserEmail: requireNonEmpty(
      "E2E_CHECKOUT_USER_EMAIL",
      process.env.E2E_CHECKOUT_USER_EMAIL
    ),
    proUserEmail: requireNonEmpty("E2E_PRO_USER_EMAIL", process.env.E2E_PRO_USER_EMAIL),
    webhookUserEmail:
      process.env.E2E_WEBHOOK_USER_EMAIL?.trim() || personaEmail("webhookFree"),
    revenueCatWebhookSecret: process.env.REVENUECAT_WEBHOOK_SECRET?.trim() ?? "",
    adminSecret: process.env.ADMIN_SECRET?.trim() ?? "",
    billingConfigured: process.env.E2E_BILLING_CONFIGURED === "1",
    challengeId:
      process.env.E2E_CHALLENGE_ID?.trim() || "e2e-challenge-road-atlanta-gt3",
    unverifiedKnownCode: process.env.E2E_UNVERIFIED_KNOWN_CODE?.trim() || "12345678",
    personas,
  };
}

export function isBillingConfigured(): boolean {
  return process.env.E2E_BILLING_CONFIGURED === "1";
}

export function getPersonaEmail(key: E2ePersonaKey): string {
  return getE2eEnv().personas[key];
}
