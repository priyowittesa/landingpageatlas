import { describe, expect, it } from "vitest";
import { epiData } from "./data";
import {
  getBastGate,
  getOverRapProjects,
  getContractOptions,
  filterInspectionRows,
  filterScopeRows,
  getCoverageByContract,
  getNextInspections,
  getServiceInspectionRows,
  getServiceScopeRows,
  getServiceSummary,
  getCostByCategory,
  getCostCategoryOptions,
  getCostLineRows,
  getCostPortfolio,
  getProjectCostView,
  addDays,
  expectedSignerFor,
  getEvidenceStages,
  getEvidenceSummary,
  getProjectRegister,
  getSuggestedAction,
  getCostMargin,
  getCriticalItem,
  getProjectExceptionItems,
  getProjectInfo,
  getRecoveryRate,
  getSCurve,
  getWeekCard,
  getWeightBreakdown,
  hasProject,
  filterBillingRows,
  filterPortfolioRows,
  getAttentionGroups,
  getBilled,
  getBilledByType,
  getBillingRows,
  getBillingSummary,
  getEarningStages,
  getRevenueBreakdown,
  getRevenueChart,
  getRevenueTotals,
  getPortfolioRows,
  getPortfolioTotals,
  getProjectHealth,
  getProjectProgress,
  getRecognisedRevenue,
  getValueByStatus,
  sortPortfolioRows
} from "./selectors";
import { ATTACHMENT_NOTES } from "./labels";
import { formatPercent, formatPoints, formatRupiah, formatRupiahMillions } from "./format";

const healthOf = (id: string) => getProjectHealth(epiData, id).rating;

describe("portfolio totals", () => {
  const totals = getPortfolioTotals(epiData);

  it("has 16 projects across 8 customers", () => {
    expect(totals.projectCount).toBe(16);
    expect(totals.customerCount).toBe(8);
  });

  it("sums the contract value to Rp 6.683.144.041", () => {
    expect(totals.contractValue).toBe(6_683_144_041);
  });

  it("reconciles recognised revenue and billing with the workbook summary", () => {
    expect(totals.recognisedRevenue).toBe(3_703_064_856);
    expect(totals.billed).toBe(3_002_238_030);
    expect(totals.unbilled).toBe(700_826_826);
  });

  it("counts projects with detected exceptions", () => {
    expect(epiData.seededExceptions).toHaveLength(12);
    expect(totals.projectsWithExceptions).toBe(8);
  });
});

describe("PNP126 progress", () => {
  it("shows plan 73,487 / actual 28,498 / deviation -44,989", () => {
    const progress = getProjectProgress(epiData, "PNP126");
    expect(progress.plan).toBeCloseTo(0.73487, 6);
    expect(progress.actual).toBeCloseTo(0.28498, 6);
    expect(progress.deviationPts).toBe(-44.989);
    expect(formatPercent(progress.plan ?? 0)).toBe("73,487%");
    expect(formatPercent(progress.actual ?? 0)).toBe("28,498%");
    expect(formatPoints(progress.deviationPts ?? 0)).toBe("-44,989 pts");
  });

  it("recognises revenue on measured progress", () => {
    expect(getRecognisedRevenue(epiData, "PNP126")).toBe(307_778_400);
    expect(getBilled(epiData, "PNP126")).toBe(216_000_000);
  });

  it("has no progress for pipeline projects", () => {
    expect(getProjectProgress(epiData, "JICT0326")).toEqual({
      plan: null,
      actual: null,
      deviationPts: null
    });
  });
});

describe("health rating", () => {
  it("marks exactly PNP126, PSL0126 and PTP1125 as at risk", () => {
    const atRisk = epiData.projects
      .filter((p) => healthOf(p.projectId) === "at-risk")
      .map((p) => p.projectId)
      .sort();
    expect(atRisk).toEqual(["PNP126", "PSL0126", "PTP1125"]);
  });

  it("explains PNP126 with the schedule deviation", () => {
    const health = getProjectHealth(epiData, "PNP126");
    expect(health.reason).toContain("Schedule deviation -44,989 pts");
    expect(health.signals[0]?.code).toBe("schedule-deviation");
  });

  it("puts the other exception projects and projects 10+ points behind plan on watch", () => {
    for (const id of ["PSL0326", "PTP1025", "IKT0126", "PSL0426", "TPK125", "PTP1425", "PSL0226"]) {
      expect(healthOf(id)).toBe("watch");
    }
  });

  it("keeps clean projects on track", () => {
    for (const id of ["GS125", "PTP125", "TPK0226", "JICT0326", "GS0326", "NK0126"]) {
      expect(healthOf(id)).toBe("on-track");
    }
  });
});

