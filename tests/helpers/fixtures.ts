import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const APEX_ROOT = resolve(import.meta.dirname, "../../../apex");
const FIXTURE_ROOT = resolve(APEX_ROOT, "tests/fixtures");

export type IbtManifest = {
  entries: Array<{
    id: string;
    filename: string;
    relativePath: string;
    tags: string[];
    weekendGroup?: string;
  }>;
};

export function fixturePath(...segments: string[]): string {
  return resolve(FIXTURE_ROOT, ...segments);
}

export function ibtFixture(filename: string): string {
  return fixturePath("ibt", filename);
}

export function sessionJsonFixture(filename: string): string {
  return fixturePath("sessions", filename);
}

export function avatarFixture(): string {
  return fixturePath("avatar-e2e.png");
}

export function loadIbtManifest(): IbtManifest {
  const manifestPath = fixturePath("ibt", "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(
      `IBT manifest missing at ${manifestPath}. Run: cd apex && npm run setup:e2e-fixtures`
    );
  }
  return JSON.parse(readFileSync(manifestPath, "utf8")) as IbtManifest;
}

export function ibtFixtureByTag(tag: string): string {
  const manifest = loadIbtManifest();
  const entry = manifest.entries.find((e) => e.tags.includes(tag));
  if (!entry) {
    throw new Error(`No IBT fixture with tag "${tag}"`);
  }
  return fixturePath("ibt", entry.filename);
}
