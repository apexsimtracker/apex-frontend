import { existsSync } from "node:fs";
import { resolve } from "node:path";

const APEX_ROOT = resolve(import.meta.dirname, "../../../apex");
const FIXTURE_ROOT = resolve(APEX_ROOT, "tests/fixtures");

export function fixturePath(...segments: string[]): string {
  return resolve(FIXTURE_ROOT, ...segments);
}

export function sessionJsonFixture(filename: string): string {
  return fixturePath("sessions", filename);
}

export function avatarFixture(): string {
  return fixturePath("avatar-e2e.png");
}

/** Path to a real .ibt under apex/tests/fixtures/ibt (often a symlink into ibt-files/). */
export function ibtFixture(filename: string): string {
  return fixturePath("ibt", filename);
}

export const IBT_PRACTICE_BMW_FIXTURE = "practice_road-atlanta_bmw-m-lmdh.ibt";

export function ibtFixtureExists(filename = IBT_PRACTICE_BMW_FIXTURE): boolean {
  const p = ibtFixture(filename);
  return existsSync(p);
}

/** Path to a real .duckdb under apex/tests/fixtures/lmu (symlink into ibt-files/). */
export function duckdbFixture(filename: string): string {
  return fixturePath("lmu", filename);
}

export const DUCKDB_PRACTICE_SEBRING = "practice_sebring_lmu.duckdb";

export function duckdbFixtureExists(filename = DUCKDB_PRACTICE_SEBRING): boolean {
  return existsSync(duckdbFixture(filename));
}