describe("portfolio rows", () => {
  const rows = getPortfolioRows(epiData);

  it("flags deviation worse than 10 points", () => {
    const alerts = rows.filter((row) => row.deviationAlert).map((r) => r.projectId);
    expect(alerts).toContain("PNP126");
  });

  it("filters by customer, status group, health and search", () => {
    const base = { search: "", customer: "all", statusGroup: "all", health: "all" };
    expect(filterPortfolioRows(rows, { ...base, health: "at-risk" })).toHaveLength(3);
    expect(filterPortfolioRows(rows, { ...base, statusGroup: "pipeline" })).toHaveLength(3);
    expect(filterPortfolioRows(rows, { ...base, customer: "PSL" }).length).toBeGreaterThan(1);
    expect(filterPortfolioRows(rows, { ...base, search: "pnp126" })).toHaveLength(1);
  });

  it("sorts by deviation with missing values last", () => {
    const sorted = sortPortfolioRows(rows, "deviation", "asc");
    expect(sorted[0]?.projectId).toBe("PNP126");
    expect(sorted[sorted.length - 1]?.deviationPts).toBeNull();
  });
});

describe("attention panel and chart", () => {
  it("groups the 12 seeded exceptions by severity", () => {
    const groups = getAttentionGroups(epiData);
    expect(groups.map((g) => g.severity)).toEqual(["high", "medium"]);
    expect(groups.flatMap((g) => g.items)).toHaveLength(12);
    expect(groups[0]?.items.every((i) => ["PNP126", "PSL0126", "PTP1125"].includes(i.projectId))).toBe(true);
  });

  it("splits contract value by status group and health", () => {
    const points = getValueByStatus(epiData);
    expect(points.map((p) => p.statusGroup)).toEqual(["completed", "in-progress", "pipeline"]);
    expect(points.reduce((total, p) => total + p.total, 0)).toBe(6_683_144_041);
    for (const p of points) expect(p.onTrack + p.watch + p.atRisk).toBe(p.total);
  });
});

describe("formatters", () => {
  it("formats Rupiah with dot thousands", () => {
    expect(formatRupiah(1_234_567)).toBe("Rp 1.234.567");
    expect(formatRupiahMillions(6_683_144_041)).toBe("Rp 6.683,1 m");
  });
});

describe("S2 revenue", () => {
  it("accrued this year reconciles with the DATA MASTER 2026 revenue (Rp 2.868.788.702)", () => {
    expect(getRevenueTotals(epiData).accruedThisYear).toBe(2_868_788_702);
  });

  it("splits PNP126 into accrued, estimate not yet accrued and spill", () => {
    expect(getRevenueBreakdown(epiData, "PNP126")).toEqual({
      accruedPrevYears: 0,
      accruedThisYear: 307_778_400,
      estimateThisYear: 1_073_325_600,
      estimateRemaining: 765_547_200,
      spillNextYear: 6_674_400
    });
    expect(getRevenueTotals(epiData).spillNextYear).toBe(6_674_400);
  });

  it("has no revenue for pipeline projects", () => {
    expect(getRevenueBreakdown(epiData, "NK0126").accruedThisYear).toBe(0);
  });

  it("charts only projects with revenue and matches the totals", () => {
    const chart = getRevenueChart(epiData);
    expect(chart.some((p) => p.projectId === "NK0126")).toBe(false);
    const totals = getRevenueTotals(epiData);
    expect(chart.reduce((a, p) => a + p.accrued, 0)).toBe(totals.accruedThisYear);
    expect(chart.reduce((a, p) => a + p.estimateRemaining, 0)).toBe(totals.estimateRemaining);
  });
});

