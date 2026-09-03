#!/usr/bin/env node
/**
 * Run Gradle in android/ with a JDK 21+ JAVA_HOME (skips a JDK 17 JAVA_HOME).
 *
 * Usage: node scripts/android-gradle.mjs assembleDebug
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { missingJdk21Message, resolveJdk21Home } from "./resolveJdk21.mjs";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/android-gradle.mjs <gradle-task> [...]");
  process.exit(1);
}

const javaHome = resolveJdk21Home();
if (!javaHome) {
  console.error(`[android-gradle] ${missingJdk21Message()}`);
  process.exit(1);
}

const androidRoot = path.resolve(import.meta.dirname, "..", "android");
const gradlew = path.join(
  androidRoot,
  process.platform === "win32" ? "gradlew.bat" : "gradlew",
);

console.log(`[android-gradle] using JDK 21+ at ${javaHome}`);
const result = spawnSync(gradlew, args, {
  stdio: "inherit",
  cwd: androidRoot,
  env: {
    ...process.env,
    JAVA_HOME: javaHome,
  },
});

process.exit(result.status ?? 1);
