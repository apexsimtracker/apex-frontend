#!/usr/bin/env node
/**
 * Update frontend .env VITE_API_URL / VITE_APP_ENV for local|staging|prod.
 * ESM-safe (.cjs) because apex-frontend package.json has "type": "module".
 *
 * Usage:
 *   node scripts/use-api-env.cjs local|staging
 *   CONFIRM_PROD_ENV=PRODUCTION node scripts/use-api-env.cjs prod --i-know-what-im-doing
 */
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);
const target = String(args.find((a) => !a.startsWith("-")) || "")
  .trim()
  .toLowerCase();
const knowFlag = args.includes("--i-know-what-im-doing");

const presets = {
  local: {
    VITE_APP_ENV: "development",
    VITE_API_URL: "http://127.0.0.1:10000",
  },
  development: {
    VITE_APP_ENV: "development",
    VITE_API_URL: "http://127.0.0.1:10000",
  },
  staging: {
    VITE_APP_ENV: "staging",
    VITE_API_URL: "https://staging-y01y.onrender.com",
  },
  prod: {
    VITE_APP_ENV: "production",
    VITE_API_URL: "https://apex-1-y319.onrender.com",
  },
  production: {
    VITE_APP_ENV: "production",
    VITE_API_URL: "https://apex-1-y319.onrender.com",
  },
};

const preset = presets[target];
if (!preset) {
  console.error("Usage: node scripts/use-api-env.cjs <local|staging|prod>");
  console.error("  prod also requires: --i-know-what-im-doing and CONFIRM_PROD_ENV=PRODUCTION");
  process.exit(1);
}

const isProd = target === "prod" || target === "production";
if (isProd) {
  const confirm = String(process.env.CONFIRM_PROD_ENV || "").trim();
  if (!knowFlag || confirm !== "PRODUCTION") {
    console.error("[use-api-env] Refusing to point frontend at PRODUCTION API.");
    console.error("  To proceed:");
    console.error(
      "    CONFIRM_PROD_ENV=PRODUCTION npm run env:api:prod -- --i-know-what-im-doing"
    );
    process.exit(1);
  }
}

const root = path.resolve(__dirname, "..");
const dest = path.join(root, ".env");
let text = fs.existsSync(dest) ? fs.readFileSync(dest, "utf8") : "";

function upsert(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  return (
    content.trimEnd() +
    (content.endsWith("\n") || !content ? "" : "\n") +
    line +
    "\n"
  );
}

text = upsert(text, "VITE_APP_ENV", preset.VITE_APP_ENV);
text = upsert(text, "VITE_API_URL", preset.VITE_API_URL);
text = upsert(text, "VITE_APEX_API_BASE_URL", preset.VITE_API_URL);

fs.writeFileSync(dest, text.endsWith("\n") ? text : text + "\n");
console.log(`Updated .env API target=${target}`);
console.log(`  VITE_APP_ENV=${preset.VITE_APP_ENV}`);
console.log(`  VITE_API_URL=${preset.VITE_API_URL}`);
if (isProd) {
  console.warn("[use-api-env] WARNING: frontend .env points at production API.");
}
