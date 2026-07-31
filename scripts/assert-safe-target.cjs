#!/usr/bin/env node
/**
 * Prefer sibling apex assert-safe-target; ESM package uses .cjs.
 */
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const sibling = path.resolve(__dirname, "../../apex/scripts/assert-safe-target.js");
if (fs.existsSync(sibling)) {
  const r = spawnSync(process.execPath, [sibling], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });
  process.exit(r.status ?? 1);
}

const { execSync } = require("node:child_process");
function truthy(v) {
  const s = String(v ?? "").trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}
const branch = (() => {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
})();
if ((branch === "main" || branch === "master") && !truthy(process.env.ALLOW_DESTRUCTIVE_ON_MAIN)) {
  console.error(`[assert-safe-target] BLOCKED: branch=${branch}`);
  process.exit(1);
}
console.log(`[assert-safe-target] OK branch=${branch || "(unknown)"}`);
