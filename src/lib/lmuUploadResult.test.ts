import { describe, expect, it } from "vitest";
import {
  inferLmuUploadKind,
  lmuKindSupportsResult,
  lmuResultPositionLabel,
  validateLmuResultInput,
} from "./lmuUploadResult";

describe("inferLmuUploadKind", () => {
  it("reads the session marker used by LMU telemetry filenames", () => {
    expect(
      inferLmuUploadKind("Daytona International Speedway_R_2026-08-20T10_13_54Z.duckdb"),
    ).toBe("race");
    expect(
      inferLmuUploadKind("Sebring International Raceway_Q_2026-08-04T11_18_42Z.duckdb"),
    ).toBe("qualifying");
    expect(
      inferLmuUploadKind("Sebring International Raceway_P_2026-06-02T21_14_30Z.duckdb"),
    ).toBe("practice");
  });

  it("falls back to words in the filename", () => {
    expect(inferLmuUploadKind("spa-qualifying.duckdb")).toBe("qualifying");
    expect(inferLmuUploadKind("spa race.duckdb")).toBe("race");
    expect(inferLmuUploadKind("spa practice.duckdb")).toBe("practice");
  });

  it("returns unknown when the filename says nothing", () => {
    expect(inferLmuUploadKind("session.duckdb")).toBe("unknown");
    expect(inferLmuUploadKind("")).toBe("unknown");
  });
});

describe("lmuKindSupportsResult", () => {
  it("offers result fields for everything except practice", () => {
    expect(lmuKindSupportsResult("race")).toBe(true);
    expect(lmuKindSupportsResult("qualifying")).toBe(true);
    expect(lmuKindSupportsResult("unknown")).toBe(true);
    expect(lmuKindSupportsResult("practice")).toBe(false);
  });
});

describe("lmuResultPositionLabel", () => {
  it("names the qualifying field differently", () => {
    expect(lmuResultPositionLabel("qualifying")).toBe("Qualifying position");
    expect(lmuResultPositionLabel("race")).toBe("Finishing position");
  });
});

describe("validateLmuResultInput", () => {
  it("accepts blank input because the fields are optional", () => {
    expect(validateLmuResultInput("", "")).toBeNull();
    expect(validateLmuResultInput("  ", " ")).toBeNull();
  });

  it("accepts either field on its own", () => {
    expect(validateLmuResultInput("3", "")).toBeNull();
    expect(validateLmuResultInput("", "24")).toBeNull();
  });

  it("rejects non-numeric and out-of-range values", () => {
    expect(validateLmuResultInput("P3", "")).not.toBeNull();
    expect(validateLmuResultInput("0", "")).not.toBeNull();
    expect(validateLmuResultInput("1000", "")).not.toBeNull();
    expect(validateLmuResultInput("3.5", "")).not.toBeNull();
    expect(validateLmuResultInput("", "0")).not.toBeNull();
  });

  it("rejects a position beyond the grid size", () => {
    expect(validateLmuResultInput("12", "10")).not.toBeNull();
    expect(validateLmuResultInput("10", "10")).toBeNull();
  });
});
