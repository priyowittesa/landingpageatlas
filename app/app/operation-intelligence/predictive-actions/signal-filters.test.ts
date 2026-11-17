import { describe, expect, it } from "vitest";
import { mockSignals } from "./mock-signals";
import { countSignals, filterSignals } from "./signal-filters";

describe("local signal presentation", () => {
  it("matches the design's aggregate counts without depending on list filters", () => {
    expect(countSignals(mockSignals)).toEqual({ insight: 5, recommendation: 3, prediction: 2 });
    expect(mockSignals.every((signal) => signal.metadata?.is_illustrative)).toBe(true);
    filterSignals(mockSignals, { kind: "prediction" });
    expect(countSignals(mockSignals).prediction).toBe(2);
  });

  it("combines type, module, severity, and status filters", () => {
    const results = filterSignals(mockSignals, {
      kind: "recommendation", moduleName: "well performance", severity: "watch", status: "open"
    });
    expect(results.map((signal) => signal.code)).toEqual(["DEMO-006"]);
  });

  it("searches titles, detector names, entities, codes, and flags case-insensitively", () => {
    expect(filterSignals(mockSignals, { searchQuery: "  ANNULUS " })).toHaveLength(1);
    expect(filterSignals(mockSignals, { searchQuery: "production_yoy_decline" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { searchQuery: "15/9-F-4" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { searchQuery: "demo-002" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { searchQuery: "RISK" })).toHaveLength(1);
  });

  it("filters by a code fragment and exact flag ID", () => {
    expect(filterSignals(mockSignals, { code: "002" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { flagId: "risk" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { flagId: "ri" })).toHaveLength(0);
  });

  it("applies inclusive date boundaries", () => {
    const boundary = mockSignals[0].created_at;
    expect(filterSignals(mockSignals, { createdAfter: boundary, createdBefore: boundary })).toHaveLength(10);
    expect(filterSignals(mockSignals, { createdAfter: "2026-11-04T00:00:00Z" })).toHaveLength(0);
    expect(filterSignals(mockSignals, { createdBefore: "2026-11-02T00:00:00Z" })).toHaveLength(0);
  });

  it("supports reset, actioned-only, and empty results without mutating fixtures", () => {
    expect(filterSignals(mockSignals, { status: "actioned" })).toHaveLength(1);
    expect(filterSignals(mockSignals, { searchQuery: "no matching signal" })).toEqual([]);
    expect(filterSignals(mockSignals, {})).toHaveLength(10);
    expect(mockSignals).toHaveLength(10);
  });
});
