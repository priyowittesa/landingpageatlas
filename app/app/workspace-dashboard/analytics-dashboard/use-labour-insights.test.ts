import { describe, expect, it } from "vitest";
import { normalizeLabourInsight, timeAgo } from "./use-labour-insights";

describe("normalizeLabourInsight", () => {
  it("turns an API insight into a dashboard card", () => {
    expect(
      normalizeLabourInsight({
        id: "ins-1",
        type: "anomaly",
        severity: "high",
        title: "Worker double-booked",
        description: "Budi is rostered on two projects on Monday.",
        data_source: "roster records",
        data_scope: "All Projects",
        data_period: "Last 7 days",
      }),
    ).toEqual({
      id: "ins-1",
      category: "ANOMALY",
      severity: "High",
      title: "Worker double-booked",
      description: "Budi is rostered on two projects on Monday.",
      source: "Based on roster records · All Projects · Last 7 days",
      actions: [],
    });
  });

  it("falls back for an unknown type or severity and a missing basis", () => {
    const card = normalizeLabourInsight({ type: "trend", severity: "critical" }, 4);
    expect(card).toMatchObject({ id: "4", category: "RECOMMENDATION", severity: "Low", source: "" });
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-11-13T10:00:00Z").getTime();

  it("says how long ago the insights were generated", () => {
    expect(timeAgo("2026-11-13T09:59:40Z", now)).toBe("just now");
    expect(timeAgo("2026-11-13T09:58:00Z", now)).toBe("2 min ago");
    expect(timeAgo("2026-11-13T07:00:00Z", now)).toBe("3 h ago");
    expect(timeAgo("2026-11-09T10:00:00Z", now)).toBe("4 d ago");
  });

  it("is empty without a valid time", () => {
    expect(timeAgo(null, now)).toBe("");
    expect(timeAgo("not a date", now)).toBe("");
  });
});