describe("S2 billing", () => {
  it("splits invoiced Tagihan so termin + 95% + Retensi equals total billed", () => {
    const byType = getBilledByType(epiData);
    expect(byType.termin + byType.ninetyFive + byType.retention).toBe(
      getPortfolioTotals(epiData).billed
    );
    expect(byType.ninetyFive).toBe(439_430_100);
  });

  const rows = getBillingRows(epiData);

  it("lists only unpaid stages and sums readiness to the unpaid amount", () => {
    const summary = getBillingSummary(rows);
    const open = epiData.paymentStages.filter((s) => s.paidDate === null);
    expect(rows).toHaveLength(open.length);
    const total = Object.values(summary).reduce((a, s) => a + s.amount, 0);
    expect(total).toBe(open.reduce((a, s) => a + s.amount, 0));
    expect(summary.blocked.count).toBe(4);
    expect(summary.blocked.amount).toBe(752_450_564);
    expect(summary.billable.amount).toBe(0);
    expect(summary["awaiting-bast"]).toEqual({ count: 2, amount: 37_854_903 });
  });

  it("blocks PTP1125 on the unsigned BAST I and IKT0126 on the draft monthly BAs", () => {
    const blocked = rows.filter((r) => r.readiness === "blocked");
    expect(blocked.map((r) => r.projectId).sort()).toEqual(["IKT0126", "IKT0126", "PNP126", "PTP1125"]);
    expect(blocked.find((r) => r.projectId === "PTP1125")?.reason).toBe("BAST I still draft, not signed");
    expect(blocked.find((r) => r.projectId === "PNP126")?.reason).toBe(
      "Progress 28,498% below the 50% condition"
    );
  });

  it("keeps a due Retensi without a signed BAST II out of Billable now", () => {
    const retention = rows.find((r) => r.projectId === "PTP1025" && r.stageType === "Retensi 5%");
    expect(retention?.readiness).toBe("awaiting-bast");
    expect(retention?.docStatus).toBe("missing");
    expect(retention?.reason).toBe("BAST II not in the register");
    expect(rows.filter((r) => r.readiness === "billable")).toEqual([]);
  });

  it("counts a stage as billable only when the BA is signed and the condition is met", () => {
    const signedBast2 = {
      ...epiData,
      baRegister: [
        ...epiData.baRegister,
        { ...epiData.baRegister[0], baId: "BA-TEST", projectId: "PTP1025", documentType: "BAST II", status: "Signed" }
      ]
    };
    const row = getBillingRows(signedBast2).find((r) => r.projectId === "PTP1025" && r.stageType === "Retensi 5%");
    expect(row?.readiness).toBe("billable");
  });

  it("uses the same rule for S1 Retensi held", () => {
    const awaiting = rows.filter((r) => r.readiness === "awaiting-bast").reduce((a, r) => a + r.amount, 0);
    expect(getPortfolioTotals(epiData).retentionHeld).toBe(awaiting);
    expect(awaiting).toBe(37_854_903);
  });

  it("filters by customer, payment type and readiness", () => {
    const base = { customer: "all", stageType: "all", readiness: "all" };
    expect(filterBillingRows(rows, { ...base, readiness: "blocked" })).toHaveLength(4);
    expect(filterBillingRows(rows, { ...base, customer: "IKT" }).every((r) => r.customer === "IKT")).toBe(true);
    expect(
      filterBillingRows(rows, { ...base, stageType: "Retensi 5%" }).every((r) => r.stageType === "Retensi 5%")
    ).toBe(true);
  });
});

describe("S2 earning rule 15/15/30/30/10", () => {
  const stages = getEarningStages(epiData, "PNP126");

  it("applies the weights to the contract value", () => {
    expect(stages.map((s) => s.weight)).toEqual([0.15, 0.15, 0.3, 0.3, 0.1]);
    expect(stages.reduce((a, s) => a + s.stageValue, 0)).toBe(1_080_000_000);
    expect(stages[4]?.stageValue).toBe(108_000_000);
  });

  it("earns Approval Material and blocks Confirmation Order on the draft transformer PO", () => {
    expect(stages[0]?.status).toBe("earned");
    expect(stages[0]?.signedCount).toBe(5);
    expect(stages[1]?.status).toBe("blocked");
    expect(stages[1]?.signedCount).toBe(4);
    expect(stages[1]?.blockedValue).toBeGreaterThan(0);
    expect((stages[1]?.earnedValue ?? 0) + (stages[1]?.blockedValue ?? 0)).toBe(stages[1]?.stageValue);
  });

  it("leaves MOS, Installation and Testing pending", () => {
    expect(stages.slice(2).map((s) => s.status)).toEqual(["not-started", "not-started", "not-started"]);
  });

  it("has no component schedule for other projects", () => {
    expect(getEarningStages(epiData, "GS125")).toEqual([]);
  });
});

