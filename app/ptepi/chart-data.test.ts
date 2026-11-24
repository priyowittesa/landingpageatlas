import { describe, expect, it } from "vitest";
import { epiData } from "./data";
import {
  getPortfolioHeadline,
  buildWaterfall,
  getCostChart,
  getCoverageChart,
  getDeficitByComponent,
  getEarningStageChart,
  getMarginBridge,
  getPlanActualDumbbell,
  getRevenueWaterfall,
  getSCurveChart,
  getValueByStatusChart,
  getWeeklyIncrements,
  ZERO_WEEK_MARKER_PTS
} from "./selectors";
import {
  buildSeedActions,
  getActionsByOwnerChart,
  getAgingBuckets,
  getAgingChart
} from "./store/action-helpers";

describe("S1 charts", () => {
  it("stacks contract value by status group and health, summing to the portfolio", () => {
    const chart = getValueByStatusChart(epiData);
    expect(chart.points.map((p) => p.statusGroup)).toEqual(["completed", "in-progress", "pipeline"]);
    expect(chart.points.reduce((a, p) => a + p.total, 0)).toBe(6_683_144_041);
    expect(chart.takeaway).toContain("at-risk projects");
    expect(chart.table.rows).toHaveLength(3);
    expect(chart.table.columns).toHaveLength(chart.table.rows[0]?.cells.length ?? 0);
  });

  it("ranks the in-progress projects by deviation, worst first, with a link to each", () => {
    const chart = getPlanActualDumbbell(epiData);
    expect(chart.points[0]).toMatchObject({ projectId: "PNP126", plan: 73.487, actual: 28.498, deviationPts: -44.989 });
    const deviations = chart.points.map((p) => p.deviationPts);
    expect([...deviations].sort((a, b) => a - b)).toEqual(deviations);
    expect(chart.points.length).toBeLessThanOrEqual(10);
    expect(chart.points.every((p) => p.gapSize >= 0 && p.gapStart === Math.min(p.plan, p.actual))).toBe(true);
    expect(chart.table.rows[0]?.href).toBe("/ptepi/project/PNP126");
    expect(chart.takeaway).toContain("PNP126 is furthest behind plan (-44,989 pts)");
  });

  it("limits the dumbbell to the number asked", () => {
    expect(getPlanActualDumbbell(epiData, 2).points).toHaveLength(2);
  });
});

describe("waterfall builder", () => {
  it("floats deltas from the running level and keeps totals on zero", () => {
    const steps = buildWaterfall([
      { label: "Start", value: 100, kind: "total" },
      { label: "Down", value: -30, kind: "delta" },
      { label: "Mid", value: 70, kind: "total" },
      { label: "Up", value: 10, kind: "delta" },
      { label: "End", value: 80, kind: "total" }
    ]);
    expect(steps.map((s) => [s.base, s.size, s.end, s.direction])).toEqual([
      [0, 100, 100, "total"],
      [70, 30, 70, "down"],
      [0, 70, 70, "total"],
      [70, 10, 80, "up"],
      [0, 80, 80, "total"]
    ]);
  });
});

describe("S2 charts", () => {
  const waterfall = getRevenueWaterfall(epiData, "PNP126");

  it("walks Kapasitor Bank from contract value to cash", () => {
    const totals = waterfall.steps.filter((s) => s.kind === "total");
    expect(totals.map((s) => s.label)).toEqual([
      "Contract value",
      "Earned with signed BA",
      "Accrued",
      "Billed",
      "Retensi 5% still to bill"
    ]);
    expect(totals.map((s) => s.value)).toEqual([1_080_000_000, 306_197_998, 307_778_400, 216_000_000, 54_000_000]);
  });

  it("hides the accrual gap under 1% of contract value and names it in the takeaway", () => {
    expect(waterfall.steps.some((s) => s.label === "Accrued above signed BA")).toBe(false);
    expect(waterfall.takeaway).toContain("Accrued above signed BA by Rp 1,6 m, under 1% of the contract value");
  });

  it("reconciles each delta with the total that follows it", () => {
    const steps = waterfall.steps;
    steps.forEach((step, index) => {
      const next = steps[index + 1];
      if (step.kind === "delta" && next) expect(step.end).toBe(next.value);
    });
  });

  it("states the earned share as the takeaway and has no chart for projects without an earning rule", () => {
    expect(waterfall.takeaway).toContain("earned with a signed BA");
    expect(getRevenueWaterfall(epiData, "GS125")).toMatchObject({ steps: [], takeaway: null });
  });

  it("splits each earning stage into earned, claimed without BA and not started", () => {
    const chart = getEarningStageChart(epiData, "PNP126");
    expect(chart.points).toHaveLength(5);
    expect(chart.points[1]).toMatchObject({ earned: 144_197_998, blocked: 17_802_002 });
    for (const point of chart.points) expect(point.earned + point.blocked + point.open).toBeGreaterThan(0);
    expect(chart.takeaway).toContain("claimed without a signed BA, in stage 2");
    expect(getEarningStageChart(epiData, "NK0126").takeaway).toBeNull();
  });
});

