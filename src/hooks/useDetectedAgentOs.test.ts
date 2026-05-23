import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectAgentOs } from "./useDetectedAgentOs";

describe("detectAgentOs", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns macos for Mac user agents", () => {
    vi.stubGlobal("navigator", {
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      userAgentData: { platform: "macOS" },
    });
    expect(detectAgentOs()).toBe("macos");
  });

  it("returns windows for Windows user agents", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      userAgentData: { platform: "Windows" },
    });
    expect(detectAgentOs()).toBe("windows");
  });

  it("defaults to windows for Linux and unknown platforms", () => {
    vi.stubGlobal("navigator", {
      userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
      userAgentData: { platform: "Linux" },
    });
    expect(detectAgentOs()).toBe("windows");
  });
});
