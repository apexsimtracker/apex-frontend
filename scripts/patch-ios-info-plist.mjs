#!/usr/bin/env node
/**
 * Re-apply Info.plist keys after `cap sync` so Capacitor cannot drop them.
 * ios/ is tracked in git; this is a safety net.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const MANAGED_KEYS = [
  {
    key: "NSPhotoLibraryUsageDescription",
    description:
      "Apex uses photos you pick from your library for your profile picture or community posts. Nothing is uploaded until you choose a file.",
  },
  {
    key: "NSCameraUsageDescription",
    description:
      "Apex uses the camera only if the user chooses Take Photo for a profile picture or community image. Nothing is uploaded until they confirm.",
  },
];

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plistPath = join(root, "ios", "App", "App", "Info.plist");

if (!existsSync(plistPath)) {
  console.warn(
    `[patch-ios-info-plist] skip: ${plistPath} not found (run cap add ios first).`,
  );
  process.exit(0);
}

let xml = readFileSync(plistPath, "utf8");
const missingKeys = MANAGED_KEYS.filter(
  ({ key }) => !xml.includes(`<key>${key}</key>`),
);
if (missingKeys.length === 0) {
  process.exit(0);
}

const closeDict = xml.lastIndexOf("</dict>");
if (closeDict < 0) {
  console.error(`[patch-ios-info-plist] no closing </dict> in ${plistPath}`);
  process.exit(1);
}

const insertion = missingKeys
  .map(
    ({ key, description }) =>
      `\t<key>${key}</key>\n\t<string>${description}</string>\n`,
  )
  .join("");
xml = `${xml.slice(0, closeDict)}${insertion}${xml.slice(closeDict)}`;
writeFileSync(plistPath, xml);
for (const { key } of missingKeys) {
  console.info(`[patch-ios-info-plist] added ${key}`);
}