describe("S3 project cockpit", () => {
  it("describes the hero project", () => {
    const info = getProjectInfo(epiData, "PNP126");
    expect(info.customer).toBe("PT PNP");
    expect(info.contractNumber).toContain("0120/SR/ENG/PNP/V/2026");
    expect(info.contractValue).toBe(1_080_000_000);
    expect(info.startDate).toBe("2026-07-07");
    expect(info.endDate).toBe("2027-01-02");
    expect(info.stageLabel).toBe("In progress, critical");
    expect(info.health.rating).toBe("at-risk");
    expect(info.progressOrigin).toBe("real");
    expect(getProjectInfo(epiData, "GS125").progressOrigin).toBe("synthetic");
  });

  it("builds the 26-week S-curve and stops the actual line at the as-at date", () => {
    const curve = getSCurve(epiData, "PNP126");
    expect(curve).toHaveLength(26);
    expect(curve[17]).toEqual({ weekNo: 18, label: "W18", plan: 73.487, actual: 28.498 });
    expect(curve[18]?.actual).toBeNull();
    expect(curve[25]?.plan).toBe(100);
    expect(getSCurve(epiData, "NK0126")).toEqual([]);
  });

  it("shows week 18: plan 73,487 / actual 28,498 / deviation -44,989", () => {
    const week = getWeekCard(epiData, "PNP126");
    expect(week?.weekNo).toBe(18);
    expect(week?.weekStart).toBe("2026-11-02");
    expect(week?.weekEnd).toBe("2026-11-08");
    expect(week?.plan).toBeCloseTo(0.73487, 6);
    expect(week?.actual).toBeCloseTo(0.28498, 6);
    expect(week?.deviationPts).toBe(-44.989);
    expect(week?.gainPts).toBe(0);
    expect(getWeekCard(epiData, "NK0126")).toBeNull();
  });

  it("lists the component weights, heaviest first", () => {
    const rows = getWeightBreakdown(epiData, "PNP126");
    expect(rows.map((r) => r.weight)).toEqual([0.64115, 0.10989, 0.09094, 0.08945, 0.06858]);
    expect(rows.map((r) => r.label)).toEqual([
      "Panel SVGm",
      "Power Transformer",
      "Other Works",
      "20 kV Substation",
      "Panel LVMDP"
    ]);
    expect(getWeightBreakdown(epiData, "GS125")).toEqual([]);
  });

  it("computes the recovery rate: 71,50 points in 8 weeks, about 8,9 per week", () => {
    const recovery = getRecoveryRate(epiData, "PNP126");
    expect(recovery?.remainingPts).toBe(71.502);
    expect(recovery?.weeksRemaining).toBe(8);
    expect(recovery?.requiredPerWeek).toBeCloseTo(8.938, 3);
    expect(recovery?.bestPerWeek).toBe(11.135);
    expect(recovery?.ratioToBest).toBeCloseTo(0.803, 3);
    expect(recovery?.recentPerWeek).toBe(0);
  });

  it("flags the flat weeks 14 to 18", () => {
    const recovery = getRecoveryRate(epiData, "PNP126");
    expect(recovery?.flatWeeks).toBe(5);
    expect(recovery?.flatFromWeek).toBe(14);
    expect(recovery?.flatToWeek).toBe(18);
  });

  it("has no recovery rate for complete or pipeline projects", () => {
    expect(getRecoveryRate(epiData, "GS125")).toBeNull();
    expect(getRecoveryRate(epiData, "NK0126")).toBeNull();
  });

  it("computes cost and margin: Rp 239.270.000 and 22,26%", () => {
    const money = getCostMargin(epiData, "PNP126");
    expect(money.cost).toBe(239_270_000);
    expect(money.recognisedRevenue).toBe(307_778_400);
    expect(money.margin).toBeCloseTo(0.22259, 5);
    expect(formatPercent(money.margin ?? 0, 2)).toBe("22,26%");
    expect(getCostMargin(epiData, "PSL0126").rapRemaining).toBe(-47_000_000);
    expect(getCostMargin(epiData, "NK0126").margin).toBeNull();
  });

  it("flags the SVGm panels as the critical item", () => {
    const item = getCriticalItem(epiData, "PNP126");
    expect(item?.label).toBe("Panel SVGm");
    expect(item?.weight).toBe(0.64115);
    expect(item?.behindPts).toBe(32.058);
    expect(item?.claimedStage).toBe("Confirmation Order");
    expect(getCriticalItem(epiData, "GS125")).toBeNull();
  });

  it("lists the seeded exceptions of a project with English labels", () => {
    const items = getProjectExceptionItems(epiData, "PNP126");
    expect(items.map((i) => i.exceptionNo)).toEqual([1, 2, 3, 4]);
    expect(items.every((i) => i.severity === "high")).toBe(true);
    expect(items[0]?.label).toBe("Plan vs actual deviation of more than 10 points");
    expect(getProjectExceptionItems(epiData, "JICT0326")).toEqual([]);
  });

  it("builds every selector for all 16 projects without crashing", () => {
    for (const project of epiData.projects) {
      const id = project.projectId;
      expect(hasProject(epiData, id)).toBe(true);
      expect(() => {
        getProjectInfo(epiData, id);
        getSCurve(epiData, id);
        getWeekCard(epiData, id);
        getWeightBreakdown(epiData, id);
        getRecoveryRate(epiData, id);
        getCostMargin(epiData, id);
        getCriticalItem(epiData, id);
        getProjectExceptionItems(epiData, id);
      }).not.toThrow();
    }
    expect(hasProject(epiData, "NOPE")).toBe(false);
  });
});

