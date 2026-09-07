import { describe, expect, it } from "vitest";
import {
  coerceSectorTimesMs,
  isLegacyEstimatedSectorSource,
  legacySectorAliases,
} from "./sectors";

describe("sector compatibility", () => {
  it.each([0, 3, 4, 7])("keeps indexed arrays with %i sectors", (count) => {
    const raw = Array.from({ length: count }, (_, index) =>
      index % 2 ? null : 10_000 + index,
    );
    expect(coerceSectorTimesMs(raw, null, count)).toEqual(raw);
  });

  it("adapts released triplets and preserves null positions", () => {
    expect(
      coerceSectorTimesMs(undefined, {
        sector1Ms: 10,
        sector2Ms: null,
        sector3Ms: 30,
      }),
    ).toEqual([10, null, 30]);
  });

  it("only projects aliases for a three-sector layout", () => {
    expect(legacySectorAliases([1, 2, 3])).toEqual({
      sector1Ms: 1,
      sector2Ms: 2,
      sector3Ms: 3,
    });
    expect(legacySectorAliases([1, 2, 3, 4])).toEqual({
      sector1Ms: null,
      sector2Ms: null,
      sector3Ms: null,
    });
  });

  it("warns only for legacy geometric timing", () => {
    expect(isLegacyEstimatedSectorSource("LEGACY_IRACING_GEOMETRIC")).toBe(true);
    expect(isLegacyEstimatedSectorSource("IRACING_NATIVE")).toBe(false);
  });
});
