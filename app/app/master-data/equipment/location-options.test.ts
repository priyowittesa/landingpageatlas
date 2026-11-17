import { describe, expect, it } from "vitest";
import { mergeLocationItems } from "./location-options";

const france = { id: "fr", code: "FR", name: "France" };
const germany = { id: "de", code: "DE", name: "Germany" };
const india = { id: "in", code: "IN", name: "India" };
const indonesia = { id: "id", code: "ID", name: "Indonesia" };
const cachedCountries = [france, germany];

describe("equipment location search results", () => {
  it("does not prepend cached countries when no country is selected", () => {
    expect(mergeLocationItems([india, indonesia], cachedCountries)).toEqual([india, indonesia]);
    expect(mergeLocationItems([india], cachedCountries, "")).toEqual([india]);
  });

  it("keeps matching countries first and retains only the selected label", () => {
    expect(mergeLocationItems([india, indonesia], cachedCountries, "fr")).toEqual([
      india, indonesia, france
    ]);
  });

  it("does not duplicate a selected country already present in the results", () => {
    expect(mergeLocationItems([germany, france], cachedCountries, "fr")).toEqual([
      germany, france
    ]);
  });

  it("uses current result data instead of a stale selected-country label", () => {
    const updated = { ...france, name: "Updated France" };
    expect(mergeLocationItems([updated], cachedCountries, "fr")).toEqual([updated]);
  });

  it("preserves result order as more pages arrive", () => {
    expect(mergeLocationItems([india, indonesia, germany], cachedCountries, "fr")).toEqual([
      india, indonesia, germany, france
    ]);
  });

  it("retains a selected country while the result page is empty", () => {
    expect(mergeLocationItems([], cachedCountries, "fr")).toEqual([france]);
    expect(mergeLocationItems([], cachedCountries)).toEqual([]);
  });

  it("supports selections stored as location codes", () => {
    expect(mergeLocationItems([india], cachedCountries, "FR")).toEqual([india, france]);
  });

  it("does not mutate cached query data", () => {
    const results = [india];
    mergeLocationItems(results, cachedCountries, "fr");
    expect(results).toEqual([india]);
    expect(cachedCountries).toEqual([france, germany]);
  });
});
