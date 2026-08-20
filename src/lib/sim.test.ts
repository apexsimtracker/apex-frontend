import { describe, expect, it } from "vitest";
import { toCanonicalSimApiKey, toSupportedSimEnum } from "./sim";

describe("sim catalog key normalization", () => {
  it("uses one canonical catalog key for enum and API forms", () => {
    expect(toCanonicalSimApiKey("IRACING")).toBe("iracing");
    expect(toCanonicalSimApiKey("iracing")).toBe("iracing");
    expect(toCanonicalSimApiKey("F1 25")).toBe("f1_25");
    expect(toCanonicalSimApiKey("f125")).toBe("f1_25");
  });

  it("normalizes challenge/API values back to form enums", () => {
    expect(toSupportedSimEnum("iracing")).toBe("IRACING");
    expect(toSupportedSimEnum("f1_25")).toBe("F1_25");
    expect(toSupportedSimEnum("LMU")).toBe("LMU");
    expect(toSupportedSimEnum("unknown")).toBeNull();
  });
});
