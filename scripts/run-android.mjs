#!/usr/bin/env node
/**
 * Portable wrapper for `cap run android`.
 *
 * Env:
 *   JAVA_HOME — optional; defaults to Android Studio JBR on macOS when present
 *   CAP_ANDROID_TARGET — optional AVD/device id passed to `--target`
 *
 * Args:
 *   --live-reload — pass `-l --port 8080` to Capacitor
 *   --target <id> — override CAP_ANDROID_TARGET for this run
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const MAC_ANDROID_STUDIO_JBR =
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home";

function resolveJavaHome() {
  if (process.env.JAVA_HOME?.trim()) {
    return process.env.JAVA_HOME.trim();
  }
  if (process.platform === "darwin" && fs.existsSync(MAC_ANDROID_STUDIO_JBR)) {
    return MAC_ANDROID_STUDIO_JBR;
  }
  return null;
}

function parseArgs(argv) {
  const liveReload = argv.includes("--live-reload");
  let target = process.env.CAP_ANDROID_TARGET?.trim() || null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--target" && argv[i + 1]) {
      target = argv[i + 1];
      i += 1;
    }
  }

  return { liveReload, target };
}

const { liveReload, target } = parseArgs(process.argv.slice(2));
const javaHome = resolveJavaHome();

const capArgs = ["exec", "cap", "run", "android"];
if (liveReload) {
  capArgs.push("-l", "--port", "8080");
}
if (target) {
  capArgs.push("--target", target);
}

const env = { ...process.env };
if (javaHome) {
  env.JAVA_HOME = javaHome;
}

const result = spawnSync("pnpm", capArgs, {
  stdio: "inherit",
  env,
  cwd: path.resolve(import.meta.dirname, ".."),
});

process.exit(result.status ?? 1);
