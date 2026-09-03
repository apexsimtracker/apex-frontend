#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const configPath = join(root, "ios", "App", "App", "capacitor.config.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));

if (config.server?.url) {
  console.error(
    `[assert-baked-capacitor-config] release config contains server.url: ${config.server.url}`,
  );
  process.exit(1);
}

console.info(
  "[assert-baked-capacitor-config] iOS config is baked (no server.url)",
);
