import { describe, expect, it } from "vitest";
import { epiData } from "./data";
import { getPaymentSchedule, getProjectLifecycle, getRegisterSummary } from "./selectors";

describe("universal project views", () => {
  it("places a pipeline project at the start of the lifecycle", () => {
    const lifecycle = getProjectLifecycle(epiData, "GS0326");
    expect(lifecycle.steps.map((step) => step.state)).toEqual([
      "current", "next", "next", "next", "next", "next", "next", "next"
    ]);
    expect(lifecycle.nextMove).toContain("offer");
    expect(lifecycle.dates).toEqual([]);
  });

  it("marks every step done for a closed project", () => {
    const lifecycle = getProjectLifecycle(epiData, "TPK125");
    expect(lifecycle.steps.every((step) => step.state === "done")).toBe(true);
    expect(lifecycle.nextMove).toBeNull();
    expect(lifecycle.dates.map((date) => date.label)).toContain("Start");
  });

  it("lists paid stages of a closed project and the collected share", () => {
    const schedule = getPaymentSchedule(epiData, "TPK125");
    expect(schedule.rows).toHaveLength(2);
    expect(schedule.rows.every((row) => row.statusLabel === "Paid")).toBe(true);
    expect(schedule.paidShare).toBe(1);
    expect(schedule.total).toBe(schedule.paid);
  });

  it("has no payment stage for a project still in offer", () => {
    expect(getPaymentSchedule(epiData, "NK0126").rows).toEqual([]);
  });

  it("gives every project something to show in each screen", () => {
    for (const project of epiData.projects) {
      const lifecycle = getProjectLifecycle(epiData, project.projectId);
      expect(lifecycle.steps).toHaveLength(8);
      expect(getRegisterSummary(epiData, project.projectId).total).toBeGreaterThan(0);
    }
  });

  it("summarises the evidence on file", () => {
    const summary = getRegisterSummary(epiData, "PNP126");
    expect(summary.signed + summary.notSigned).toBe(summary.total);
    expect(summary.latestDateLabel).not.toBeNull();
  });
});
