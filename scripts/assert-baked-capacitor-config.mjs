#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const nativeConfigs = [
  ["iOS", join(root, "ios", "App", "App", "capacitor.config.json")],
  [
    "Android",
    join(
      root,
      "android",
      "app",
      "src",
      "main",
      "assets",
      "capacitor.config.json",
    ),
  ],
];

for (const [platform, configPath] of nativeConfigs) {
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  if (config.server?.url) {
    console.error(
      `[assert-baked-capacitor-config] ${platform} release config contains server.url: ${config.server.url}`,
    );
    process.exit(1);
  }

  console.info(
    `[assert-baked-capacitor-config] ${platform} config is baked (no server.url)`,
  );
}
