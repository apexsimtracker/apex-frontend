/**
 * Capacitor 8 / AGP 8.13 compile with `--release 21`. A JDK 17 JAVA_HOME
 * produces `error: invalid source release: 21`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const MAC_ANDROID_STUDIO_JBR =
  "/Applications/Android Studio.app/Contents/jbr/Contents/Home";

const MAC_JDK21_CANDIDATES = [
  MAC_ANDROID_STUDIO_JBR,
  "/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home",
  "/Library/Java/JavaVirtualMachines/jdk-21.jdk/Contents/Home",
  "/Library/Java/JavaVirtualMachines/zulu-21.jdk/Contents/Home",
  "/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home",
];

export function parseJavaMajorVersion(versionOutput) {
  const match = String(versionOutput).match(/version "(\d+)/);
  if (!match) return null;
  return Number(match[1]);
}

export function javaMajorVersion(javaHome) {
  const javaBin = path.join(javaHome, "bin", "java");
  if (!fs.existsSync(javaBin)) return null;
  const result = spawnSync(javaBin, ["-version"], {
    encoding: "utf8",
    timeout: 10_000,
  });
  const output = `${result.stderr ?? ""}\n${result.stdout ?? ""}`;
  return parseJavaMajorVersion(output);
}

export function jdk21CandidateHomes({
  env = process.env,
  platform = process.platform,
} = {}) {
  const homes = [];
  const fromEnv = env.JAVA_HOME?.trim();
  if (fromEnv) homes.push(fromEnv);
  if (platform === "darwin") homes.push(...MAC_JDK21_CANDIDATES);
  return [...new Set(homes)];
}

/**
 * First existing JDK whose `java -version` major is >= 21.
 * Skips a too-old JAVA_HOME so Android Studio JBR 21 can still be used.
 */
export function resolveJdk21Home(options = {}) {
  const existsSync = options.existsSync ?? fs.existsSync;
  const readMajor = options.javaMajorVersion ?? javaMajorVersion;

  for (const home of jdk21CandidateHomes(options)) {
    if (!existsSync(path.join(home, "bin", "java"))) continue;
    const major = readMajor(home);
    if (major != null && major >= 21) return home;
  }
  return null;
}

export function missingJdk21Message() {
  return [
    "Android/Capacitor 8 requires JDK 21 (JDK 17 fails with invalid source release: 21).",
    "Install Android Studio (uses bundled JBR 21) or a JDK 21, then retry.",
    "If JAVA_HOME points at JDK 17, unset it or point it at JDK 21.",
  ].join(" ");
}
