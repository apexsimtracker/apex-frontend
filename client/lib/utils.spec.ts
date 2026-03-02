import { describe, it, expect } from "vitest";
import { cn, formatCarName } from "./utils";

describe("cn function", () => {
  it("should merge classes correctly", () => {
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    expect(cn("base-class", isActive && "active-class")).toBe(
      "base-class active-class",
    );
  });

  it("should handle false and null conditions", () => {
    const isActive = false;
    expect(cn("base-class", isActive && "active-class", null)).toBe(
      "base-class",
    );
  });

  it("should merge tailwind classes properly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should work with object notation", () => {
    expect(cn("base", { conditional: true, "not-included": false })).toBe(
      "base conditional",
    );
  });
});

describe("formatCarName", () => {
  it("should preserve well-formatted car names", () => {
    expect(formatCarName("Ferrari SF-24")).toBe("Ferrari SF-24");
    expect(formatCarName("Mercedes W15")).toBe("Mercedes W15");
    expect(formatCarName("BMW M6 GT3")).toBe("BMW M6 GT3");
    expect(formatCarName("McLaren GT")).toBe("McLaren GT");
    expect(formatCarName("Porsche 911 GT3 R")).toBe("Porsche 911 GT3 R");
    expect(formatCarName("Red Bull RB20")).toBe("Red Bull RB20");
  });

  it("should uppercase known acronyms", () => {
    expect(formatCarName("Ferrari 488 gte")).toBe("Ferrari 488 GTE");
    expect(formatCarName("porsche 911 rsr")).toBe("Porsche 911 RSR");
    expect(formatCarName("Mercedes w12")).toBe("Mercedes W12");
  });

  it("should extract model codes from concatenated names", () => {
    expect(formatCarName("Mercedesw12")).toBe("Mercedes W12");
    expect(formatCarName("mercedesw12")).toBe("Mercedes W12");
    expect(formatCarName("redbullrb20")).toBe("Redbull RB20");
  });

  it("should handle null/undefined", () => {
    expect(formatCarName(null)).toBe("Unknown Car");
    expect(formatCarName(undefined)).toBe("Unknown Car");
  });

  it("should handle dash fallback", () => {
    expect(formatCarName("—")).toBe("Unknown Car");
  });

  it("should capitalize lowercase names", () => {
    expect(formatCarName("ferrari")).toBe("Ferrari");
    expect(formatCarName("mercedes")).toBe("Mercedes");
  });

  it("should handle hyphenated model codes", () => {
    expect(formatCarName("Haas VF-24")).toBe("Haas VF-24");
  });
});
