#!/usr/bin/env node
/**
 * Copy package.json version + nativeBuildNumber into iOS pbxproj and Android Gradle.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = String(pkg.version ?? "").trim();
const buildNumber = Number(pkg.nativeBuildNumber);

if (!/^\d+\.\d+\.\d+/.test(version)) {
  console.error(`[sync-native-version] invalid package.json version: ${version}`);
  process.exit(1);
}
if (!Number.isInteger(buildNumber) || buildNumber < 1) {
  console.error(
    `[sync-native-version] package.json nativeBuildNumber must be a positive integer`,
  );
  process.exit(1);
}

const pbxPath = join(root, "ios", "App", "App.xcodeproj", "project.pbxproj");
if (existsSync(pbxPath)) {
  let pbx = readFileSync(pbxPath, "utf8");
  pbx = pbx.replaceAll(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${version};`,
  );
  pbx = pbx.replaceAll(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`,
  );
  writeFileSync(pbxPath, pbx);
}

const gradlePath = join(root, "android", "app", "build.gradle");
if (existsSync(gradlePath)) {
  let gradle = readFileSync(gradlePath, "utf8");
  gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${buildNumber}`);
  gradle = gradle.replace(
    /versionName\s+"[^"]+"/,
    `versionName "${version}"`,
  );
  writeFileSync(gradlePath, gradle);
}

console.info(
  `[sync-native-version] iOS/Android → ${version} (${buildNumber})`,
);
