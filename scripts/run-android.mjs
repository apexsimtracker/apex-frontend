#!/usr/bin/env node
/**
 * Portable wrapper for `cap run android`.
 *
 * Env:
 *   JAVA_HOME — optional JDK 21+; a JDK 17 JAVA_HOME is ignored in favor of
 *     Android Studio JBR 21 on macOS (Capacitor 8 / AGP require Java 21)
 *   CAP_ANDROID_TARGET — optional AVD/device id passed to `--target`
 *
 * Args:
 *   --live-reload — pass `-l --port 8080` to Capacitor
 *   --target <id> — override CAP_ANDROID_TARGET for this run
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { missingJdk21Message, resolveJdk21Home } from "./resolveJdk21.mjs";

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
const javaHome = resolveJdk21Home();
if (!javaHome) {
  console.error(`[run-android] ${missingJdk21Message()}`);
  process.exit(1);
}
console.log(`[run-android] using JDK 21+ at ${javaHome}`);

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
