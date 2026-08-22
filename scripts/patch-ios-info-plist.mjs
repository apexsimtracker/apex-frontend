#!/usr/bin/env node
/**
 * Re-apply Info.plist keys after `cap sync` so Capacitor cannot drop them.
 * ios/ is tracked in git; this is a safety net.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PHOTO_KEY = "NSPhotoLibraryUsageDescription";
const PHOTO_DESCRIPTION =
  "Apex uses photos you pick from your library for your profile picture or community posts. Nothing is uploaded until you choose a file.";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plistPath = join(root, "ios", "App", "App", "Info.plist");

if (!existsSync(plistPath)) {
  console.warn(
    `[patch-ios-info-plist] skip: ${plistPath} not found (run cap add ios first).`,
  );
  process.exit(0);
}

let xml = readFileSync(plistPath, "utf8");
if (xml.includes(`<key>${PHOTO_KEY}</key>`)) {
  process.exit(0);
}

const insertion = `\t<key>${PHOTO_KEY}</key>\n\t<string>${PHOTO_DESCRIPTION}</string>\n`;
const closeDict = xml.lastIndexOf("</dict>");
if (closeDict < 0) {
  console.error(`[patch-ios-info-plist] no closing </dict> in ${plistPath}`);
  process.exit(1);
}

xml = `${xml.slice(0, closeDict)}${insertion}${xml.slice(closeDict)}`;
writeFileSync(plistPath, xml);
console.info(`[patch-ios-info-plist] added ${PHOTO_KEY}`);
