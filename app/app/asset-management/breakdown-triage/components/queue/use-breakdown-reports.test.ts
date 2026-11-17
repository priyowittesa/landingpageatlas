import { describe, expect, it } from "vitest";
import { normalizePriorityCounts, normalizeQueueSummary } from "./use-breakdown-reports";

describe("normalizePriorityCounts", () => {
  it("reads the priority_counts map returned by the report list", () => {
    expect(normalizePriorityCounts({ all: 25, P1: 4, P2: 7, P3: 12, safety: 2 })).toEqual({
      all: 25,
      P1: 4,
      P2: 7,
      P3: 12,
      safety: 2,
    });
  });

  it("also accepts array facets and count objects", () => {
    expect(normalizePriorityCounts([
      { priority: "P1", count: 3 },
      { priority: "p2", value: 5 },
      { priority: "P3", total: 8 },
      { priority: "SAFETY", count: 1 },
    ])).toEqual({ all: 16, P1: 3, P2: 5, P3: 8, safety: 1 });
  });
});

describe("normalizeQueueSummary", () => {
  it("maps the flat queue-summary response to the four cards", () => {
    const summary = normalizeQueueSummary({
      data: {
        p1_open_count: 2,
        p2_open_count: 3,
        p3_open_count: 6,
        safety_open_count: 1,
        p3_scheduled_count: 4,
        p3_unscheduled_count: 2,
        next_p1: { id: "report-p1", asset_name: "Crusher 01", priority: "P1" },
        next_p2_report: { id: "report-p2", asset_name: "Conveyor 02", priority: "P2" },
        top_safety_report: { id: "report-safe", asset_name: "Boiler 03", priority: "P1" },
      },
    });

    expect(summary.counts).toEqual({ P1: 2, P2: 3, P3: 6, safety: 1 });
    expect(summary.scheduledP3).toBe(4);
    expect(summary.unscheduledP3).toBe(2);
    expect(summary.nextP1?.id).toBe("report-p1");
    expect(summary.nextP2?.id).toBe("report-p2");
    expect(summary.topSafety?.id).toBe("report-safe");
  });

  it("maps a queue-summary grouped by priority", () => {
    const summary = normalizeQueueSummary({
      data: {
        p1: { count: 1, next_report: { id: "p1" } },
        p2: { count: 2, next: { id: "p2" } },
        p3: { count: 5, scheduled: 3, unscheduled: 2 },
        safety: { count: 1, top_report: { id: "safe" } },
      },
    });

    expect(summary.counts).toEqual({ P1: 1, P2: 2, P3: 5, safety: 1 });
    expect(summary.scheduledP3).toBe(3);
    expect(summary.unscheduledP3).toBe(2);
    expect(summary.nextP1?.id).toBe("p1");
    expect(summary.nextP2?.id).toBe("p2");
    expect(summary.topSafety?.id).toBe("safe");
  });
});
