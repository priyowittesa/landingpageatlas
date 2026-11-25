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

describe("no-progress wording", () => {
  it("derives weeks 14 to 18 (5 weeks) for PNP126 from progressWeekly", async () => {
    const { getNoProgressPeriod, getSCurveChart } = await import("./selectors");
    const { formatPace } = await import("./format");
    expect(getNoProgressPeriod(epiData, "PNP126")).toEqual({
      fromWeek: 14,
      toWeek: 18,
      weeks: 5,
      label: "weeks 14 to 18 (5 weeks)"
    });
    expect(formatPace(0)).toBe("0 pts");
    const takeaway = getSCurveChart(epiData, "PNP126").takeaway ?? "";
    expect(takeaway).not.toContain("averaged");
    expect(takeaway).toContain("8,9 points per week");
  });
});

describe("S5 vendor advances", () => {
  it("keeps the PNP126 margin at 22,26% and shows advances paid without an SES", async () => {
    const { getCostMargin, getVendorAdvances } = await import("./selectors");
    const { getMetric } = await import("./metrics");
    const money = getCostMargin(epiData, "PNP126");
    expect(money.cost).toBe(239_270_000);
    expect(Math.round((money.margin ?? 0) * 10000) / 100).toBe(22.26);
    expect(getVendorAdvances(epiData, "PNP126")).toBe(204_600_000);
    expect(money.vendorAdvances).toBe(204_600_000);
    expect(Math.round((money.advancesShareOfCost ?? 0) * 1000) / 10).toBe(85.5);
    expect(getMetric("advancesNoSes").label).toBe("Advances paid, SES not yet issued");
    expect(getMetric("advancesNoSes").formula).toContain("Not a margin");
  });
});

describe("Nexa Intelligence context panel", () => {
  it("shows the governed portfolio figures", async () => {
    const { getNexaContext } = await import("./selectors");
    const context = getNexaContext(epiData);
    expect(context.map((kpi) => kpi.label)).toEqual([
      "Portfolio value",
      "Projects at risk",
      "Blocked from billing",
      "Retensi held",
      "PNP126 deviation"
    ]);
    expect(context[0]?.value).toBe("Rp 6.683,1 m");
    expect(context[2]?.value).toBe("Rp 752,5 m");
    expect(context[3]?.value).toBe("Rp 37,9 m");
    expect(context[4]?.value).toBe("-44,989 pts");
  });
});