describe("S4 evidence gate", () => {
  const stages = getEvidenceStages(epiData, "PNP126");

  it("has the five earning stages with the 15/15/30/30/10 weights", () => {
    expect(stages.map((s) => s.stageNo)).toEqual([1, 2, 3, 4, 5]);
    expect(stages.map((s) => s.weight)).toEqual([0.15, 0.15, 0.3, 0.3, 0.1]);
    expect(stages.reduce((a, s) => a + s.stageValue, 0)).toBe(1_080_000_000);
    expect(stages[0]?.expectedSigner).toBe("Customer Engineering Manager");
  });

  it("lets Approval Material earn: every component has a signed BA", () => {
    const stage = stages[0];
    expect(stage?.status).toBe("earned");
    expect(stage?.gate.result).toBe("can-earn");
    expect(stage?.units.every((u) => u.status === "earned")).toBe(true);
    expect(stage?.signedDate).toBe("2026-09-17");
  });

  it("blocks Confirmation Order on the draft transformer PO", () => {
    const stage = stages[1];
    expect(stage?.status).toBe("blocked");
    expect(stage?.gate.result).toBe("blocked");
    expect(stage?.signedDate).toBeNull();
    expect(stage?.gate.reason).toBe(
      "Power Transformer: PO Vendor (Confirmation Order) still draft, not signed"
    );
    const draft = stage?.units.find((u) => u.unit === "Power Transformer");
    expect(draft?.baId).toBe("BA-PNP126-15");
    expect(draft?.status).toBe("blocked");
    expect(stage?.blockedValue).toBe(17_802_002);
  });

  it("leaves the later stages not started: nothing is claimed and no BA exists", () => {
    for (const stage of stages.slice(2)) {
      expect(stage.status).toBe("not-started");
      expect(stage.signedDate).toBeNull();
      expect(stage.gate.result).toBe("blocked");
      expect(stage.gate.reason).toContain("Not started");
      expect(stage.blockedValue).toBe(0);
    }
    expect(stages[4]?.additionalRequirement).toContain("RLB");
  });

  it("summarises the gate", () => {
    expect(getEvidenceSummary(stages)).toEqual({
      canEarn: 1,
      blocked: 1,
      claimedWithoutBa: 1,
      blockedValue: 17_802_002,
      notStarted: 3
    });
  });

  it("blocks a stage when the BA is signed by the wrong customer role", () => {
    const changed = structuredClone(epiData);
    const ba = changed.baRegister.find((b) => b.baId === "BA-PNP126-06");
    if (ba) ba.customerSignatoryRole = "Kadiv Operasional PT PNP";
    const stage = getEvidenceStages(changed, "PNP126")[0];
    expect(stage?.gate.result).toBe("blocked");
    expect(stage?.gate.reason).toContain("Panel SVGm: Signed by Kadiv Operasional PT PNP, expected Engineering Manager");
  });

  it("blocks a stage when a claimed BA is missing from the register", () => {
    const changed = structuredClone(epiData);
    changed.baRegister = changed.baRegister.filter((b) => b.baId !== "BA-PNP126-09");
    const stage = getEvidenceStages(changed, "PNP126")[1];
    expect(stage?.gate.reason).toContain("Panel SVGm: PO Vendor (Confirmation Order) not in the register");
  });

  it("has no stage tracker for projects without a component schedule", () => {
    expect(getEvidenceStages(epiData, "PTP1125")).toEqual([]);
    expect(getEvidenceStages(epiData, "NK0126")).toEqual([]);
  });

  it("suggests an urgent action for a claimed stage and a later one for a pending stage", () => {
    const urgent = getSuggestedAction(epiData, "PNP126", stages[1]!);
    expect(urgent).toEqual({
      title: "Get PO Vendor (Confirmation Order) signed: Power Transformer (PNP126)",
      projectId: "PNP126",
      ownerRole: "Project Manager",
      dueDate: "2026-11-15",
      source: "Evidence gate: PNP126 stage 2",
      autonomy: "L1",
      issue: "evidence-stage-2"
    });
    const later = getSuggestedAction(epiData, "PNP126", stages[2]!);
    expect(later.title).toBe("Prepare BA Material On Site for Material On Site (MOS) (PNP126)");
    expect(later.dueDate).toBe("2026-11-22");
  });

  it("adds days to an ISO date", () => {
    expect(addDays("2026-11-08", 7)).toBe("2026-11-15");
    expect(addDays("2026-12-28", 7)).toBe("2027-01-04");
  });

  it("names the customer role that signs each document type", () => {
    expect(expectedSignerFor("BAST I")).toBe("Customer President Director");
    expect(expectedSignerFor("Payment BA")).toBe("Customer President Director");
    expect(expectedSignerFor("BA Approval Material")).toBe("Customer Engineering Manager");
    expect(expectedSignerFor("BAMK")).toBe("Customer authorised official");
    expect(expectedSignerFor(null)).toBeNull();
  });

  it("puts the signer on the billing rows", () => {
    const rows = getBillingRows(epiData);
    expect(rows.find((r) => r.projectId === "PTP1125")?.expectedSigner).toBe("Customer President Director");
    expect(rows.find((r) => r.projectId === "IKT0126" && r.readiness === "blocked")?.expectedSigner).toBe(
      "Customer Engineering Manager"
    );
  });

  it("lists the full BA register of a project and tags the real documents", () => {
    const register = getProjectRegister(epiData, "PNP126");
    expect(register).toHaveLength(17);
    const container = register.find((r) => r.baId === "BA-PNP126-10");
    expect(container?.documentNo).toBe("Approval Kontainer 40 Feet R1");
    expect(container?.dataOrigin).toBe("real");
    expect(register.find((r) => r.baId === "BA-PNP126-15")?.status).toBe("Draft");
    expect(ATTACHMENT_NOTES["BA-PNP126-10"]?.findings.length).toBeGreaterThan(0);
  });

  it("builds a gate for every project without crashing", () => {
    for (const project of epiData.projects) {
      expect(() => {
        getEvidenceStages(epiData, project.projectId);
        getProjectRegister(epiData, project.projectId);
      }).not.toThrow();
    }
  });
});

