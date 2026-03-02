/**
 * Build-time and env-based app config (no secrets).
 */

export const APP_VERSION: string =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.0.0";

const envSupportEmail = import.meta.env.VITE_SUPPORT_EMAIL;
export const SUPPORT_EMAIL: string =
  typeof envSupportEmail === "string" && envSupportEmail.trim()
    ? envSupportEmail.trim()
    : "support@example.com";
