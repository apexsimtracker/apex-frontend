import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { getE2eEnv } from "./env";

const APEX_ROOT = resolve(import.meta.dirname, "../../../apex");

/**
 * Strategy D: most personas are pre-verified by `npm run seed:e2e`.
 * For sacrificial signup flows, assign a known code before verify UI steps.
 */
export function assignKnownVerificationCode(
  email: string,
  code?: string,
): void {
  const resolvedCode = code ?? getE2eEnv().unverifiedKnownCode;
  execFileSync(
    "npx",
    ["tsx", "scripts/e2e/assign-verification-code.ts", email, resolvedCode],
    { cwd: APEX_ROOT, stdio: "pipe", encoding: "utf8" },
  );
}

/** Pre-seeded unverified persona + known code from seed-e2e-users. */
export function unverifiedPersonaCredentials(): {
  email: string;
  code: string;
} {
  const env = getE2eEnv();
  return {
    email: env.personas.unverified,
    code: env.unverifiedKnownCode,
  };
}

const DEFAULT_RESET_CODE = "123456";

/** Assign a known 6-digit password-reset code (forgot-password wizard). */
export function assignKnownPasswordResetCode(
  email: string,
  code: string = DEFAULT_RESET_CODE,
): void {
  execFileSync(
    "npx",
    ["tsx", "scripts/e2e/assign-password-reset-code.ts", email, code],
    { cwd: APEX_ROOT, stdio: "pipe", encoding: "utf8" },
  );
}

export function knownPasswordResetCode(): string {
  return DEFAULT_RESET_CODE;
}