describe("S5 procurement and cost", () => {
  it("totals PNP126 exactly: cost Rp 239.270.000 and margin 22,26%", () => {
    const view = getProjectCostView(epiData, "PNP126");
    expect(view.customer).toBe("PT PNP");
    expect(view.margin.cost).toBe(239_270_000);
    expect(view.margin.contractValue).toBe(1_080_000_000);
    expect(view.margin.recognisedRevenue).toBe(307_778_400);
    expect(view.margin.profit).toBe(68_508_400);
    expect(formatPercent(view.margin.margin ?? 0, 2)).toBe("22,26%");
    expect(view.lines).toHaveLength(9);
    expect(view.lines.reduce((a, l) => a + l.amount, 0)).toBe(239_270_000);
  });

  it("shows the margin the RAP promises: contract Rp 1.080 m against RAP Rp 896 m", () => {
    const margin = getCostMargin(epiData, "PNP126");
    expect(margin.rapPlanned).toBe(896_000_000);
    expect(margin.plannedMargin).toBeCloseTo(0.17037, 5);
    expect(getCostMargin(epiData, "NK0126").plannedMargin).not.toBeNull();
  });

  it("compares the RAP budget with the cost lines per category", () => {
    const categories = getCostByCategory(epiData, "PNP126");
    expect(categories.map((c) => c.category)).toEqual([
      "Material",
      "Subcontract services",
      "Labour",
      "Overhead and permits",
      "Equipment rental",
      "Operations and petty cash"
    ]);
    const material = categories.find((c) => c.category === "Material");
    expect(material).toEqual({ category: "Material", rapPlanned: 812_000_000, cost: 204_600_000 });
    expect(categories.find((c) => c.category === "Labour")?.cost).toBe(0);
    expect(categories.reduce((a, c) => a + c.cost, 0)).toBe(239_270_000);
    expect(categories.reduce((a, c) => a + c.rapPlanned, 0)).toBe(896_000_000);
  });

  it("reconciles the cost lines with RAP_BUDGET for every project and category", () => {
    for (const project of epiData.projects) {
      for (const point of getCostByCategory(epiData, project.projectId)) {
        const row = epiData.rapBudget.find(
          (r) => r.projectId === project.projectId && r.rapCategory === point.category
        );
        expect(point.cost).toBe(row?.costActual ?? point.cost);
      }
    }
  });

  it("reconciles the portfolio with the workbook summary", () => {
    const portfolio = getCostPortfolio(epiData);
    expect(portfolio.cost).toBe(2_781_485_245);
    expect(portfolio.recognisedRevenue).toBe(3_703_064_856);
    expect(portfolio.margin).toBeCloseTo(0.24887, 5);
    expect(formatPercent(portfolio.margin ?? 0, 2)).toBe("24,89%");
    expect(portfolio.rapPlanned).toBe(5_083_000_000);
    expect(portfolio.overRapProjects).toBe(3);
    const over = epiData.projects
      .filter((p) => getCostMargin(epiData, p.projectId).rapRemaining < 0)
      .map((p) => p.projectId)
      .sort();
    expect(over).toEqual(["PSL0126", "PTP1125", "TPK125"]);
  });

  it("maps the columns of a PL cost line and its payment status", () => {
    const line = getCostLineRows(epiData, "PNP126").find((l) => l.lineNo === 2);
    expect(line).toMatchObject({
      item: "Engineering, drawing approval and master schedule",
      executor: "PT Sinar Teknik Mandiri",
      method: "PL",
      prNo: "1100004114",
      poNo: "8600000514",
      sesNo: "5105662175",
      advanceNo: null,
      transactionDate: "2026-07-20",
      paymentStatus: "Posted",
      sapDocNo: "5000000717",
      category: "Subcontract services"
    });
    expect(line?.flags).toEqual([]);
  });

  it("flags vendor advances paid before the SES exists", () => {
    const line = getCostLineRows(epiData, "PNP126").find((l) => l.lineNo === 4);
    expect(line?.advanceNo).toBe("1300000265");
    expect(line?.flags.map((f) => f.code)).toEqual(["advance-without-ses"]);
    expect(line?.flags[0]?.severity).toBe("watch");
  });

  it("flags lines not posted in SAP", () => {
    const tpk = getCostLineRows(epiData, "TPK0226").find((l) => l.lineNo === 10);
    expect(tpk?.paymentStatus).toBe("Not posted");
    expect(tpk?.flags.map((f) => f.code)).toEqual(["not-posted"]);
    const petty = getCostLineRows(epiData, "NK0126")[0];
    expect(petty?.flags.map((f) => f.code)).toEqual(["petty-cash-open"]);
  });

  it("counts the flagged lines of the portfolio", () => {
    const portfolio = getCostPortfolio(epiData);
    expect(portfolio.flaggedLines).toBe(9);
    expect(portfolio.flaggedProjects).toBe(4);
  });

  it("flags a line missing its PO, and a posted line missing its documents as high", () => {
    const changed = structuredClone(epiData);
    const target = changed.costLines.find((l) => l.projectId === "PNP126" && l.lineNo === 2);
    if (target) target.poNo = null;
    const noPo = getCostLineRows(changed, "PNP126").find((l) => l.lineNo === 2);
    expect(noPo?.flags).toEqual([
      { code: "paid-without-document", severity: "high", label: "Paid without PR or PO" }
    ]);

    const unposted = structuredClone(epiData);
    const line = unposted.costLines.find((l) => l.projectId === "PNP126" && l.lineNo === 2);
    if (line) {
      line.poNo = null;
      line.sapDocNo = null;
      line.postingDate = null;
    }
    expect(
      getCostLineRows(unposted, "PNP126")
        .find((l) => l.lineNo === 2)
        ?.flags.map((f) => f.code)
    ).toEqual(["missing-po", "not-posted"]);
  });

  it("flags a posted line without SES and without an advance as high", () => {
    const changed = structuredClone(epiData);
    const target = changed.costLines.find((l) => l.projectId === "PNP126" && l.lineNo === 2);
    if (target) target.sesNo = null;
    const row = getCostLineRows(changed, "PNP126").find((l) => l.lineNo === 2);
    expect(row?.flags).toEqual([
      { code: "paid-without-document", severity: "high", label: "Paid without SES" }
    ]);
  });

  it("lists the category options of a project and builds a view for every project", () => {
    const view = getProjectCostView(epiData, "PNP126");
    expect(getCostCategoryOptions(view.lines)).toEqual([
      "Equipment rental",
      "Material",
      "Operations and petty cash",
      "Overhead and permits",
      "Subcontract services"
    ]);
    for (const project of epiData.projects) {
      expect(() => getProjectCostView(epiData, project.projectId)).not.toThrow();
    }
  });
});

