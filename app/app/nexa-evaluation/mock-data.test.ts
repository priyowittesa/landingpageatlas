import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPTIONS, MOCK_RUNS, TENANTS, isValidPeriod, mockEstimate, remainingReviews
} from "./mock-data";

describe("NEXA Evaluation preview fixtures", () => {
  it("starts with three remaining reviews and keeps repeated decisions idempotent", () => {
    const run = MOCK_RUNS[0];
    expect(remainingReviews(run)).toBe(3);
    const reviewed = { ...run, reviews: { ...run.reviews, workflow: "right" as const } };
    expect(remainingReviews(reviewed)).toBe(2);
    expect(remainingReviews({
      ...reviewed, reviews: { ...reviewed.reviews, workflow: "wrong" }
    })).toBe(2);
    expect(remainingReviews(run)).toBe(3);
  });

  it("keeps reviews isolated between history entries", () => {
    const run = { ...MOCK_RUNS[0], reviews: {} };
    expect(remainingReviews(run)).toBe(5);
    expect(remainingReviews(MOCK_RUNS[2])).toBe(0);
    expect(MOCK_RUNS[0].reviews).toEqual({ vendor: "wrong", connections: "right" });
  });

  it("requires both custom dates in chronological order", () => {
    expect(isValidPeriod(DEFAULT_OPTIONS)).toBe(true);
    expect(isValidPeriod({ ...DEFAULT_OPTIONS, period: "last-30-days" })).toBe(true);
    for (const [startDate, endDate, valid] of [
      ["", "", false],
      ["2026-10-01", "", false],
      ["", "2026-10-31", false],
      ["2026-10-31", "2026-10-01", false],
      ["2026-10-01", "2026-10-31", true],
      ["2026-10-01", "2026-10-01", true]
    ] as const) {
      expect(isValidPeriod({
        ...DEFAULT_OPTIONS, period: "custom", startDate, endDate
      })).toBe(valid);
    }
  });

  it("provides deterministic local estimates for all or one tenant", () => {
    expect(mockEstimate(DEFAULT_OPTIONS)).toEqual({ answers: 96, messages: 142, cost: "$0.71" });
    expect(mockEstimate({ ...DEFAULT_OPTIONS, tenant: TENANTS[0] }))
      .toEqual({ answers: 32, messages: 47, cost: "$0.24" });
  });
});
