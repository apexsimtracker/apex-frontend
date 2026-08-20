import { describe, expect, it } from "vitest";
import { filterCatalogOptions } from "./catalogPickerSearch";

const OPTIONS = [
  { id: "watkins_glen_international", name: "Watkins Glen International" },
  { id: "nurburgring_nordschleife", name: "Nürburgring Nordschleife" },
  { id: "ferrari 296 gt3", name: "Ferrari 296 GT3" },
];

describe("filterCatalogOptions", () => {
  it("filters by display name without accents", () => {
    expect(filterCatalogOptions(OPTIONS, "nurburgring")).toEqual([OPTIONS[1]]);
  });

  it("filters by canonical slug and normalizes separators", () => {
    expect(filterCatalogOptions(OPTIONS, "watkins glen")).toEqual([OPTIONS[0]]);
  });

  it("returns all options for a blank query", () => {
    expect(filterCatalogOptions(OPTIONS, "   ")).toBe(OPTIONS);
  });
});