describe("S6 service contracts", () => {
  const scope = getServiceScopeRows(epiData);
  const inspections = getServiceInspectionRows(epiData);

  it("has as many rows as the JSON: 23 scope items and 173 inspections", () => {
    expect(scope).toHaveLength(epiData.serviceScope.length);
    expect(scope).toHaveLength(23);
    expect(inspections).toHaveLength(epiData.serviceInspection.length);
    expect(inspections).toHaveLength(173);
  });

  it("reconciles the done count of every scope item with its inspection records", () => {
    for (const row of scope) {
      const records = epiData.serviceInspection.filter(
        (i) =>
          i.contractId === row.contractId &&
          i.scopeNo === row.scopeNo &&
          (i.inspectionDate ?? "") <= epiData.asAt &&
          (i.inspectionDate ?? "") >= (row.periodStart ?? "")
      ).length;
      expect(records, row.scopeId).toBe(row.done);
    }
  });

  it("flags the IKT cable inspection (KHA) that is in scope but never carried out", () => {
    const kha = scope.find((r) => r.scopeId === "IKT0126-A5");
    expect(kha).toMatchObject({
      contractId: "IKT0126",
      customer: "IKT",
      group: "weekly",
      required: 13,
      done: 0,
      overdue: 13,
      status: "not-done",
      compliance: 0
    });
    expect(kha?.scopeSource).toContain("meeting minutes");
  });

  it("marks monthly items one inspection short and counts the scheduled one as upcoming", () => {
    const row = scope.find((r) => r.scopeId === "IKT0126-B1");
    expect(row).toMatchObject({ group: "monthly", required: 4, done: 3, overdue: 1, upcoming: 1, status: "short" });
    expect(row?.compliance).toBe(0.75);
  });

  it("keeps compliant items free of overdue work", () => {
    const compliant = scope.filter((r) => r.status === "compliant");
    expect(compliant.length).toBe(13);
    expect(compliant.every((r) => r.overdue === 0)).toBe(true);
  });

  it("treats records dated after the as-at date as scheduled, not done", () => {
    const scheduled = inspections.filter((i) => i.timing === "scheduled");
    expect(scheduled).toHaveLength(9);
    expect(scheduled.every((i) => i.inspectionDate > epiData.asAt)).toBe(true);
    expect(inspections.filter((i) => i.timing === "done")).toHaveLength(164);
  });

  it("shows no result for a scheduled inspection", () => {
    const scheduled = inspections.filter((i) => i.timing === "scheduled");
    expect(scheduled.every((i) => i.measurement === null && i.finding === null && i.followUp === null)).toBe(true);
    expect(scheduled.every((i) => i.failedChecks.length === 0)).toBe(true);
  });

  it("describes an inspection record: failed checks and measurements", () => {
    const failed = inspections.find((i) => i.failedChecks.length > 0);
    expect(failed?.failedChecks[0]).toBe("Visual");
    const measured = inspections.find((i) => i.timing === "done" && i.measurement !== null);
    expect(measured?.measurement?.includes(",")).toBe(true);
    expect(measured?.group).toBe("monthly");
    expect(inspections.find((i) => i.inspectionId === "INS-TPK0226-173")?.customer).toBe("IPC TPK");
  });

  it("splits coverage per contract into done, overdue and upcoming", () => {
    const coverage = getCoverageByContract(epiData);
    expect(coverage.map((c) => c.contractId).sort()).toEqual(["IKT0126", "PTP1025", "TPK0226"]);
    const ikt = coverage.find((c) => c.contractId === "IKT0126");
    expect(ikt).toMatchObject({ required: 98, done: 80, overdue: 18, upcoming: 5 });
    expect(ikt?.coverage).toBeCloseTo(80 / 98, 6);
    const ptp = coverage.find((c) => c.contractId === "PTP1025");
    expect(ptp).toMatchObject({ required: 33, done: 33, overdue: 0, upcoming: 0, coverage: 1 });
  });

  it("summarises coverage, overdue and next inspections", () => {
    const summary = getServiceSummary(epiData);
    expect(summary).toMatchObject({
      contractCount: 3,
      required: 186,
      done: 164,
      overdueInspections: 22,
      overdueItems: 10,
      upcomingCount: 9,
      nextDate: "2026-11-15"
    });
    expect(summary.coverage).toBeCloseTo(164 / 186, 6);
    expect(formatPercent(summary.coverage, 2)).toBe("88,17%");
  });

  it("lists the next inspections soonest first", () => {
    const next = getNextInspections(epiData, 3);
    expect(next).toHaveLength(3);
    expect(next[0]?.inspectionDate).toBe("2026-11-15");
    const dates = next.map((n) => n.inspectionDate);
    expect([...dates].sort()).toEqual(dates);
  });

  it("lists the service contracts for the filter", () => {
    expect(getContractOptions(scope)).toEqual(["IKT0126", "PTP1025", "TPK0226"]);
    expect(getContractOptions(inspections)).toEqual(["IKT0126", "PTP1025", "TPK0226"]);
  });

  it("filters scope items and inspections", () => {
    const base = { contract: "all", group: "all", status: "all" };
    expect(filterScopeRows(scope, { ...base, contract: "IKT0126" })).toHaveLength(11);
    expect(filterScopeRows(scope, { ...base, group: "weekly" }).every((r) => r.group === "weekly")).toBe(true);
    expect(filterScopeRows(scope, { ...base, status: "not-done" })).toHaveLength(1);

    const inspectionBase = { contract: "all", group: "all", result: "all" };
    expect(filterInspectionRows(inspections, { ...inspectionBase, result: "scheduled" })).toHaveLength(9);
    const findings = filterInspectionRows(inspections, { ...inspectionBase, result: "finding" });
    expect(findings.length).toBeGreaterThan(0);
    const clean = filterInspectionRows(inspections, { ...inspectionBase, result: "clean" });
    expect(clean.length + findings.length + 9).toBeGreaterThanOrEqual(173);
    expect(filterInspectionRows(inspections, { ...inspectionBase, contract: "PTP1025" }).every((i) => i.contractId === "PTP1025")).toBe(true);
  });
});

