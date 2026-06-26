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