describe("S3 charts", () => {
  const curve = getSCurveChart(epiData, "PNP126");

  it("shades the gap to plan up to today and draws the required pace", () => {
    expect(curve.todayLabel).toBe("W18");
    expect(curve.requiredPace).toBeCloseTo(8.938, 3);
    const today = curve.points.find((p) => p.label === "W18");
    expect(today).toMatchObject({ plan: 73.487, actual: 28.498, gapBase: 28.498, gap: 44.989 });
    expect((today?.gapBase ?? 0) + (today?.gap ?? 0)).toBeCloseTo(today?.plan ?? 0, 3);
    expect(curve.points.find((p) => p.label === "W19")).toMatchObject({ actual: null, gap: null });
  });

  it("starts the pace line at today's actual and ends it at 100%", () => {
    expect(curve.points.find((p) => p.label === "W17")?.pace).toBeNull();
    expect(curve.points.find((p) => p.label === "W18")?.pace).toBeCloseTo(28.498, 3);
    expect(curve.points[curve.points.length - 1]?.pace).toBeCloseTo(100, 2);
  });

  it("has a computed takeaway and a table of every week", () => {
    expect(curve.takeaway).toContain("Week 18: -44,989 pts against plan");
    expect(curve.takeaway).toContain("8,9 points per week");
    expect(curve.table.rows).toHaveLength(26);
  });

  it("has no S-curve data for a pipeline project", () => {
    expect(getSCurveChart(epiData, "NK0126")).toMatchObject({ points: [], todayLabel: null, takeaway: null });
  });

  it("flags the weeks without progress: 15 to 18, while the level is flat since week 14", () => {
    const chart = getWeeklyIncrements(epiData, "PNP126");
    expect(chart.points).toHaveLength(18);
    expect(chart.points.find((p) => p.label === "W14")).toMatchObject({ gain: 1.56, zero: false });
    const zeroWeeks = chart.points.filter((p) => p.zero).map((p) => p.label);
    expect(zeroWeeks.slice(-4)).toEqual(["W15", "W16", "W17", "W18"]);
    expect(zeroWeeks).toContain("W2");
    expect(chart.points.find((p) => p.label === "W18")?.marker).toBe(ZERO_WEEK_MARKER_PTS);
    expect(chart.points.find((p) => p.label === "W13")?.marker).toBe(0);
    expect(chart.takeaway).toContain("No progress in weeks 14 to 18 (5 weeks)");
    expect(chart.takeaway).toContain("best week gained 11,1 points");
  });

  it("splits the deviation by work package: weight x (plan - actual)", () => {
    const chart = getDeficitByComponent(epiData, "PNP126");
    expect(chart.points[0]).toMatchObject({ label: "Panel SVGm", weight: 0.64115, deficitPts: 32.058 });
    expect(chart.points.map((p) => p.deficitPts)).toEqual([...chart.points.map((p) => p.deficitPts)].sort((a, b) => b - a));
    expect(chart.points.reduce((a, p) => a + p.deficitPts, 0)).toBeCloseTo(44.989, 2);
    expect(chart.points.reduce((a, p) => a + p.share, 0)).toBeCloseTo(1, 3);
    expect(chart.takeaway).toContain("Panel SVGm explains");
    expect(chart.takeaway).toContain("44,989 pts deficit");
  });
});