describe("S7 facts for the scripted answers", () => {
  it("blocks the BAST of PNP126 on KR-06, KR-07 and progress", () => {
    const gate = getBastGate(epiData, "PNP126");
    expect(gate.allowed).toBe(false);
    expect(gate.progress).toBeCloseTo(0.28498, 6);
    expect(gate.checks.filter((c) => !c.ok).map((c) => c.rule)).toEqual(["KR-06", "KR-07", "KR-07", "C3-D1"]);
    expect(gate.checks.find((c) => c.rule === "KR-06")?.label).toBe("BA Pemeriksaan Fisik signed");
  });

  it("passes only the checks a project really has", () => {
    const gate = getBastGate(epiData, "GS125");
    expect(gate.allowed).toBe(false);
    expect(gate.checks.filter((c) => c.ok).map((c) => c.label)).toEqual([
      "BA Comtest signed (BA Testing and Commissioning)",
      "Progress is 100%"
    ]);
  });

  it("allows a BAST when every document exists", () => {
    const changed = structuredClone(epiData);
    const base = changed.baRegister.find((b) => b.projectId === "GS125" && b.documentType === "BAST I");
    if (base) {
      for (const documentType of ["BA Pemeriksaan Fisik", "BA Rikmatek"]) {
        changed.baRegister.push({ ...base, baId: `X-${documentType}`, documentType, status: "Signed" });
      }
    }
    expect(getBastGate(changed, "GS125").allowed).toBe(true);
  });

  it("lists the projects over their RAP budget, largest overrun first", () => {
    const over = getOverRapProjects(epiData);
    expect(over.map((p) => p.projectId)).toEqual(["PSL0126", "PTP1125", "TPK125"]);
    expect(over[0]).toMatchObject({ projectId: "PSL0126", customer: "PSL", overBy: 47_000_000 });
    expect(over[0]?.margin).toBeLessThan(0);
  });
});
