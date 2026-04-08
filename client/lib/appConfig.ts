/**
 * Build-time and env-based app config (no secrets).
 */

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "1.0.0";

const envSupportEmail = import.meta.env.VITE_SUPPORT_EMAIL;
export const SUPPORT_EMAIL: string =
  typeof envSupportEmail === "string" && envSupportEmail.trim()
    ? envSupportEmail.trim()
    : "support@apexsimtracker.com";

/** Brand red for primary actions and accents (aligned with Login, Settings, Community). */
export const BRAND_RED = "rgb(240, 28, 28)";