describe("S5 charts", () => {
  it("compares RAP with realised cost per category", () => {
    const chart = getCostChart(epiData, "PNP126");
    expect(chart.points.reduce((a, p) => a + p.cost, 0)).toBe(239_270_000);
    expect(chart.points.reduce((a, p) => a + p.rapPlanned, 0)).toBe(896_000_000);
    expect(chart.takeaway).toContain("categories are over RAP");
  });

  it("bridges recognised revenue to profit through the cost categories", () => {
    const bridge = getMarginBridge(epiData, "PNP126");
    const first = bridge.steps[0];
    const last = bridge.steps[bridge.steps.length - 1];
    expect(first).toMatchObject({ label: "Recognised revenue", value: 307_778_400 });
    expect(last).toMatchObject({ label: "Profit to date", value: 68_508_400 });
    const deltas = bridge.steps.filter((s) => s.kind === "delta");
    expect(deltas.reduce((a, s) => a + s.value, 0)).toBe(-239_270_000);
    expect(bridge.steps[bridge.steps.length - 2]?.end).toBe(last?.value);
    expect(bridge.takeaway).toContain("margin of 22,26%");
  });

  it("has no bridge for a project without recognised revenue", () => {
    expect(getMarginBridge(epiData, "NK0126")).toMatchObject({ steps: [], takeaway: null });
  });
});

describe("S6 chart", () => {
  it("splits inspections into done, due and overdue per contract", () => {
    const chart = getCoverageChart(epiData);
    expect(chart.points.map((p) => p.contractId).sort()).toEqual(["IKT0126", "PTP1025", "TPK0226"]);
    expect(chart.takeaway).toContain("88,17% of required inspections are done");
    expect(chart.takeaway).toContain("IKT0126 is lowest");
    expect(chart.table.columns).toContain("Due (scheduled)");
  });
});

describe("S8 charts", () => {
  const seeds = buildSeedActions(epiData);

  it("counts unfinished actions by owner role, split by status", () => {
    const chart = getActionsByOwnerChart(seeds);
    expect(chart.points[0]).toMatchObject({ ownerRole: "Finance", open: 4, inProgress: 0, total: 4 });
    expect(chart.points.reduce((a, p) => a + p.total, 0)).toBe(12);
    expect(chart.takeaway).toBe("Finance holds the most unfinished actions: 4 of 12.");
  });

  it("leaves finished actions out and counts in-progress ones separately", () => {
    const list = seeds.map((a, i) => (i === 0 ? { ...a, status: "done" as const } : i === 1 ? { ...a, status: "in-progress" as const } : a));
    const chart = getActionsByOwnerChart(list);
    expect(chart.points.reduce((a, p) => a + p.total, 0)).toBe(11);
    expect(chart.points.reduce((a, p) => a + p.inProgress, 0)).toBe(1);
  });

  it("groups unfinished actions by days to the due date", () => {
    const buckets = getAgingBuckets(seeds, epiData.asAt);
    expect(buckets.map((b) => b.id)).toEqual(["overdue", "week", "two-weeks", "later"]);
    expect(buckets.map((b) => b.count)).toEqual([0, 6, 6, 0]);
    const late = getAgingBuckets(seeds, "2026-12-01");
    expect(late[0]?.count).toBe(12);
    expect(getAgingChart(seeds, epiData.asAt).takeaway).toBe("0 of 12 unfinished actions are overdue; 6 fall due within 7 days.");
  });
});

describe("S1 hero headline", () => {
  it("counts the projects at risk and the value in them", () => {
    const hero = getPortfolioHeadline(epiData);
    expect(hero).toMatchObject({ total: 16, atRisk: 3, watch: 7, onTrack: 6, atRiskValue: 1_758_000_000 });
    expect(hero.headline).toBe("3 of 16 projects are at risk");
    expect(hero.detail).toBe("7 more are on watch. Rp 1.758,0 m (26,3%) of the portfolio value sits in at-risk projects.");
  });

  it("says so when nothing is at risk", () => {
    const changed = structuredClone(epiData);
    changed.progressWeekly = changed.progressWeekly.filter((r) => r.projectId !== "PNP126" && r.projectId !== "PSL0126");
    changed.paymentStages = changed.paymentStages.filter((p) => p.projectId !== "PTP1125");
    expect(getPortfolioHeadline(changed).atRisk).toBeLessThan(3);
  });
});

describe("round value-axis ticks", () => {
  it("rounds the max up to a round step", async () => {
    const { niceTicks } = await import("./components/charts/formatters");
    expect(niceTicks(93)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(13)).toEqual([0, 5, 10, 15]);
    expect(niceTicks(0)).toEqual([0, 1]);
  });
});
