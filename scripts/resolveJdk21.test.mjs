import { describe, expect, it } from "vitest";
import path from "node:path";
import {
  MAC_ANDROID_STUDIO_JBR,
  jdk21CandidateHomes,
  parseJavaMajorVersion,
  resolveJdk21Home,
} from "./resolveJdk21.mjs";

describe("resolveJdk21", () => {
  it("parses major versions from java -version output", () => {
    expect(parseJavaMajorVersion('java version "17.0.12" 2024-07-16 LTS')).toBe(
      17,
    );
    expect(parseJavaMajorVersion('openjdk version "21.0.10" 2026-01-20')).toBe(
      21,
    );
  });

  it("prefers JAVA_HOME only when it is JDK 21+", () => {
    const jdk17 = "/fake/jdk-17";
    const home = resolveJdk21Home({
      env: { JAVA_HOME: jdk17 },
      platform: "darwin",
      existsSync: (p) =>
        p === path.join(jdk17, "bin", "java") ||
        p === path.join(MAC_ANDROID_STUDIO_JBR, "bin", "java"),
      javaMajorVersion: (javaHome) =>
        javaHome === MAC_ANDROID_STUDIO_JBR ? 21 : 17,
    });
    expect(home).toBe(MAC_ANDROID_STUDIO_JBR);
  });

  it("lists Android Studio JBR among macOS candidates", () => {
    expect(jdk21CandidateHomes({ env: {}, platform: "darwin" })).toContain(
      "/Applications/Android Studio.app/Contents/jbr/Contents/Home",
    );
  });
});
