import { toEnglish, toEnglishCategory } from "./data/translate";
import {
  formatDateLabel,
  formatDecimal,
  formatPctPoints,
  formatPercent,
  formatPoints,
  formatPointsUnsigned,
  formatPace,
  formatWeekRange,
  formatRupiahMillions
} from "./format";
import {
  CRITICAL_ITEM_LAG_PTS,
  DEVIATION_ALERT_PTS,
  DEVIATION_CRITICAL_PTS,
  OVERDUE_ALERT_DAYS,
  RETENTION_ALERT_DAYS
} from "./thresholds";
import {
  EXCEPTION_LABELS,
  STAGE_LABELS,
  STATUS_GROUP_LABELS
} from "./labels";
import type {
  NexaContextKpi,
  RevenueTrio,
  LifecycleStage,
  PaymentSchedule,
  PaymentScheduleTone,
  ProjectLifecycle,
  RegisterSummary,
  ProjectFilterOption,
  AttentionGroup,
  ValueByStatusChartData,
  DumbbellChartData,
  WaterfallChartData,
  EarningStageChartData,
  SCurveChartData,
  WeeklyIncrementChartData,
  DeficitChartData,
  CostChartData,
  CoverageChartData,
  ChartTable,
  WaterfallInput,
  WaterfallStep,
  BaRegisterEntry,
  BastCheck,
  BastGate,
  BilledByType,
  BillingReadiness,
  BillingRow,
  BillingSummary,
  ContractCoverage,
  CostCategoryPoint,
  CostLine,
  CostLineFlag,
  CostLineRow,
  CostMargin,
  CostPortfolio,
  CriticalItem,
  DataOrigin,
  DocStatus,
  EarningStageRow,
  EpiDemoData,
  EvidenceStage,
  EvidenceStatus,
  EarningStageStatus,
  EvidenceSummary,
  HealthRating,
  HealthSignal,
  OverRapProject,
  PaymentStage,
  PortfolioHeadline,
  PortfolioRow,
  PortfolioTotals,
  Project,
  ProjectCostView,
  ProjectExceptionItem,
  ProjectHealth,
  ProjectInfo,
  ProjectProgress,
  ProjectForecast,
  LookAheadRow,
  PortfolioLifecycleStep,
  PipelineCustomer,
  DataQualityFlag,
  RetentionAgeingChartData,
  ProcurementFlow,
  WeeklyReportDraft,
  WeeklyReportRow,
  ProcurementFlowStep,
  ProcurementStepKey,
  ProgressWeekly,
  RecoveryRate,
  RegisterRow,
  RevenueBreakdown,
  RevenueChartPoint,
  RevenueTotals,
  SCurvePoint,
  ScopeStatus,
  SeededException,
  ServiceInspection,
  ServiceInspectionRow,
  ServiceScopeRow,
  ServiceSummary,
  StageUnit,
  StatusGroup,
  SuggestedAction,
  ValueByStatusPoint,
  WeekCard,
  WeightRow
} from "./types";

export {
  CRITICAL_ITEM_LAG_PTS,
  DEVIATION_ALERT_PTS,
  DEVIATION_CRITICAL_PTS,
  OVERDUE_ALERT_DAYS,
  RETENTION_ALERT_DAYS
} from "./thresholds";

const DETECTED = "TERDETEKSI";
const STATUS_GROUP_ORDER: StatusGroup[] = [
  "completed",
  "in-progress",
  "pipeline"
];
const HEALTH_RANK: Record<HealthRating, number> = {
  "at-risk": 0,
  watch: 1,
  "on-track": 2
};

const sum = (values: number[]): number =>
  values.reduce((total, value) => total + value, 0);

const round = (value: number, digits: number): number => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function getProject(data: EpiDemoData, projectId: string): Project {
  const project = data.projects.find((item) => item.projectId === projectId);
  if (!project) throw new Error(`Unknown project: ${projectId}`);
  return project;
}

/**
 * Plan = cumulative plan of the latest week that has started by the as-at date.
 * Actual = latest measured cumulative actual of a week that has ended by then.
 */
export function getProjectProgress(
  data: EpiDemoData,
  projectId: string
): ProjectProgress {
  const totals = data.progressWeekly.filter(
    (row) => row.projectId === projectId && row.component === "TOTAL"
  );
  const started = totals
    .filter((row) => row.weekStart <= data.asAt)
    .sort((a, b) => b.weekNo - a.weekNo);
  const measured = totals.filter(
    (row) => row.weekEnd <= data.asAt && row.actualCumulative !== null
  );

  const plan = started[0]?.planCumulative ?? null;
  const actual = measured.length
    ? Math.max(...measured.map((row) => row.actualCumulative ?? 0))
    : null;
  const deviationPts =
    plan !== null && actual !== null ? round((actual - plan) * 100, 3) : null;

  return { plan, actual, deviationPts };
}

/** Recognised revenue = final contract value x measured progress. */
export function getRecognisedRevenue(
  data: EpiDemoData,
  projectId: string
): number {
  const { actual } = getProjectProgress(data, projectId);
  const project = getProject(data, projectId);
  return Math.round(project.finalContractValue * (actual ?? 0));
}

/** Sum of invoices dated on or before the as-at date. */
export function getBilled(data: EpiDemoData, projectId: string): number {
  return sum(
    data.paymentStages
      .filter(
        (stage) =>
          stage.projectId === projectId &&
          stage.invoiceDate !== null &&
          stage.invoiceDate <= data.asAt
      )
      .map((stage) => stage.amount)
  );
}

/** Retensi held = Retensi 5% that is due but waits on a signed BAST II (same rule as S2). */
export function getRetentionHeld(
  data: EpiDemoData,
  projectId: string
): number {
  return sum(
    getBillingRows(data)
      .filter((row) => row.projectId === projectId && row.readiness === "awaiting-bast")
      .map((row) => row.amount)
  );
}

export function getProjectExceptions(
  data: EpiDemoData,
  projectId: string
): SeededException[] {
  return data.seededExceptions.filter(
    (item) => item.projectId === projectId && item.status === DETECTED
  );
}

function signalsFor(data: EpiDemoData, project: Project): HealthSignal[] {
  const { projectId } = project;
  const signals: HealthSignal[] = [];
  const progress = getProjectProgress(data, projectId);

  if (
    progress.deviationPts !== null &&
    progress.deviationPts <= -DEVIATION_ALERT_PTS
  ) {
    signals.push({
      code: "schedule-deviation",
      rating:
        progress.deviationPts <= -DEVIATION_CRITICAL_PTS ? "at-risk" : "watch",
      reason: `Schedule deviation ${formatPoints(progress.deviationPts)}`
    });
  }

  const rap = data.rapBudget.filter((row) => row.projectId === projectId);
  const cost = sum(rap.map((row) => row.costActual));
  const revenue = getRecognisedRevenue(data, projectId);
  if (revenue > 0 && cost > sum(rap.map((row) => row.rapPlanned)) && cost > revenue) {
    signals.push({
      code: "negative-margin",
      rating: "at-risk",
      reason: "Cost above RAP, margin negative"
    });
  }

  const handover = data.baRegister.find(
    (ba) => ba.projectId === projectId && ba.documentType === "BAST I"
  );
  if (progress.actual !== null && progress.actual >= 1 && handover && handover.status !== "Signed") {
    signals.push({
      code: "handover-pending",
      rating: "at-risk",
      reason: "BAST I unsigned at 100% progress"
    });
  }

  const stages = data.paymentStages.filter((stage) => stage.projectId === projectId);
  const held = stages.filter((stage) => stage.status === "TERTAHAN").length;
  if (held > 0) {
    signals.push({
      code: "billing-blocked",
      rating: "watch",
      reason: `${held} Tagihan held`
    });
  }
  const overdue = Math.max(0, ...stages.map((stage) => stage.daysOverdue));
  if (overdue > OVERDUE_ALERT_DAYS) {
    signals.push({
      code: "billing-overdue",
      rating: "watch",
      reason: `Invoice ${overdue} days overdue`
    });
  }
  const retentionAge = Math.max(0, ...stages.map((stage) => stage.retentionAgeDays));
  if (retentionAge > RETENTION_ALERT_DAYS) {
    signals.push({
      code: "retention-aged",
      rating: "watch",
      reason: `Retensi held ${retentionAge} days`
    });
  }

  const missedScope = data.serviceScope.filter(
    (scope) => scope.contractId === projectId && scope.status === "TIDAK DILAKSANAKAN"
  ).length;
  if (missedScope > 0) {
    signals.push({
      code: "service-gap",
      rating: "watch",
      reason: `${missedScope} contracted inspection not carried out`
    });
  }

  const bamk = data.baRegister.find(
    (ba) => ba.projectId === projectId && ba.documentType === "BAMK"
  );
  if (bamk?.status === "Draft") {
    signals.push({ code: "bamk-pending", rating: "watch", reason: "BAMK still draft" });
  }
  if (bamk?.status === "Belum Ada") {
    signals.push({ code: "bamk-missing", rating: "watch", reason: "No BAMK in the register" });
  }

  return signals.sort(
    (a, b) => HEALTH_RANK[a.rating] - HEALTH_RANK[b.rating]
  );
}

export function getProjectHealth(
  data: EpiDemoData,
  projectId: string
): ProjectHealth {
  const project = getProject(data, projectId);
  const signals = signalsFor(data, project);
  const rating: HealthRating = signals.some((s) => s.rating === "at-risk")
    ? "at-risk"
    : signals.length > 0
      ? "watch"
      : "on-track";
  const reason =
    signals.length > 0
      ? signals.map((s) => s.reason).join("; ")
      : project.statusGroup === "pipeline"
        ? "Pipeline, no delivery yet"
        : "No exceptions detected";
  return { rating, reason, signals };
}

export function getPortfolioTotals(data: EpiDemoData): PortfolioTotals {
  const ids = data.projects.map((project) => project.projectId);
  const recognisedRevenue = sum(ids.map((id) => getRecognisedRevenue(data, id)));
  const billed = sum(ids.map((id) => getBilled(data, id)));
  const withExceptions = new Set(
    data.seededExceptions
      .filter((item) => item.status === DETECTED)
      .map((item) => item.projectId)
  );
  return {
    projectCount: data.projects.length,
    customerCount: new Set(data.projects.map((p) => p.customerShort)).size,
    contractValue: sum(data.projects.map((p) => p.finalContractValue)),
    recognisedRevenue,
    billed,
    unbilled: Math.max(0, recognisedRevenue - billed),
    billedShare: recognisedRevenue > 0 ? Math.min(1, billed / recognisedRevenue) : 0,
    retentionHeld: sum(ids.map((id) => getRetentionHeld(data, id))),
    projectsWithExceptions: withExceptions.size
  };
}

export function getPortfolioRows(data: EpiDemoData): PortfolioRow[] {
  return data.projects.map((project) => {
    const progress = getProjectProgress(data, project.projectId);
    return {
      projectId: project.projectId,
      description: project.description,
      customer: project.customerShort,
      contractValue: project.finalContractValue,
      originalValue: project.contractValue,
      addendumValue: project.addendumValue,
      timeAddendumTo: project.endDateAddendum,
      plan: progress.plan,
      actual: progress.actual,
      deviationPts: progress.deviationPts,
      deviationAlert:
        progress.deviationPts !== null &&
        progress.deviationPts <= -DEVIATION_ALERT_PTS,
      stage: project.stage,
      stageLabel: STAGE_LABELS[project.stage],
      statusGroup: project.statusGroup,
      exceptionCount: getProjectExceptions(data, project.projectId).length,
      health: getProjectHealth(data, project.projectId),
      dataOrigin: project.dataOrigin
    };
  });
}

/** S1 lifecycle stepper: the projects at each of the eight lifecycle steps, with their value. */
export function getPortfolioLifecycle(data: EpiDemoData): PortfolioLifecycleStep[] {
  return LIFECYCLE_STEPS.map((label, index) => {
    const projects = data.projects.filter((project) => LIFECYCLE_INDEX[project.stage] === index);
    return {
      label,
      count: projects.length,
      value: sum(projects.map((project) => project.finalContractValue)),
      projectIds: projects.map((project) => project.projectId)
    };
  });
}

/** S1 pipeline by customer: offers and procurement not yet contracted, largest customer first. */
export function getPipelineByCustomer(data: EpiDemoData): PipelineCustomer[] {
  const pipeline = data.projects.filter((project) => project.statusGroup === "pipeline");
  const customers = [...new Set(pipeline.map((project) => project.customerShort))];
  return customers
    .map((customer) => {
      const projects = pipeline.filter((project) => project.customerShort === customer);
      return {
        customer,
        customerName: projects[0]?.customerName ?? customer,
        value: sum(projects.map((project) => project.finalContractValue)),
        projects: projects.map((project) => ({
          projectId: project.projectId,
          stageLabel: STAGE_LABELS[project.stage],
          value: project.finalContractValue
        }))
      };
    })
    .sort((a, b) => b.value - a.value);
}

/** BA register notes that question the record itself, not the work: these are data-quality flags. */
const DATA_QUALITY_NOTES: { pattern: RegExp; label: string }[] = [
  { pattern: /looks copied/i, label: "Document number looks copied" },
  { pattern: /incomplete number/i, label: "Incomplete document number" },
  { pattern: /personal onedrive/i, label: "File on a personal OneDrive" },
  { pattern: /not in the original/i, label: "Not in the original evidence folder" },
  { pattern: /already counted in the report/i, label: "Progress counted on an unsigned document" }
];

/** S1: every data-quality flag of the portfolio in one list, by project. */
export function getDataQualityFlags(data: EpiDemoData): DataQualityFlag[] {
  const flags: DataQualityFlag[] = [];
  for (const ba of data.baRegister) {
    const match = ba.note ? DATA_QUALITY_NOTES.find((item) => item.pattern.test(ba.note ?? "")) : undefined;
    if (match) {
      flags.push({ projectId: ba.projectId, reference: ba.baId, source: "BA register", label: match.label, detail: ba.note });
    }
    if (!ba.documentNo) {
      flags.push({
        projectId: ba.projectId,
        reference: ba.baId,
        source: "BA register",
        label: "No document number",
        detail: ba.documentType
      });
    }
  }
  return flags.sort((a, b) => a.projectId.localeCompare(b.projectId) || a.reference.localeCompare(b.reference));
}

export function getCustomerOptions(rows: { customer: string }[]): string[] {
  return [...new Set(rows.map((row) => row.customer))].sort();
}

export type PortfolioFilters = {
  search: string;
  customer: string;
  statusGroup: string;
  health: string;
};

export function filterPortfolioRows(
  rows: PortfolioRow[],
  filters: PortfolioFilters
): PortfolioRow[] {
  const query = filters.search.trim().toLowerCase();
  return rows.filter(
    (row) =>
      (filters.customer === "all" || row.customer === filters.customer) &&
      (filters.statusGroup === "all" || row.statusGroup === filters.statusGroup) &&
      (filters.health === "all" || row.health.rating === filters.health) &&
      (query === "" ||
        `${row.projectId} ${row.customer} ${row.description}`
          .toLowerCase()
          .includes(query))
  );
}

export type PortfolioSortKey =
  | "project"
  | "customer"
  | "contractValue"
  | "plan"
  | "actual"
  | "deviation"
  | "stage"
  | "exceptions"
  | "health";

function sortValue(row: PortfolioRow, key: PortfolioSortKey): string | number | null {
  switch (key) {
    case "project":
      return row.projectId;
    case "customer":
      return row.customer;
    case "contractValue":
      return row.contractValue;
    case "plan":
      return row.plan;
    case "actual":
      return row.actual;
    case "deviation":
      return row.deviationPts;
    case "stage":
      return row.stageLabel;
    case "exceptions":
      return row.exceptionCount;
    case "health":
      return HEALTH_RANK[row.health.rating];
  }
}

/** Rows without a value (null) always sort last. */
export function sortPortfolioRows(
  rows: PortfolioRow[],
  key: PortfolioSortKey | null,
  direction: "asc" | "desc"
): PortfolioRow[] {
  if (key === null) return rows;
  const factor = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const left = sortValue(a, key);
    const right = sortValue(b, key);
    if (left === null && right === null) return 0;
    if (left === null) return 1;
    if (right === null) return -1;
    if (typeof left === "number" && typeof right === "number") {
      return (left - right) * factor;
    }
    return String(left).localeCompare(String(right)) * factor;
  });
}

/** Severity follows the health of the project the exception belongs to. */
export function getAttentionGroups(data: EpiDemoData): AttentionGroup[] {
  const customers = new Map(
    data.projects.map((project) => [project.projectId, project.customerShort])
  );
  const items = data.seededExceptions
    .filter((item) => item.status === DETECTED)
    .map((item) => ({
      exceptionNo: item.exceptionNo,
      projectId: item.projectId,
      customer: customers.get(item.projectId) ?? "",
      label: EXCEPTION_LABELS[item.exceptionNo] ?? item.exception,
      severity:
        getProjectHealth(data, item.projectId).rating === "at-risk"
          ? ("high" as const)
          : ("medium" as const)
    }))
    .sort((a, b) => a.exceptionNo - b.exceptionNo);

  return (["high", "medium"] as const)
    .map((severity) => ({
      severity,
      items: items.filter((item) => item.severity === severity)
    }))
    .filter((group) => group.items.length > 0);
}

/** Contract value per status group, split by health rating. */
export function getValueByStatus(data: EpiDemoData): ValueByStatusPoint[] {
  return STATUS_GROUP_ORDER.map((statusGroup) => {
    const projects = data.projects.filter((p) => p.statusGroup === statusGroup);
    const valueOf = (rating: HealthRating) =>
      sum(
        projects
          .filter((p) => getProjectHealth(data, p.projectId).rating === rating)
          .map((p) => p.finalContractValue)
      );
    return {
      statusGroup,
      label: STATUS_GROUP_LABELS[statusGroup],
      total: sum(projects.map((p) => p.finalContractValue)),
      count: projects.length,
      onTrack: valueOf("on-track"),
      watch: valueOf("watch"),
      atRisk: valueOf("at-risk")
    };
  });
}

// ---------------------------------------------------------------------------
// S2 Commercial and billing
// ---------------------------------------------------------------------------

/** Earning rule 15/15/30/30/10 from the kick-off BA (requirements, table 6). */
export const EARNING_RULE = [
  { stageNo: 1, label: "Approval Material", weight: 0.15, document: "BA Approval Material" },
  { stageNo: 2, label: "Confirmation Order", weight: 0.15, document: "PO Vendor (Confirmation Order)" },
  { stageNo: 3, label: "Material On Site (MOS)", weight: 0.3, document: "BA Material On Site" },
  { stageNo: 4, label: "Installation", weight: 0.3, document: "BA Physical Progress" },
  { stageNo: 5, label: "Testing and Commissioning", weight: 0.1, document: "BA Testing and Commissioning" }
] as const;

const MONTHLY_REPORT_DOCUMENT = "BA Monthly Work Inspection";

function maxOrZero(values: number[]): number {
  return values.length ? Math.max(...values) : 0;
}

/**
 * Same definitions as the DATA MASTER revenue columns: accrual = contract value
 * x measured progress; taksasi = contract value x planned progress to year end.
 * Projects without a weekly schedule (pipeline) have no revenue.
 */
export function getRevenueBreakdown(
  data: EpiDemoData,
  projectId: string
): RevenueBreakdown {
  const project = getProject(data, projectId);
  const totals = data.progressWeekly.filter(
    (row) => row.projectId === projectId && row.component === "TOTAL"
  );
  if (totals.length === 0) {
    return {
      accruedPrevYears: 0,
      accruedThisYear: 0,
      estimateThisYear: 0,
      estimateRemaining: 0,
      spillNextYear: 0
    };
  }

  const value = project.finalContractValue;
  const year = Number(data.asAt.slice(0, 4));
  const prevYearEnd = `${year - 1}-12-31`;
  const yearEnd = `${year}-12-31`;
  const actualUntil = (date: string) =>
    maxOrZero(
      totals
        .filter((row) => row.weekEnd <= date && row.actualCumulative !== null)
        .map((row) => row.actualCumulative ?? 0)
    );
  const planUntil = (date: string) =>
    maxOrZero(
      totals
        .filter((row) => row.weekEnd <= date && row.planCumulative !== null)
        .map((row) => row.planCumulative ?? 0)
    );

  const accruedPrevYears = Math.round(value * actualUntil(prevYearEnd));
  const accruedThisYear =
    Math.round(value * (getProjectProgress(data, projectId).actual ?? 0)) -
    accruedPrevYears;
  const estimateThisYear = Math.round(value * planUntil(yearEnd)) - accruedPrevYears;

  return {
    accruedPrevYears,
    accruedThisYear,
    estimateThisYear,
    estimateRemaining: estimateThisYear - accruedThisYear,
    spillNextYear: value - accruedPrevYears - estimateThisYear
  };
}

export function getRevenueTotals(data: EpiDemoData): RevenueTotals {
  const parts = data.projects.map((p) => getRevenueBreakdown(data, p.projectId));
  return {
    accruedThisYear: sum(parts.map((part) => part.accruedThisYear)),
    estimateRemaining: sum(parts.map((part) => part.estimateRemaining)),
    spillNextYear: sum(parts.map((part) => part.spillNextYear))
  };
}

/** Accrued vs estimated (not yet accrued) revenue per project, projects with revenue only. */
export function getRevenueChart(data: EpiDemoData): RevenueChartPoint[] {
  return data.projects
    .map((p) => {
      const part = getRevenueBreakdown(data, p.projectId);
      return {
        projectId: p.projectId,
        accrued: part.accruedThisYear,
        estimateRemaining: part.estimateRemaining
      };
    })
    .filter((point) => point.accrued > 0 || point.estimateRemaining > 0);
}

/** Invoiced up to the as-at date, by payment type (Tagihan termin, 95%, Retensi 5%). */
export function getBilledByType(data: EpiDemoData): BilledByType {
  const invoiced = data.paymentStages.filter(
    (stage) => stage.invoiceDate !== null && stage.invoiceDate <= data.asAt
  );
  const total = (types: PaymentStage["stageType"][]) =>
    sum(
      invoiced
        .filter((stage) => types.includes(stage.stageType))
        .map((stage) => stage.amount)
    );
  return {
    termin: total(["Uang Muka", "Termin"]),
    ninetyFive: total(["Pelunasan 95%"]),
    retention: total(["Retensi 5%"])
  };
}

type RequiredDocument =
  | { kind: "document"; documentType: string; relatedStage: string | null; label: string }
  | { kind: "progress"; threshold: number }
  | { kind: "none" };

/** Maps a billing condition (SYARAT_TAGIH) to the BA that proves it. */
function requiredDocumentFor(condition: string | null): RequiredDocument {
  const text = condition ?? "";
  const monthly = /^BA pemeriksaan bulanan (.+)$/i.exec(text);
  if (monthly?.[1]) {
    return {
      kind: "document",
      documentType: MONTHLY_REPORT_DOCUMENT,
      relatedStage: monthly[1],
      label: `Monthly report BA (${monthly[1]})`
    };
  }
  if (/^BAMK/.test(text)) {
    return { kind: "document", documentType: "BAMK", relatedStage: null, label: "BAMK" };
  }
  if (/^BAST II/.test(text)) {
    return { kind: "document", documentType: "BAST II", relatedStage: null, label: "BAST II" };
  }
  if (/^BAST I/.test(text)) {
    return { kind: "document", documentType: "BAST I", relatedStage: null, label: "BAST I" };
  }
  const threshold = /(\d+)\s*%/.exec(text);
  if (threshold?.[1]) {
    return { kind: "progress", threshold: Number(threshold[1]) / 100 };
  }
  return { kind: "none" };
}

function docStatusOf(
  data: EpiDemoData,
  projectId: string,
  documentType: string,
  relatedStage: string | null
): DocStatus {
  const entries = data.baRegister.filter(
    (ba) =>
      ba.projectId === projectId &&
      ba.documentType === documentType &&
      (relatedStage === null || ba.relatedStage === relatedStage)
  );
  if (entries.some((ba) => ba.status === "Signed")) return "signed";
  if (entries.some((ba) => ba.status === "Draft")) return "draft";
  return "missing";
}

const BILLING_RANK: Record<BillingReadiness, number> = {
  billable: 0,
  "awaiting-bast": 1,
  blocked: 2,
  invoiced: 3,
  "not-due": 4
};

/**
 * Billable now = the billing condition is met AND the BA that proves it is signed.
 * A due Retensi 5% without a signed BAST II is "Due, awaiting BAST II", not billable.
 */
function readinessOf(
  stage: PaymentStage,
  required: RequiredDocument,
  docStatus: DocStatus,
  actualProgress: number | null
): BillingReadiness | null {
  if (stage.paidDate !== null) return null;
  if (stage.invoiceDate !== null) return "invoiced";
  const conditionMet =
    stage.status === "SIAP DITAGIH" &&
    (required.kind !== "progress" || (actualProgress ?? 0) >= required.threshold);
  const baSigned = required.kind !== "document" || docStatus === "signed";
  if (conditionMet && baSigned) return "billable";
  if (conditionMet && stage.stageType === "Retensi 5%") return "awaiting-bast";
  if (conditionMet || stage.status === "TERTAHAN") return "blocked";
  return "not-due";
}

function reasonFor(
  required: RequiredDocument,
  docStatus: DocStatus,
  actualProgress: number | null
): string | null {
  if (required.kind === "progress") {
    return `Progress ${formatPercent(actualProgress ?? 0)} below the ${formatPercent(required.threshold)} condition`;
  }
  if (required.kind === "document") {
    if (docStatus === "draft") return `${required.label} still draft, not signed`;
    if (docStatus === "missing") return `${required.label} not in the register`;
  }
  return null;
}

/** Open (unpaid) payment stages with readiness and the BA each one needs. */
export function getBillingRows(data: EpiDemoData): BillingRow[] {
  const projects = new Map(data.projects.map((p) => [p.projectId, p]));
  const rows: BillingRow[] = [];
  for (const stage of data.paymentStages) {
    const project = projects.get(stage.projectId);
    if (!project) continue;
    const required = requiredDocumentFor(stage.billingCondition);
    const docStatus: DocStatus =
      required.kind === "document"
        ? docStatusOf(data, stage.projectId, required.documentType, required.relatedStage)
        : "none";
    const actual = getProjectProgress(data, stage.projectId).actual;
    const readiness = readinessOf(stage, required, docStatus, actual);
    if (readiness === null) continue;
    rows.push({
      paymentId: stage.paymentId,
      projectId: stage.projectId,
      customer: project.customerShort,
      stageType: stage.stageType,
      condition: toEnglish(stage.billingCondition),
      amount: stage.amount,
      readiness,
      requiredDocument: required.kind === "document" ? required.label : null,
      expectedSigner:
        required.kind === "document" ? expectedSignerFor(required.documentType) : null,
      docStatus,
      reason:
        readiness === "blocked" || readiness === "awaiting-bast"
          ? reasonFor(required, docStatus, actual)
          : null,
      invoiceNo: stage.invoiceNo,
      invoiceDate: stage.invoiceDate,
      dueDate: stage.dueDate,
      paidDate: stage.paidDate,
      daysOutstanding: stage.daysOutstanding,
      daysOverdue: stage.daysOverdue,
      dataOrigin: "synthetic"
    });
  }
  return rows.sort(
    (a, b) =>
      BILLING_RANK[a.readiness] - BILLING_RANK[b.readiness] || b.amount - a.amount
  );
}

export function getBillingSummary(rows: BillingRow[]): BillingSummary {
  const summary: BillingSummary = {
    billable: { count: 0, amount: 0 },
    "awaiting-bast": { count: 0, amount: 0 },
    blocked: { count: 0, amount: 0 },
    invoiced: { count: 0, amount: 0 },
    "not-due": { count: 0, amount: 0 }
  };
  for (const row of rows) {
    summary[row.readiness].count += 1;
    summary[row.readiness].amount += row.amount;
  }
  return summary;
}

export type BillingFilters = {
  customer: string;
  stageType: string;
  readiness: string;
};

export function filterBillingRows(
  rows: BillingRow[],
  filters: BillingFilters
): BillingRow[] {
  return rows.filter(
    (row) =>
      (filters.customer === "all" || row.customer === filters.customer) &&
      (filters.stageType === "all" || row.stageType === filters.stageType) &&
      (filters.readiness === "all" || row.readiness === filters.readiness)
  );
}

const romanToken = (component: string): string => component.split(" ")[0] ?? "";

const CLAIMED_STAGE_NUMBER: Record<string, number> = {
  "Approval Material": 1,
  "Confirmation Order": 2,
  "Material On Site": 3,
  Installation: 4,
  "Testing and Commissioning": 5
};

/**
 * Earning rule rolled up over the weighted components of a project (only
 * projects with a component schedule, i.e. PNP126). A stage is earned only
 * when it is claimed and its BA is signed; claimed with an unsigned BA is blocked.
 */
export function getEarningStages(
  data: EpiDemoData,
  projectId: string
): EarningStageRow[] {
  const project = getProject(data, projectId);
  const components = data.progressWeekly.filter(
    (row) => row.projectId === projectId && row.component !== "TOTAL"
  );
  if (components.length === 0) return [];

  const latestWeek = Math.max(
    ...components.filter((row) => row.weekStart <= data.asAt).map((row) => row.weekNo)
  );
  const current = components.filter((row) => row.weekNo === latestWeek);
  const totalWeight = sum(current.map((c) => c.weight ?? 0));
  const claimedOf = (stageName: string | null) =>
    stageName === null ? 0 : (CLAIMED_STAGE_NUMBER[stageName] ?? 0);

  return EARNING_RULE.map((rule) => {
    const units =
      rule.stageNo === 5
        ? [{ weight: 1, claimed: current.some((c) => claimedOf(c.earningStage) >= 5), token: null }]
        : current.map((c) => ({
            weight: (c.weight ?? 0) / totalWeight,
            claimed: claimedOf(c.earningStage) >= rule.stageNo,
            token: romanToken(c.component)
          }));

    let earnedValue = 0;
    let blockedValue = 0;
    let signedCount = 0;
    let realEvidence = false;
    for (const unit of units) {
      const unitValue = project.finalContractValue * unit.weight * rule.weight;
      const entries = data.baRegister.filter(
        (ba) =>
          ba.projectId === projectId &&
          ba.documentType === rule.document &&
          (unit.token === null || romanToken(ba.component ?? "") === unit.token)
      );
      const signed = entries.some((ba) => ba.status === "Signed");
      if (entries.some((ba) => ba.asalData?.startsWith("Real"))) realEvidence = true;
      if (signed) signedCount += 1;
      if (unit.claimed && signed) earnedValue += unitValue;
      if (unit.claimed && !signed) blockedValue += unitValue;
    }

    const stageValue = project.finalContractValue * rule.weight;
    const status: EarningStageStatus =
      blockedValue > 0 ? "blocked" : earnedValue > 0 ? "earned" : "not-started";
    const dataOrigin: DataOrigin = realEvidence ? "real" : "synthetic";

    return {
      stageNo: rule.stageNo,
      label: rule.label,
      weight: rule.weight,
      requiredDocument: rule.document,
      stageValue: Math.round(stageValue),
      earnedValue: Math.round(earnedValue),
      blockedValue: Math.round(blockedValue),
      signedCount,
      requiredCount: units.length,
      status,
      dataOrigin
    } satisfies EarningStageRow;
  });
}

// ---------------------------------------------------------------------------
// S3 Project cockpit
// ---------------------------------------------------------------------------


const totalRowsOf = (data: EpiDemoData, projectId: string) =>
  data.progressWeekly
    .filter((row) => row.projectId === projectId && row.component === "TOTAL")
    .sort((a, b) => a.weekNo - b.weekNo);

export function hasProject(data: EpiDemoData, projectId: string): boolean {
  return data.projects.some((project) => project.projectId === projectId);
}

export function getProjectInfo(data: EpiDemoData, projectId: string): ProjectInfo {
  const project = getProject(data, projectId);
  const realSchedule = totalRowsOf(data, projectId).some((row) =>
    row.asalData?.startsWith("Real")
  );
  return {
    projectId,
    customer: project.customerShort,
    customerFullName: project.customerName,
    description: project.description,
    contractNumber: project.contractNumber,
    contractValue: project.finalContractValue,
    startDate: project.startDate,
    endDate: project.endDate,
    endDateAddendum: project.endDateAddendum,
    stage: project.stage,
    stageLabel: STAGE_LABELS[project.stage],
    statusGroup: project.statusGroup,
    health: getProjectHealth(data, projectId),
    progressOrigin: realSchedule ? "real" : "synthetic"
  };
}

/** Plan vs actual per week, in percentage points. Empty when there is no schedule. */
export function getSCurve(data: EpiDemoData, projectId: string): SCurvePoint[] {
  return totalRowsOf(data, projectId).map((row) => ({
    weekNo: row.weekNo,
    label: `W${row.weekNo}`,
    plan: row.planCumulative === null ? null : round(row.planCumulative * 100, 3),
    actual:
      row.actualCumulative === null || row.weekEnd > data.asAt
        ? null
        : round(row.actualCumulative * 100, 3)
  }));
}

export function getWeekCard(data: EpiDemoData, projectId: string): WeekCard | null {
  const rows = totalRowsOf(data, projectId);
  const current = rows.filter((row) => row.weekStart <= data.asAt).pop();
  if (!current) return null;
  const progress = getProjectProgress(data, projectId);
  const previous = rows.find((row) => row.weekNo === current.weekNo - 1);
  const gainPts =
    current.actualCumulative === null
      ? null
      : round((current.actualCumulative - (previous?.actualCumulative ?? 0)) * 100, 3);
  return {
    weekNo: current.weekNo,
    weekStart: current.weekStart,
    weekEnd: current.weekEnd,
    plan: progress.plan,
    actual: progress.actual,
    deviationPts: progress.deviationPts,
    gainPts
  };
}

function componentRowsAtAsAt(data: EpiDemoData, projectId: string) {
  const rows = data.progressWeekly.filter(
    (row) => row.projectId === projectId && row.component !== "TOTAL"
  );
  const started = rows.filter((row) => row.weekStart <= data.asAt);
  if (started.length === 0) return [];
  const week = Math.max(...started.map((row) => row.weekNo));
  return started.filter((row) => row.weekNo === week);
}

/** Weighted components of the project, heaviest first. Empty without a component schedule. */
export function getWeightBreakdown(data: EpiDemoData, projectId: string): WeightRow[] {
  return componentRowsAtAsAt(data, projectId)
    .map((row) => ({
      component: row.component,
      label: row.component.replace(/^[IVX]+\s+/, ""),
      weight: row.weight ?? 0,
      weightPts: round((row.weight ?? 0) * 100, 3),
      plan: row.planCumulative,
      actual: row.actualCumulative
    }))
    .sort((a, b) => b.weight - a.weight);
}

/**
 * Points per week needed to finish on the last planned week, against the best
 * weekly gain achieved and the recent run-rate. Null when the project has no
 * measured progress, is complete, or has no weeks left.
 */
export type NoProgressPeriod = { fromWeek: number; toWeek: number; weeks: number; label: string };

/**
 * The latest run of measured weeks whose cumulative actual did not move, read from
 * progressWeekly. PNP126: weeks 14 to 18 (5 weeks) at 28,498%. Null below 2 weeks.
 */
export function getNoProgressPeriod(data: EpiDemoData, projectId: string): NoProgressPeriod | null {
  const measured = totalRowsOf(data, projectId).filter(
    (row) => row.weekEnd <= data.asAt && row.actualCumulative !== null
  );
  const last = measured[measured.length - 1];
  if (!last) return null;
  let fromWeek = last.weekNo;
  for (const row of [...measured].reverse()) {
    if (row.actualCumulative !== last.actualCumulative) break;
    fromWeek = row.weekNo;
  }
  const weeks = last.weekNo - fromWeek + 1;
  if (weeks < 2) return null;
  return { fromWeek, toWeek: last.weekNo, weeks, label: formatWeekRange(fromWeek, last.weekNo) };
}

export function getRecoveryRate(data: EpiDemoData, projectId: string): RecoveryRate | null {
  const rows = totalRowsOf(data, projectId);
  const measured = rows.filter(
    (row) => row.weekEnd <= data.asAt && row.actualCumulative !== null
  );
  const last = measured[measured.length - 1];
  if (!last) return null;

  const actualPts = (last.actualCumulative ?? 0) * 100;
  const weeksRemaining = rows.filter((row) => row.weekNo > last.weekNo).length;
  if (actualPts >= 100 || weeksRemaining === 0) return null;

  const gains = measured.map((row, index) => {
    const previous = measured[index - 1]?.actualCumulative ?? 0;
    return ((row.actualCumulative ?? 0) - previous) * 100;
  });
  const bestPerWeek = Math.max(0, ...gains);
  const remainingPts = 100 - actualPts;
  const requiredPerWeek = remainingPts / weeksRemaining;

  const flat = getNoProgressPeriod(data, projectId);
  const recent = gains.slice(-4);
  const bestFour = bestRollingAverage(gains, ROLLING_WINDOW_WEEKS);

  return {
    remainingPts: round(remainingPts, 3),
    weeksRemaining,
    requiredPerWeek: round(requiredPerWeek, 3),
    bestPerWeek: round(bestPerWeek, 3),
    ratioToBest: bestPerWeek > 0 ? round(requiredPerWeek / bestPerWeek, 3) : null,
    recentPerWeek: round(sum(recent) / Math.max(1, recent.length), 3),
    bestFourWeekAvg: round(bestFour, 3),
    ratioToBestFour: bestFour > 0 ? round(requiredPerWeek / bestFour, 3) : null,
    flatWeeks: flat?.weeks ?? 0,
    flatFromWeek: flat?.fromWeek ?? null,
    flatToWeek: flat?.toWeek ?? null
  };
}

/** Weeks in the rolling window of the recovery benchmark (DP-04). */
export const ROLLING_WINDOW_WEEKS = 4;
const DAY_MS = 86_400_000;
/** Longest forecast drawn past the planned schedule, weeks */
const FORECAST_MAX_EXTRA_WEEKS = 30;

/** Best average over any run of consecutive weeks; the plain average when there are fewer weeks. */
export function bestRollingAverage(gains: number[], window: number): number {
  if (gains.length === 0) return 0;
  if (gains.length < window) return sum(gains) / gains.length;
  let best = 0;
  for (let end = window; end <= gains.length; end += 1) {
    best = Math.max(best, sum(gains.slice(end - window, end)) / window);
  }
  return best;
}

function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(to) - Date.parse(from)) / DAY_MS);
}

/** End date of a week, extending the schedule by 7 days a week after its last planned week. */
function weekEndOf(rows: ProgressWeekly[], weekNo: number): string {
  const row = rows.find((item) => item.weekNo === weekNo);
  if (row) return row.weekEnd;
  const last = rows[rows.length - 1];
  return last ? addDays(last.weekEnd, 7 * (weekNo - last.weekNo)) : "";
}

function measuredGains(data: EpiDemoData, projectId: string) {
  const measured = totalRowsOf(data, projectId).filter(
    (row) => row.weekEnd <= data.asAt && row.actualCumulative !== null
  );
  const gains = measured.map(
    (row, index) => ((row.actualCumulative ?? 0) - (measured[index - 1]?.actualCumulative ?? 0)) * 100
  );
  return { gains, last: measured[measured.length - 1] };
}

/**
 * S3 forecast (ATLAS-estimated): from the last measured week at the best 4-week rolling
 * average, to 100%. Float = planned end minus forecast finish; negative is late.
 * Null for a project without measured progress or already complete.
 */
export function getProjectForecast(data: EpiDemoData, projectId: string): ProjectForecast | null {
  const rows = totalRowsOf(data, projectId);
  const { gains, last } = measuredGains(data, projectId);
  if (!last) return null;
  const actualPts = (last.actualCumulative ?? 0) * 100;
  if (actualPts >= 100) return null;
  const project = getProject(data, projectId);
  const plannedEndDate = project.endDateAddendum ?? project.endDate ?? weekEndOf(rows, rows[rows.length - 1]?.weekNo ?? 0);
  const pace = round(bestRollingAverage(gains, ROLLING_WINDOW_WEEKS), 3);
  if (pace <= 0) {
    return { pacePerWeek: 0, finishWeek: null, finishDate: null, plannedEndDate, floatDays: null, source: "ATLAS-estimated" };
  }
  const finishWeek = last.weekNo + Math.ceil((100 - actualPts) / pace);
  const finishDate = weekEndOf(rows, finishWeek);
  return {
    pacePerWeek: pace,
    finishWeek,
    finishDate,
    plannedEndDate,
    floatDays: daysBetween(finishDate, plannedEndDate),
    source: "ATLAS-estimated"
  };
}

/** S3: the weeks after the as-at week, plan against the ATLAS forecast, with what falls due. */
export function getLookAhead(data: EpiDemoData, projectId: string, weeks = ROLLING_WINDOW_WEEKS): LookAheadRow[] {
  const rows = totalRowsOf(data, projectId);
  const { last } = measuredGains(data, projectId);
  if (!last || rows.length === 0) return [];
  const forecast = getProjectForecast(data, projectId);
  const actualPts = (last.actualCumulative ?? 0) * 100;
  const critical = getCriticalItem(data, projectId);
  const stages = data.paymentStages.filter((stage) => stage.projectId === projectId);
  const planned = data.baRegister.filter((ba) => ba.projectId === projectId && (ba.documentDate ?? "") > data.asAt);

  return Array.from({ length: weeks }, (_, index) => {
    const weekNo = last.weekNo + index + 1;
    const row = rows.find((item) => item.weekNo === weekNo);
    const previous = rows.find((item) => item.weekNo === weekNo - 1);
    const weekEnd = weekEndOf(rows, weekNo);
    const weekStart = row?.weekStart ?? addDays(weekEnd, -6);
    const inWeek = (date: string | null) => date !== null && date >= weekStart && date <= weekEnd;
    const milestones = [
      ...stages.filter((stage) => inWeek(stage.dueDate)).map((stage) => `Termin ${stage.terminNo} due`),
      ...planned.filter((ba) => inWeek(ba.documentDate)).map((ba) => `${toEnglish(ba.documentType)} planned`),
      ...(critical?.nextMilestone && inWeek(critical.nextMilestone.date)
        ? [`${critical.label}: ${critical.nextMilestone.label}`]
        : [])
    ];
    const plan = row?.planCumulative ?? null;
    return {
      weekNo,
      weekStart,
      weekEnd,
      plan: plan === null ? null : round(plan * 100, 3),
      planGain: plan === null ? null : round((plan - (previous?.planCumulative ?? 0)) * 100, 3),
      forecast: forecast ? round(Math.min(100, actualPts + forecast.pacePerWeek * (index + 1)), 3) : null,
      milestones
    };
  });
}

export function getCostMargin(data: EpiDemoData, projectId: string): CostMargin {
  const rap = data.rapBudget.filter((row) => row.projectId === projectId);
  const cost = sum(rap.map((row) => row.costActual));
  const rapPlanned = sum(rap.map((row) => row.rapPlanned));
  const recognisedRevenue = getRecognisedRevenue(data, projectId);
  const contractValue = getProject(data, projectId).finalContractValue;
  const advances = getVendorAdvances(data, projectId);
  return {
    contractValue,
    plannedMargin: rapPlanned > 0 ? (contractValue - rapPlanned) / contractValue : null,
    cost,
    rapPlanned,
    rapRemaining: rapPlanned - cost,
    recognisedRevenue,
    profit: recognisedRevenue - cost,
    margin: recognisedRevenue > 0 ? (recognisedRevenue - cost) / recognisedRevenue : null,
    vendorAdvances: advances,
    advancesShareOfCost: cost > 0 ? advances / cost : null
  };
}

/**
 * Vendor advances (uang muka) still in cost: a PO advance with an advance number and
 * no SES yet. Petty cash advances are operating cost and stay in.
 */
export function getVendorAdvances(data: EpiDemoData, projectId: string): number {
  return sum(
    data.costLines
      .filter(
        (line) =>
          line.projectId === projectId &&
          line.advanceNo !== null &&
          line.sesNo === null &&
          line.poNo !== null &&
          line.procurementMethod !== PETTY_CASH_METHOD
      )
      .map((line) => line.amount)
  );
}

/** The heaviest component, when it is more than 20 points behind plan. */
export function getCriticalItem(data: EpiDemoData, projectId: string): CriticalItem | null {
  const heaviest = componentRowsAtAsAt(data, projectId).sort(
    (a, b) => (b.weight ?? 0) - (a.weight ?? 0)
  )[0];
  if (!heaviest || heaviest.planCumulative === null || heaviest.actualCumulative === null) {
    return null;
  }
  const behindPts = round((heaviest.planCumulative - heaviest.actualCumulative) * 100, 3);
  if (behindPts <= CRITICAL_ITEM_LAG_PTS) return null;
  const forecast = getProjectForecast(data, projectId);
  const floatDays = forecast?.floatDays ?? null;
  return {
    component: heaviest.component,
    label: heaviest.component.replace(/^[IVX]+\s+/, ""),
    weight: heaviest.weight ?? 0,
    behindPts,
    claimedStage: heaviest.earningStage,
    nextMilestone: nextMilestoneOf(data, projectId, heaviest, forecast),
    floatDays,
    floatSource: floatDays === null ? null : "ATLAS-estimated"
  };
}

/**
 * The next earning stage of a component and when it lands. A planned date in the BA
 * register is vendor-reported; otherwise ATLAS estimates the week the component reaches
 * the stage at the forecast pace. Without either, the date stays empty (never invented).
 */
function nextMilestoneOf(
  data: EpiDemoData,
  projectId: string,
  component: ProgressWeekly,
  forecast: ProjectForecast | null
): CriticalItem["nextMilestone"] {
  const claimedNo =
    component.earningStage === null ? 0 : (CLAIMED_STAGE_NUMBER[component.earningStage] ?? 0);
  const next = EARNING_RULE.find((rule) => rule.stageNo === claimedNo + 1);
  if (!next) return null;
  const base = { label: next.label, document: next.document };
  const planned = data.baRegister.find(
    (ba) =>
      ba.projectId === projectId &&
      ba.documentType === next.document &&
      romanToken(ba.component ?? "") === romanToken(component.component) &&
      (ba.documentDate ?? "") > data.asAt
  );
  if (planned?.documentDate) return { ...base, date: planned.documentDate, source: "vendor-reported" };

  const weight = component.weight ?? 0;
  if (!forecast || forecast.pacePerWeek <= 0 || weight <= 0 || component.actualCumulative === null) {
    return { ...base, date: null, source: null };
  }
  const share = component.actualCumulative / weight;
  const threshold = sum(EARNING_RULE.filter((rule) => rule.stageNo <= next.stageNo).map((rule) => rule.weight));
  const weeks = Math.max(1, Math.ceil((threshold - share) / (forecast.pacePerWeek / 100)));
  return {
    ...base,
    date: weekEndOf(totalRowsOf(data, projectId), component.weekNo + weeks),
    source: "ATLAS-estimated"
  };
}

export function getProjectExceptionItems(
  data: EpiDemoData,
  projectId: string
): ProjectExceptionItem[] {
  const severity =
    getProjectHealth(data, projectId).rating === "at-risk" ? "high" : "medium";
  return getProjectExceptions(data, projectId)
    .map((item) => ({
      exceptionNo: item.exceptionNo,
      label: EXCEPTION_LABELS[item.exceptionNo] ?? item.exception,
      severity: severity as ProjectExceptionItem["severity"]
    }))
    .sort((a, b) => a.exceptionNo - b.exceptionNo);
}

// ---------------------------------------------------------------------------
// S4 Evidence gate: nothing is earned or billed without a signed BA
// ---------------------------------------------------------------------------

/** Customer role that signs progress documents (kick-off BA, point 5.6.b). */
export const PROGRESS_SIGNER = "Engineering Manager";
/** Customer role that signs the payment BA and the handover BA (kick-off BA). */
export const PAYMENT_SIGNER = "Direktur Utama";

const EVIDENCE_REQUIREMENTS: Record<number, { document: string; additional: string | null }> = {
  1: { document: "Approval Material and material specification or brochure", additional: null },
  2: { document: "Copy of PO/SPK received and signed by the customer", additional: null },
  3: { document: "BA Material On Site signed by both parties", additional: null },
  4: { document: "Physical Progress Report signed by both parties", additional: null },
  5: {
    document: "BA Testing and Commissioning and Physical Progress Report, signed by both parties",
    additional:
      "The contract also requires an RLB (safe-to-energise recommendation) from an LIT. The register does not track it."
  }
};

const OWNER_ROLE = "Project Manager";
const DUE_DAYS_MISSING = 7;
const DUE_DAYS_PENDING = 14;

export function addDays(isoDate: string, days: number): string {
  return new Date(Date.parse(isoDate) + days * 86_400_000).toISOString().slice(0, 10);
}

/** Customer role expected to sign a document type, for display next to the BA. */
export function expectedSignerFor(documentType: string | null): string | null {
  if (documentType === null) return null;
  if (/^BAST|^Payment BA/.test(documentType)) return "Customer President Director";
  if (documentType === "BAMK") return "Customer authorised official";
  if (/^(BA |PO |Physical|Weekly|S-curve)/.test(documentType)) return "Customer Engineering Manager";
  return null;
}

function bestEntry(entries: BaRegisterEntry[]): BaRegisterEntry | null {
  return (
    entries.find((ba) => ba.status === "Signed") ??
    entries.find((ba) => ba.status === "Draft") ??
    null
  );
}

function unitIssue(
  ba: BaRegisterEntry | null,
  documentType: string,
  signerOk: boolean
): string | null {
  if (!ba) return `${documentType} not in the register`;
  if (ba.status !== "Signed") return `${documentType} still draft, not signed`;
  if (!signerOk) {
    return `Signed by ${ba.customerSignatoryRole ?? "an unknown role"}, expected ${PROGRESS_SIGNER}`;
  }
  return null;
}

/**
 * The five earning stages of a project with a component schedule, each with the
 * BA that proves it and a gate: a stage can earn only when every component has a
 * signed BA from the right customer role. Empty for projects without a schedule.
 */
export function getEvidenceStages(data: EpiDemoData, projectId: string): EvidenceStage[] {
  const project = getProject(data, projectId);
  const current = componentRowsAtAsAt(data, projectId);
  if (current.length === 0) return [];
  const totalWeight = sum(current.map((c) => c.weight ?? 0));
  const claimedOf = (name: string | null) =>
    name === null ? 0 : (CLAIMED_STAGE_NUMBER[name] ?? 0);

  return EARNING_RULE.map((rule) => {
    const requirement = EVIDENCE_REQUIREMENTS[rule.stageNo];
    const wholeSystem = rule.stageNo === 5;
    const targets = wholeSystem
      ? [
          {
            unit: "Whole system",
            token: null,
            weight: 1,
            claimed: current.some((c) => claimedOf(c.earningStage) >= 5),
            dueByPlan: false
          }
        ]
      : current.map((c) => {
          const claimedNo = claimedOf(c.earningStage);
          const plannedShare = c.weight && c.planCumulative !== null ? c.planCumulative / c.weight : 0;
          return {
            unit: c.component.replace(/^[IVX]+\s+/, ""),
            token: romanToken(c.component),
            weight: (c.weight ?? 0) / totalWeight,
            claimed: claimedNo >= rule.stageNo,
            // The next stage is due once the plan has moved past the stages already claimed.
            dueByPlan:
              rule.stageNo === claimedNo + 1 && plannedShare > cumulativeWeightBefore(rule.stageNo)
          };
        });

    const units: StageUnit[] = targets.map((target) => {
      const required = target.claimed || target.dueByPlan;
      const entries = data.baRegister.filter(
        (ba) =>
          ba.projectId === projectId &&
          ba.documentType === rule.document &&
          (target.token === null || romanToken(ba.component ?? "") === target.token)
      );
      const ba = bestEntry(entries);
      const signed = ba?.status === "Signed";
      const signerOk = (ba?.customerSignatoryRole ?? "").startsWith(PROGRESS_SIGNER);
      const complete = signed && signerOk;
      return {
        unit: target.unit,
        claimed: target.claimed,
        required,
        status: complete ? "earned" : required ? "blocked" : "not-started",
        issue: complete ? null : unitIssue(ba, rule.document, signerOk),
        baId: ba?.baId ?? null,
        documentNo: ba?.documentNo ?? null,
        documentDate: ba?.documentDate ?? null,
        signerRole: ba?.customerSignatoryRole ?? null,
        fileLink: ba?.fileLink ?? null,
        note: ba?.note ?? null,
        value: Math.round(project.finalContractValue * target.weight * rule.weight)
      };
    });

    const missing = units.filter((u) => u.status === "blocked");
    // Only a claim without a signed BA holds value back; a BA due by plan blocks the stage, not money.
    const claimedMissing = missing.filter((u) => u.claimed);
    const complete = units.filter((u) => u.status === "earned");
    const status: EvidenceStatus =
      missing.length > 0 ? "blocked" : complete.length === units.length ? "earned" : "not-started";
    const signedDates = complete.map((u) => u.documentDate ?? "").filter(Boolean).sort();

    const reason =
      status === "earned"
        ? `${complete.length} of ${units.length} required BA signed by the ${PROGRESS_SIGNER}`
        : status === "blocked"
          ? missing.map((u) => `${u.unit}: ${u.issue}${u.claimed ? "" : " (due by plan)"}`).join("; ")
          : `Not started: ${rule.document} is required before progress can be claimed`;

    return {
      stageNo: rule.stageNo,
      label: rule.label,
      weight: rule.weight,
      requiredDocument: requirement?.document ?? rule.document,
      documentType: rule.document,
      expectedSigner: `Customer ${PROGRESS_SIGNER}`,
      additionalRequirement: requirement?.additional ?? null,
      // A date only when every BA of the stage is signed; a missing or draft BA shows "-".
      signedDate: status === "earned" ? (signedDates[signedDates.length - 1] ?? null) : null,
      status,
      gate: {
        result: status === "earned" ? "can-earn" : "blocked",
        reason
      },
      units,
      stageValue: Math.round(project.finalContractValue * rule.weight),
      blockedValue: sum(claimedMissing.map((u) => u.value)),
      dataOrigin: units.some((u) => {
        const ba = data.baRegister.find((b) => b.baId === u.baId);
        return ba?.asalData?.startsWith("Real");
      })
        ? "real"
        : "synthetic"
    } satisfies EvidenceStage;
  });
}

/** Sum of the earning-rule weights of the stages before this one: 0,30 before MOS. */
function cumulativeWeightBefore(stageNo: number): number {
  return sum(EARNING_RULE.filter((rule) => rule.stageNo < stageNo).map((rule) => rule.weight));
}

export function getEvidenceSummary(stages: EvidenceStage[]): EvidenceSummary {
  return {
    canEarn: stages.filter((s) => s.status === "earned").length,
    blocked: stages.filter((s) => s.status === "blocked").length,
    claimedWithoutBa: sum(
      stages.map((s) => s.units.filter((u) => u.status === "blocked" && u.claimed).length)
    ),
    blockedValue: sum(stages.map((s) => s.blockedValue)),
    notStarted: stages.filter((s) => s.status === "not-started").length
  };
}

/** The action the Evidence agent recommends for a blocked stage (autonomy L1). */
export function getSuggestedAction(
  data: EpiDemoData,
  projectId: string,
  stage: EvidenceStage
): SuggestedAction {
  // Urgent only when progress is already claimed without the BA; a BA due by plan is prepared.
  const missing = stage.units.filter((u) => u.status === "blocked" && u.claimed);
  const urgent = missing.length > 0;
  const title = urgent
    ? `Get ${stage.documentType} signed: ${missing.map((u) => u.unit).join(", ")} (${projectId})`
    : `Prepare ${stage.documentType} for ${stage.label} (${projectId})`;
  return {
    title,
    projectId,
    ownerRole: OWNER_ROLE,
    dueDate: addDays(data.asAt, urgent ? DUE_DAYS_MISSING : DUE_DAYS_PENDING),
    source: `Evidence gate: ${projectId} stage ${stage.stageNo}`,
    autonomy: "L1",
    issue: `evidence-stage-${stage.stageNo}`
  };
}

/** Every BA of a project, for the evidence register. */
export function getProjectRegister(data: EpiDemoData, projectId: string): RegisterRow[] {
  return data.baRegister
    .filter((ba) => ba.projectId === projectId)
    .map((ba) => ({
      baId: ba.baId,
      documentType: ba.documentType,
      documentNo: ba.documentNo,
      documentDate: ba.documentDate,
      component: ba.component,
      relatedStage: ba.relatedStage,
      customerSigner: ba.customerSignatoryRole,
      epiSigner: ba.epiSignatoryRole,
      status: ba.status,
      fileLink: ba.fileLink,
      note: ba.note,
      dataOrigin: ba.asalData?.startsWith("Real") ? "real" : "synthetic"
    }));
}

// ---------------------------------------------------------------------------
// S5 Procurement and cost
// ---------------------------------------------------------------------------

const PETTY_CASH_METHOD = "Kas Kecil";

function flagsForLine(line: CostLine): CostLineFlag[] {
  const flags: CostLineFlag[] = [];
  const petty = line.procurementMethod === PETTY_CASH_METHOD;
  const posted = Boolean(line.sapDocNo && line.postingDate);

  if (petty) {
    if (!posted) {
      flags.push({
        code: "petty-cash-open",
        severity: "watch",
        label: "Petty cash not accounted for in SAP"
      });
    }
    return flags;
  }

  if (!line.prNo || !line.poNo) {
    flags.push(
      posted
        ? { code: "paid-without-document", severity: "high", label: "Paid without PR or PO" }
        : { code: "missing-po", severity: "watch", label: "No PR or PO" }
    );
  } else if (!line.sesNo) {
    if (line.advanceNo) {
      flags.push({
        code: "advance-without-ses",
        severity: "watch",
        label: "Advance paid, SES not yet issued"
      });
    } else if (posted) {
      flags.push({ code: "paid-without-document", severity: "high", label: "Paid without SES" });
    } else {
      flags.push({ code: "missing-ses", severity: "watch", label: "No SES" });
    }
  }

  if (!posted) {
    flags.push({ code: "not-posted", severity: "watch", label: "Not posted in SAP" });
  }
  return flags;
}

/** Cost lines of a project with payment status and document flags. */
export function getCostLineRows(data: EpiDemoData, projectId: string): CostLineRow[] {
  return data.costLines
    .filter((line) => line.projectId === projectId)
    .sort((a, b) => a.lineNo - b.lineNo)
    .map((line) => ({
      projectId: line.projectId,
      lineNo: line.lineNo,
      item: line.description ?? "-",
      executor: line.vendor ?? "-",
      method: line.procurementMethod ? toEnglishCategory(line.procurementMethod) : "-",
      prNo: line.prNo,
      poNo: line.poNo,
      sesNo: line.sesNo,
      advanceNo: line.advanceNo,
      transactionDate: line.transactionDate,
      paymentStatus: line.sapDocNo && line.postingDate ? "Posted" : "Not posted",
      sapDocNo: line.sapDocNo,
      postingDate: line.postingDate,
      amount: line.amount,
      category: line.rapCategory ?? "Other",
      note: line.note,
      flags: flagsForLine(line)
    }));
}

/** RAP budget against the cost lines, per category (union of both). */
export function getCostByCategory(data: EpiDemoData, projectId: string): CostCategoryPoint[] {
  const planned = new Map<string, number>();
  for (const row of data.rapBudget.filter((r) => r.projectId === projectId)) {
    planned.set(row.rapCategory, (planned.get(row.rapCategory) ?? 0) + row.rapPlanned);
  }
  const cost = new Map<string, number>();
  for (const line of data.costLines.filter((l) => l.projectId === projectId)) {
    const category = line.rapCategory ?? "Other";
    cost.set(category, (cost.get(category) ?? 0) + line.amount);
  }
  const categories = [...new Set([...planned.keys(), ...cost.keys()])];
  return categories
    .map((category) => ({
      category,
      rapPlanned: planned.get(category) ?? 0,
      cost: cost.get(category) ?? 0
    }))
    .sort((a, b) => b.rapPlanned - a.rapPlanned);
}

export function getProjectCostView(data: EpiDemoData, projectId: string): ProjectCostView {
  return {
    projectId,
    customer: getProject(data, projectId).customerShort,
    margin: getCostMargin(data, projectId),
    categories: getCostByCategory(data, projectId),
    lines: getCostLineRows(data, projectId),
    chart: getCostChart(data, projectId),
    bridge: getMarginBridge(data, projectId),
    flow: getProcurementFlow(data, projectId)
  };
}

const PROCUREMENT_STEPS: { key: ProcurementStepKey; label: string }[] = [
  { key: "pr", label: "Purchase requisition (PR)" },
  { key: "po", label: "Purchase order (PO)" },
  { key: "ses", label: "Service entry sheet (SES)" },
  { key: "payment", label: "Payment (SAP document)" }
];

/**
 * S5: each cost line through PR -> PO -> SES -> payment, with the SAP numbers already in
 * the cost lines. Petty cash skips PR, PO and SES; an advance before SES is paid, not settled.
 */
export function getProcurementFlow(data: EpiDemoData, projectId: string): ProcurementFlow {
  const lines = data.costLines
    .filter((line) => line.projectId === projectId)
    .sort((a, b) => a.lineNo - b.lineNo)
    .map((line) => {
      const pettyCash = line.procurementMethod === PETTY_CASH_METHOD;
      const posted = Boolean(line.sapDocNo && line.postingDate);
      const documentStep = (key: ProcurementStepKey, number: string | null): ProcurementFlowStep => ({
        key,
        label: PROCUREMENT_STEPS.find((step) => step.key === key)?.label ?? key,
        number,
        date: null,
        state: pettyCash ? "not-applicable" : number ? "done" : "missing"
      });
      const payment: ProcurementFlowStep = {
        key: "payment",
        label: "Payment (SAP document)",
        number: posted ? line.sapDocNo : line.advanceNo,
        date: posted ? line.postingDate : line.transactionDate,
        state: posted ? (line.advanceNo && !line.sesNo && !pettyCash ? "advance" : "done") : line.advanceNo ? "advance" : "missing"
      };
      return {
        lineNo: line.lineNo,
        item: line.description ?? "-",
        vendor: line.vendor ?? "-",
        amount: line.amount,
        pettyCash,
        steps: [documentStep("pr", line.prNo), documentStep("po", line.poNo), documentStep("ses", line.sesNo), payment]
      };
    });

  const stages = PROCUREMENT_STEPS.map((step) => {
    const applicable = lines.filter((line) => line.steps.find((item) => item.key === step.key)?.state !== "not-applicable");
    const reached = applicable.filter((line) => {
      const state = line.steps.find((item) => item.key === step.key)?.state;
      return state === "done" || state === "advance";
    });
    return {
      key: step.key,
      label: step.label,
      reached: reached.length,
      applicable: applicable.length,
      amount: sum(reached.map((line) => line.amount))
    };
  });
  return { stages, lines };
}

export function getCostCategoryOptions(lines: CostLineRow[]): string[] {
  return [...new Set(lines.map((line) => line.category))].sort();
}

export function getCostPortfolio(data: EpiDemoData): CostPortfolio {
  const ids = data.projects.map((p) => p.projectId);
  const margins = ids.map((id) => getCostMargin(data, id));
  const cost = sum(margins.map((m) => m.cost));
  const recognisedRevenue = sum(margins.map((m) => m.recognisedRevenue));
  const flaggedByProject = ids.map(
    (id) => getCostLineRows(data, id).filter((line) => line.flags.length > 0).length
  );
  return {
    projectCount: ids.length,
    rapPlanned: sum(margins.map((m) => m.rapPlanned)),
    cost,
    recognisedRevenue,
    margin: recognisedRevenue > 0 ? (recognisedRevenue - cost) / recognisedRevenue : null,
    flaggedLines: sum(flaggedByProject),
    flaggedProjects: flaggedByProject.filter((count) => count > 0).length,
    overRapProjects: margins.filter((m) => m.rapRemaining < 0).length
  };
}

// ---------------------------------------------------------------------------
// S6 Service contracts
// ---------------------------------------------------------------------------

const SCOPE_STATUS: Record<string, ScopeStatus> = {
  PATUH: "compliant",
  KURANG: "short",
  "TIDAK DILAKSANAKAN": "not-done"
};

const groupOf = (frequency: string | null): "weekly" | "monthly" =>
  frequency === "Mingguan" ? "weekly" : "monthly";

function customerOf(data: EpiDemoData, contractId: string): string {
  return data.projects.find((p) => p.projectId === contractId)?.customerShort ?? contractId;
}

/** Contracted inspection items with done, overdue and upcoming counts. */
export function getServiceScopeRows(data: EpiDemoData): ServiceScopeRow[] {
  return data.serviceScope.map((scope) => {
    const periodOver = scope.periodEnd !== null && scope.periodEnd <= data.asAt;
    const shortfall = Math.max(0, scope.requiredInPeriod - scope.done);
    const upcoming = data.serviceInspection.filter(
      (item) =>
        item.contractId === scope.contractId &&
        item.scopeNo === scope.scopeNo &&
        (item.inspectionDate ?? "") > data.asAt
    ).length;
    return {
      scopeId: scope.scopeId,
      contractId: scope.contractId,
      customer: customerOf(data, scope.contractId),
      scopeNo: scope.scopeNo,
      group: groupOf(scope.frequency),
      scopeItem: scope.scopeItem,
      periodStart: scope.periodStart,
      periodEnd: scope.periodEnd,
      required: scope.requiredInPeriod,
      done: scope.done,
      overdue: periodOver ? shortfall : 0,
      upcoming,
      compliance: scope.requiredInPeriod > 0 ? scope.done / scope.requiredInPeriod : 0,
      status: SCOPE_STATUS[scope.status ?? ""] ?? "short",
      scopeSource: scope.scopeSource
    };
  });
}

const CHECKS: { label: string; pick: (item: ServiceInspection) => string | null }[] = [
  { label: "Visual", pick: (item) => item.visualCheck },
  { label: "Thermal", pick: (item) => item.thermalCheck },
  { label: "Cleanliness", pick: (item) => item.cleanlinessCheck },
  { label: "K3 label", pick: (item) => item.k3LabelCheck }
];

/** Inspection records; those dated after the as-at date are scheduled, not done. */
export function getServiceInspectionRows(data: EpiDemoData): ServiceInspectionRow[] {
  const groups = new Map(
    data.serviceScope.map((scope) => [`${scope.contractId}|${scope.scopeNo}`, groupOf(scope.frequency)])
  );
  return data.serviceInspection
    .map((item) => {
      const date = item.inspectionDate ?? "";
      // A scheduled inspection has not happened yet: it carries no result.
      const scheduled = date > data.asAt;
      return {
        inspectionId: item.inspectionId,
        contractId: item.contractId,
        customer: customerOf(data, item.contractId),
        scopeNo: item.scopeNo,
        group: groups.get(`${item.contractId}|${item.scopeNo}`) ?? "monthly",
        scopeItem: item.scopeItem,
        inspectionDate: date,
        assetArea: item.assetArea,
        failedChecks: scheduled
          ? []
          : CHECKS.filter((check) => check.pick(item) === "NOK").map((check) => check.label),
        measurement:
          scheduled || item.measuredValue === null
            ? null
            : `${formatDecimal(Number(item.measuredValue), 2)}${item.unit ? ` ${item.unit}` : ""}`,
        finding: scheduled ? null : item.finding,
        followUp: scheduled ? null : item.followUp,
        officer: item.officer,
        witness: item.customerWitness,
        timing: scheduled ? ("scheduled" as const) : ("done" as const)
      };
    })
    .sort((a, b) => b.inspectionDate.localeCompare(a.inspectionDate));
}

/** Done, overdue and upcoming inspections per service contract. */
export function getCoverageByContract(data: EpiDemoData): ContractCoverage[] {
  const rows = getServiceScopeRows(data);
  const contracts = [...new Set(rows.map((row) => row.contractId))];
  return contracts.map((contractId) => {
    const own = rows.filter((row) => row.contractId === contractId);
    const required = sum(own.map((row) => row.required));
    const done = sum(own.map((row) => row.done));
    return {
      contractId,
      customer: customerOf(data, contractId),
      required,
      done,
      overdue: sum(own.map((row) => row.overdue)),
      upcoming: sum(own.map((row) => row.upcoming)),
      coverage: required > 0 ? done / required : 0
    };
  });
}

export function getServiceSummary(data: EpiDemoData): ServiceSummary {
  const rows = getServiceScopeRows(data);
  const required = sum(rows.map((row) => row.required));
  const done = sum(rows.map((row) => row.done));
  const upcoming = getServiceInspectionRows(data)
    .filter((row) => row.timing === "scheduled")
    .map((row) => row.inspectionDate)
    .sort();
  return {
    contractCount: new Set(rows.map((row) => row.contractId)).size,
    required,
    done,
    coverage: required > 0 ? done / required : 0,
    overdueInspections: sum(rows.map((row) => row.overdue)),
    overdueItems: rows.filter((row) => row.overdue > 0).length,
    upcomingCount: upcoming.length,
    nextDate: upcoming[0] ?? null
  };
}

/** The next scheduled inspections, soonest first. */
export function getNextInspections(data: EpiDemoData, limit = 5): ServiceInspectionRow[] {
  return getServiceInspectionRows(data)
    .filter((row) => row.timing === "scheduled")
    .sort((a, b) => a.inspectionDate.localeCompare(b.inspectionDate) || a.inspectionId.localeCompare(b.inspectionId))
    .slice(0, limit);
}

export type ServiceFilters = {
  contract: string;
  group: string;
  status: string;
};

export function filterScopeRows(rows: ServiceScopeRow[], filters: ServiceFilters): ServiceScopeRow[] {
  return rows.filter(
    (row) =>
      (filters.contract === "all" || row.contractId === filters.contract) &&
      (filters.group === "all" || row.group === filters.group) &&
      (filters.status === "all" || row.status === filters.status)
  );
}

/** Result filter: "finding" = at least one failed check or a recorded finding. */
export function filterInspectionRows(
  rows: ServiceInspectionRow[],
  filters: { contract: string; group: string; result: string }
): ServiceInspectionRow[] {
  return rows.filter((row) => {
    const hasFinding = row.failedChecks.length > 0 || row.finding !== null;
    return (
      (filters.contract === "all" || row.contractId === filters.contract) &&
      (filters.group === "all" || row.group === filters.group) &&
      (filters.result === "all" ||
        (filters.result === "finding" && hasFinding) ||
        (filters.result === "scheduled" && row.timing === "scheduled") ||
        (filters.result === "clean" && !hasFinding && row.timing === "done"))
    );
  });
}

export function getContractOptions(rows: { contractId: string }[]): string[] {
  return [...new Set(rows.map((row) => row.contractId))].sort();
}

// ---------------------------------------------------------------------------
// S7 Nexa Intelligence: facts behind the scripted answers
// ---------------------------------------------------------------------------

function hasSignedDocument(data: EpiDemoData, projectId: string, documentType: string): boolean {
  return data.baRegister.some(
    (ba) => ba.projectId === projectId && ba.documentType === documentType && ba.status === "Signed"
  );
}

/**
 * Rules KR-06 and KR-07: a BAST needs a signed physical inspection BA, and the
 * Rikmatek and Comtest BAs. It is also billed at 100% progress.
 */
export function getBastGate(data: EpiDemoData, projectId: string): BastGate {
  const progress = getProjectProgress(data, projectId).actual;
  const checks: BastCheck[] = [
    {
      rule: "KR-06",
      label: "BA Pemeriksaan Fisik signed",
      ok: hasSignedDocument(data, projectId, "BA Pemeriksaan Fisik")
    },
    {
      rule: "KR-07",
      label: "BA Rikmatek signed",
      ok: hasSignedDocument(data, projectId, "BA Rikmatek")
    },
    {
      rule: "KR-07",
      label: "BA Comtest signed (BA Testing and Commissioning)",
      ok: hasSignedDocument(data, projectId, "BA Testing and Commissioning")
    },
    {
      rule: "C3-D1",
      label:
        progress !== null && progress >= 1
          ? "Progress is 100%"
          : `Progress is ${formatPercent(progress ?? 0)}, 100% needed`,
      ok: progress !== null && progress >= 1
    }
  ];
  return { allowed: checks.every((check) => check.ok), progress, checks };
}

/** Projects whose realised cost is above their RAP budget, largest overrun first. */
export function getOverRapProjects(data: EpiDemoData): OverRapProject[] {
  return data.projects
    .map((project) => ({ project, money: getCostMargin(data, project.projectId) }))
    .filter(({ money }) => money.rapRemaining < 0)
    .map(({ project, money }) => ({
      projectId: project.projectId,
      customer: project.customerShort,
      overBy: -money.rapRemaining,
      margin: money.margin
    }))
    .sort((a, b) => b.overBy - a.overBy);
}

/** "8 Nov 2026": the as-at date of the data, so no screen types the date by hand. */
export function getAsAtLabel(data: EpiDemoData): string {
  return formatDateLabel(data.asAt);
}

// ---------------------------------------------------------------------------
// Chart data: points, a computed takeaway and the same data as a table
// ---------------------------------------------------------------------------

/** Height of the stub that makes a zero-progress week visible, in points. */
export const ZERO_WEEK_MARKER_PTS = 0.5;
const DUMBBELL_LIMIT = 10;

function chartTable(columns: string[], rows: string[][], hrefs: (string | undefined)[] = []): ChartTable {
  return {
    columns,
    rows: rows.map((cells, index) => {
      const href = hrefs[index];
      return href ? { cells, href } : { cells };
    })
  };
}

/** S1: contract value by status group, split by health. */
export function getValueByStatusChart(data: EpiDemoData): ValueByStatusChartData {
  const points = getValueByStatus(data);
  const total = sum(points.map((point) => point.total));
  const atRisk = sum(points.map((point) => point.atRisk));
  const watch = sum(points.map((point) => point.watch));
  return {
    points,
    takeaway:
      total > 0
        ? `${formatRupiahMillions(atRisk)} (${formatPercent(atRisk / total, 2)}) of the portfolio value is in at-risk projects; ${formatRupiahMillions(watch)} is on watch.`
        : null,
    table: chartTable(
      ["Status group", "Projects", "Contract value", "On track", "Watch", "At risk"],
      points.map((point) => [
        point.label,
        String(point.count),
        formatRupiahMillions(point.total),
        formatRupiahMillions(point.onTrack),
        formatRupiahMillions(point.watch),
        formatRupiahMillions(point.atRisk)
      ])
    )
  };
}

/** S1: plan against actual per in-progress project, worst deviation first, top 10. */
export function getPlanActualDumbbell(data: EpiDemoData, limit = DUMBBELL_LIMIT): DumbbellChartData {
  const rows = getPortfolioRows(data).filter(
    (row) =>
      row.statusGroup === "in-progress" &&
      row.plan !== null &&
      row.actual !== null &&
      row.deviationPts !== null
  );
  const points = rows
    .map((row) => {
      const plan = round((row.plan ?? 0) * 100, 3);
      const actual = round((row.actual ?? 0) * 100, 3);
      return {
        projectId: row.projectId,
        customer: row.customer,
        plan,
        actual,
        deviationPts: row.deviationPts ?? 0,
        gapStart: Math.min(plan, actual),
        gapSize: round(Math.abs(plan - actual), 3)
      };
    })
    .sort((a, b) => a.deviationPts - b.deviationPts || a.projectId.localeCompare(b.projectId))
    .slice(0, limit);

  const behind = rows.filter((row) => (row.deviationPts ?? 0) <= -DEVIATION_ALERT_PTS).length;
  const worst = points[0];
  return {
    points,
    takeaway: worst
      ? `${worst.projectId} is furthest behind plan (${formatPoints(worst.deviationPts)}); ${behind} of ${rows.length} in-progress projects are more than ${DEVIATION_ALERT_PTS} points behind.`
      : null,
    table: chartTable(
      ["Project", "Plan", "Actual", "Deviation"],
      points.map((point) => [
        `${point.projectId} (${point.customer})`,
        formatPctPoints(point.plan),
        formatPctPoints(point.actual),
        formatPoints(point.deviationPts)
      ]),
      points.map((point) => `/ptepi/project/${point.projectId}`)
    )
  };
}

/** Floating-bar waterfall: totals stand on zero, deltas float from the running level. */
export function buildWaterfall(inputs: WaterfallInput[]): WaterfallStep[] {
  let running = 0;
  return inputs.map((input) => {
    if (input.kind === "total") {
      running = input.value;
      return {
        label: input.label,
        kind: "total" as const,
        value: input.value,
        base: 0,
        size: input.value,
        end: input.value,
        direction: "total" as const
      };
    }
    const end = running + input.value;
    const base = Math.min(running, end);
    running = end;
    return {
      label: input.label,
      kind: "delta" as const,
      value: input.value,
      base,
      size: Math.abs(input.value),
      end,
      direction: input.value >= 0 ? ("up" as const) : ("down" as const)
    };
  });
}

function waterfallTable(steps: WaterfallStep[]): ChartTable {
  return chartTable(
    ["Step", "Amount", "Level after"],
    steps.map((step) => [
      step.label,
      step.kind === "total" ? formatRupiahMillions(step.value) : formatSignedMillions(step.value),
      formatRupiahMillions(step.end)
    ])
  );
}

function formatSignedMillions(value: number): string {
  return value > 0 ? `+${formatRupiahMillions(value)}` : formatRupiahMillions(value);
}

/**
 * S2: from contract value to cash for a project with an earning rule and signed BAs.
 * Empty when the project has no component schedule.
 */
/** Waterfall deltas below this share of the contract value are hidden and named in the takeaway. */
const WATERFALL_MIN_SHARE = 0.01;

export function getRevenueWaterfall(data: EpiDemoData, projectId: string): WaterfallChartData {
  const stages = getEarningStages(data, projectId);
  if (stages.length === 0) return { steps: [], takeaway: null, table: chartTable([], []) };

  const contract = getProject(data, projectId).finalContractValue;
  const earned = sum(stages.map((stage) => stage.earnedValue));
  const accrued = getRecognisedRevenue(data, projectId);
  const billed = getBilled(data, projectId);
  const retensiToBill = sum(
    data.paymentStages
      .filter(
        (stage) =>
          stage.projectId === projectId &&
          stage.stageType === "Retensi 5%" &&
          stage.invoiceDate === null &&
          stage.paidDate === null
      )
      .map((stage) => stage.amount)
  );

  // A gap under 1% of the contract value is not drawn: the bar would be a sliver.
  const accrualGap = accrued - earned;
  const gapLabel = accrualGap >= 0 ? "Accrued above signed BA" : "Signed BA above accrual";
  const showGap = Math.abs(accrualGap) >= contract * WATERFALL_MIN_SHARE;
  const steps = buildWaterfall([
    { label: "Contract value", value: contract, kind: "total" },
    { label: "Not yet earned", value: earned - contract, kind: "delta" },
    { label: "Earned with signed BA", value: earned, kind: "total" },
    ...(showGap ? [{ label: gapLabel, value: accrualGap, kind: "delta" as const }] : []),
    { label: "Accrued", value: accrued, kind: "total" },
    {
      label: billed <= accrued ? "Not yet billed" : "Billed above accrual",
      value: billed - accrued,
      kind: "delta"
    },
    { label: "Billed", value: billed, kind: "total" },
    { label: "Retensi 5% still to bill", value: retensiToBill, kind: "total" }
  ]);

  return {
    steps,
    takeaway: `${formatRupiahMillions(earned)} of ${formatRupiahMillions(contract)} is earned with a signed BA (${formatPercent(contract > 0 ? earned / contract : 0, 2)}); ${formatRupiahMillions(billed)} is billed.${showGap ? "" : ` ${gapLabel} by ${formatRupiahMillions(Math.abs(accrualGap))}, under 1% of the contract value, so that bar is not drawn.`}`,
    table: waterfallTable(steps)
  };
}

/** S2: per earning stage (15/15/30/30/10), earned with a signed BA against claimed without one. */
export function getEarningStageChart(data: EpiDemoData, projectId: string): EarningStageChartData {
  const stages = getEarningStages(data, projectId);
  const points = stages.map((stage) => ({
    label: `${stage.stageNo}. ${stage.label}`,
    earned: stage.earnedValue,
    blocked: stage.blockedValue,
    open: Math.max(0, stage.stageValue - stage.earnedValue - stage.blockedValue)
  }));
  const blockedStages = stages.filter((stage) => stage.blockedValue > 0);
  const blocked = sum(blockedStages.map((stage) => stage.blockedValue));
  return {
    points,
    takeaway:
      stages.length === 0
        ? null
        : blocked > 0
          ? `${formatRupiahMillions(blocked)} is claimed without a signed BA, in stage ${blockedStages.map((stage) => stage.stageNo).join(", ")}.`
          : "Every claimed stage has its signed BA.",
    table: chartTable(
      ["Stage", "Earned", "Blocked", "Not started"],
      points.map((point) => [
        point.label,
        formatRupiahMillions(point.earned),
        formatRupiahMillions(point.blocked),
        formatRupiahMillions(point.open)
      ])
    )
  };
}

/** S3: S-curve with the gap to plan up to today and the pace needed to finish on time. */
export function getSCurveChart(data: EpiDemoData, projectId: string): SCurveChartData {
  const curve = getSCurve(data, projectId);
  const week = getWeekCard(data, projectId);
  const recovery = getRecoveryRate(data, projectId);
  const todayWeek = week?.weekNo ?? null;
  const actualToday = week?.actual === null || week?.actual === undefined ? null : round(week.actual * 100, 3);
  const forecast = getProjectForecast(data, projectId);
  const forecastAt = (weekNo: number) =>
    forecast && forecast.pacePerWeek > 0 && todayWeek !== null && actualToday !== null && weekNo >= todayWeek
      ? round(Math.min(100, actualToday + forecast.pacePerWeek * (weekNo - todayWeek)), 3)
      : null;

  // Weeks past the planned schedule, so the forecast can be drawn to its finish.
  const lastWeek = curve[curve.length - 1]?.weekNo ?? 0;
  const extraWeeks = forecast?.finishWeek
    ? Math.min(FORECAST_MAX_EXTRA_WEEKS, Math.max(0, forecast.finishWeek - lastWeek))
    : 0;
  const extended = [
    ...curve,
    ...Array.from({ length: extraWeeks }, (_, index) => ({
      weekNo: lastWeek + index + 1,
      label: `W${lastWeek + index + 1}`,
      plan: null,
      actual: null
    }))
  ];

  const points = extended.map((point) => {
    const measured = point.actual !== null;
    const gap =
      measured && point.plan !== null && point.actual !== null
        ? Math.max(0, round(point.plan - point.actual, 3))
        : null;
    const pace =
      recovery && todayWeek !== null && actualToday !== null && point.weekNo >= todayWeek
        ? round(actualToday + recovery.requiredPerWeek * (point.weekNo - todayWeek), 3)
        : null;
    return {
      weekNo: point.weekNo,
      label: point.label,
      plan: point.plan,
      actual: point.actual,
      gapBase: measured ? point.actual : null,
      gap,
      pace: point.plan === null ? null : pace,
      forecast: forecastAt(point.weekNo)
    };
  });

  const deviation = week?.deviationPts ?? null;
  return {
    points,
    todayLabel: week ? `W${week.weekNo}` : null,
    requiredPace: recovery?.requiredPerWeek ?? null,
    forecastPace: forecast && forecast.pacePerWeek > 0 ? forecast.pacePerWeek : null,
    takeaway:
      week && deviation !== null
        ? `Week ${week.weekNo}: ${formatPoints(deviation)} against plan${recovery ? `; finishing on the planned date needs ${formatDecimal(recovery.requiredPerWeek, 1)} points per week, the last 4 weeks gained ${formatPace(recovery.recentPerWeek)} per week.` : "."}`
        : null,
    table: chartTable(
      ["Week", "Plan", "Actual", "Gap", "Required pace", "Scenario if best pace repeats (ATLAS-estimated)"],
      points.map((point) => [
        point.label,
        point.plan === null ? "-" : formatPctPoints(point.plan),
        point.actual === null ? "-" : formatPctPoints(point.actual),
        point.gap === null ? "-" : formatPointsUnsigned(point.gap),
        point.pace === null ? "-" : formatPctPoints(point.pace),
        point.forecast === null ? "-" : formatPctPoints(point.forecast)
      ])
    )
  };
}

/** S3: progress gained per measured week; weeks at zero are flagged. */
export function getWeeklyIncrements(data: EpiDemoData, projectId: string): WeeklyIncrementChartData {
  const rows = totalRowsOf(data, projectId).filter(
    (row) => row.weekEnd <= data.asAt && row.actualCumulative !== null
  );
  const points = rows.map((row, index) => {
    const previous = rows[index - 1]?.actualCumulative ?? 0;
    const gain = round(((row.actualCumulative ?? 0) - previous) * 100, 3);
    const zero = gain === 0;
    return {
      weekNo: row.weekNo,
      label: `W${row.weekNo}`,
      gain,
      zero,
      marker: zero ? ZERO_WEEK_MARKER_PTS : 0
    };
  });

  const flat = getNoProgressPeriod(data, projectId);
  const last = points[points.length - 1];
  const best = Math.max(0, ...points.map((point) => point.gain));
  const takeaway =
    points.length === 0 || !last
      ? null
      : flat
        ? `No progress in ${flat.label}; the best week gained ${formatDecimal(best, 1)} points.`
        : `Week ${last.weekNo} gained ${formatDecimal(last.gain, 1)} points; the best week gained ${formatDecimal(best, 1)}.`;

  return {
    points,
    takeaway,
    table: chartTable(
      ["Week", "Increment"],
      points.map((point) => [point.label, point.zero ? "0 pts (no progress)" : formatPoints(point.gain)])
    )
  };
}

/** S3: which work packages explain the deviation. Weighted plan and actual are already weight x progress. */
export function getDeficitByComponent(data: EpiDemoData, projectId: string): DeficitChartData {
  const deviation = getProjectProgress(data, projectId).deviationPts;
  const total = deviation === null ? 0 : Math.abs(deviation);
  const points = getWeightBreakdown(data, projectId)
    .filter((row) => row.plan !== null && row.actual !== null)
    .map((row) => {
      const deficitPts = round(((row.plan ?? 0) - (row.actual ?? 0)) * 100, 3);
      return {
        component: row.component,
        label: row.label,
        weight: row.weight,
        deficitPts,
        share: total > 0 ? deficitPts / total : 0
      };
    })
    .sort((a, b) => b.deficitPts - a.deficitPts);
  const top = points[0];
  return {
    points,
    takeaway:
      top && total > 0
        ? `${top.label} explains ${formatPercent(top.share, 2)} of the ${formatPointsUnsigned(total)} deficit (${formatPointsUnsigned(top.deficitPts)}).`
        : null,
    table: chartTable(
      ["Work package", "Weight", "Deficit", "Share of deviation"],
      points.map((point) => [
        point.label,
        formatPercent(point.weight),
        formatPointsUnsigned(point.deficitPts),
        formatPercent(point.share, 2)
      ])
    )
  };
}

/** S5: RAP budget against realised cost per category, for the bullet bars. */
export function getCostChart(data: EpiDemoData, projectId: string): CostChartData {
  const points = getCostByCategory(data, projectId);
  const used = points.filter((point) => point.rapPlanned > 0);
  const over = used.filter((point) => point.cost > point.rapPlanned).length;
  const top = [...used].sort((a, b) => b.cost / b.rapPlanned - a.cost / a.rapPlanned)[0];
  return {
    points: points.map((point) => ({
      ...point,
      usedPct: point.rapPlanned > 0 ? round((point.cost / point.rapPlanned) * 100, 2) : 0,
      over: point.rapPlanned > 0 && point.cost > point.rapPlanned
    })),
    takeaway: top
      ? `${over} of ${used.length} categories are over RAP; ${top.category} has used the most of its budget (${formatPercent(top.cost / top.rapPlanned, 2)}).`
      : null,
    table: chartTable(
      ["Category", "RAP budget", "Realised cost", "Used"],
      points.map((point) => [
        point.category,
        formatRupiahMillions(point.rapPlanned),
        formatRupiahMillions(point.cost),
        point.rapPlanned > 0 ? formatPercent(point.cost / point.rapPlanned, 2) : "-"
      ])
    )
  };
}

/** S5: recognised revenue, less cost per RAP category, equals profit to date. */
export function getMarginBridge(data: EpiDemoData, projectId: string): WaterfallChartData {
  const money = getCostMargin(data, projectId);
  if (money.recognisedRevenue <= 0) return { steps: [], takeaway: null, table: chartTable([], []) };
  const costs = getCostByCategory(data, projectId)
    .filter((point) => point.cost > 0)
    .sort((a, b) => b.cost - a.cost);
  const steps = buildWaterfall([
    { label: "Recognised revenue", value: money.recognisedRevenue, kind: "total" },
    ...costs.map((point) => ({ label: point.category, value: -point.cost, kind: "delta" as const })),
    { label: "Profit to date", value: money.profit, kind: "total" }
  ]);
  const top = costs[0];
  return {
    steps,
    takeaway: top
      ? `${top.category} takes ${formatRupiahMillions(top.cost)} (${formatPercent(top.cost / money.recognisedRevenue, 2)} of revenue); profit to date is ${formatRupiahMillions(money.profit)}, a margin of ${money.margin === null ? "-" : formatPercent(money.margin, 2)}.`
      : null,
    table: waterfallTable(steps)
  };
}

/** S6: inspections done, due (scheduled) and overdue per contract. */
/**
 * S2: revenue carried into next year: contract value the plan does not reach by
 * 31 December (getRevenueBreakdown spillNextYear), per project, largest first.
 */
export function getRevenueCarryOver(data: EpiDemoData): {
  nextYear: number;
  total: number;
  projects: { projectId: string; customer: string; value: number }[];
} {
  const projects = data.projects
    .map((project) => ({
      projectId: project.projectId,
      customer: project.customerShort,
      value: getRevenueBreakdown(data, project.projectId).spillNextYear
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
  return {
    nextYear: Number(data.asAt.slice(0, 4)) + 1,
    total: sum(projects.map((item) => item.value)),
    projects
  };
}

const ID_UNITS = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];

/** A week number in Indonesian words, as on the T1 cover: 19 -> "Sembilan Belas". Up to 99. */
export function weekInWords(n: number): string {
  if (n <= 0 || n >= 100) return String(n);
  if (n < 10) return ID_UNITS[n] ?? String(n);
  if (n === 10) return "Sepuluh";
  if (n === 11) return "Sebelas";
  if (n < 20) return `${ID_UNITS[n - 10]} Belas`;
  const tens = Math.floor(n / 10);
  const units = n % 10;
  return `${ID_UNITS[tens]} Puluh${units ? ` ${ID_UNITS[units]}` : ""}`;
}

/**
 * S7 template T1 (Laporan Pekerjaan Mingguan) for a report week, from governed numbers.
 * Last week = cumulative actual up to the previous week; this week stays empty until the
 * weekly cut-off is entered, so nothing is invented. Null without a component schedule.
 */
export function getWeeklyReportDraft(data: EpiDemoData, projectId: string, weekNo: number): WeeklyReportDraft | null {
  const project = getProject(data, projectId);
  const rows = data.progressWeekly.filter((row) => row.projectId === projectId);
  const weekRows = rows.filter((row) => row.weekNo === weekNo);
  const total = weekRows.find((row) => row.component === "TOTAL");
  if (!total) return null;
  const previousOf = (component: string) =>
    rows.find((row) => row.component === component && row.weekNo === weekNo - 1);
  const thisWeekOf = (component: string) => {
    const row = weekRows.find((item) => item.component === component);
    return row && row.weekEnd <= data.asAt && row.actualCumulative !== null ? row : null;
  };
  const pts = (value: number | null | undefined) => (value === null || value === undefined ? null : round(value * 100, 3));

  const toRow = (component: string, weight: number | null, plan: number | null): WeeklyReportRow => {
    const last = pts(previousOf(component)?.actualCumulative);
    const current = thisWeekOf(component);
    const thisWeek = current && last !== null ? round((pts(current.actualCumulative) ?? 0) - last, 3) : null;
    const toDate = last === null ? null : round(last + (thisWeek ?? 0), 3);
    const planPts = pts(plan);
    return {
      component,
      weight: round((weight ?? 0) * 100, 3),
      lastWeek: last,
      thisWeek,
      toDate,
      plan: planPts,
      deviation: toDate === null || planPts === null ? null : round(toDate - planPts, 3)
    };
  };

  const components = weekRows.filter((row) => row.component !== "TOTAL");
  const reportRows = components.map((row) => toRow(row.component, row.weight, row.planCumulative));
  const totalRow = toRow("TOTAL", 1, total.planCumulative);
  const weightSum = round(sum(reportRows.map((row) => row.weight)), 3);
  const critical = getCriticalItem(data, projectId);
  const flat = getNoProgressPeriod(data, projectId);
  // The evidence of each item sits on its last measured week; the report week has none yet.
  const unsigned = components
    .map((row) => data.baRegister.find((ba) => ba.baId === (thisWeekOf(row.component) ?? previousOf(row.component))?.evidenceBaId))
    .filter((ba): ba is BaRegisterEntry => ba !== undefined && ba.status !== "Signed");
  const reportBa = data.baRegister
    .filter((ba) => ba.projectId === projectId && /weekly report/i.test(ba.documentType) && ba.status === "Signed")
    .sort((a, b) => (b.documentDate ?? "").localeCompare(a.documentDate ?? ""))[0];
  const [customerName, epiName] = (reportBa?.signatoryName ?? "").split(";").map((part) => part.replace(/\(.*\)/, "").trim());
  const start = project.startDate;
  const finish = project.endDateAddendum ?? project.endDate;

  const narrative = [
    totalRow.lastWeek !== null && totalRow.plan !== null
      ? `Up to week ${weekNo - 1} the work reached ${formatPctPoints(totalRow.lastWeek)}; the plan for week ${weekNo} is ${formatPctPoints(totalRow.plan)}, a deviation of ${formatPoints(totalRow.deviation ?? 0)} before this week's progress.`
      : `No measured progress before week ${weekNo}.`,
    ...(flat ? [`No progress was recorded in ${flat.label}.`] : []),
    ...(critical
      ? [`${critical.label} is the critical item: ${formatPercent(critical.weight)} of the weight and ${formatPointsUnsigned(critical.behindPts)} behind plan.`]
      : []),
    `This week's progress is entered at the cut-off on ${formatDateLabel(total.weekEnd)}; ATLAS does not estimate it.`
  ];

  return {
    projectId,
    weekNo,
    weekWords: weekInWords(weekNo),
    periodStart: total.weekStart,
    periodEnd: total.weekEnd,
    cutOff: total.weekEnd,
    contractTitle: project.description,
    owner: project.customerName,
    contractor: "PT Energi Pelabuhan Indonesia",
    contractNumbers: project.contractNumber ?? "-",
    startDate: start,
    finishDate: finish,
    durationDays: start && finish ? daysBetween(start, finish) + 1 : null,
    rows: reportRows,
    total: totalRow,
    narrative,
    checks: [
      { label: "Weights sum to 100", passed: Math.abs(weightSum - 100) < 0.01, detail: `${formatPctPoints(weightSum)}` },
      {
        label: "To date equals last week plus this week",
        passed: reportRows.every((row) => row.toDate === null || row.toDate === round((row.lastWeek ?? 0) + (row.thisWeek ?? 0), 3)),
        detail: "Column 6 = 4 + 5"
      },
      {
        label: "Deviation equals to date minus plan",
        passed: reportRows.every((row) => row.deviation === null || row.deviation === round((row.toDate ?? 0) - (row.plan ?? 0), 3)),
        detail: "Column 8 = 6 - 7"
      },
      {
        label: "Every non-zero item has signed evidence",
        passed: unsigned.length === 0,
        detail: unsigned.length === 0 ? "All BAs signed" : unsigned.map((ba) => `${ba.baId} ${ba.status.toLowerCase()}`).join(", ")
      }
    ],
    signatures: [
      { block: "Menyetujui", role: reportBa?.customerSignatoryRole ?? "Customer", name: customerName || null },
      { block: "Diajukan oleh", role: reportBa?.epiSignatoryRole ?? "EPI Project Manager", name: epiName || null }
    ],
    status: "Draft, needs PM approval"
  };
}

/** Ageing buckets of Retensi held, in days since it fell due. */
const RETENTION_BUCKETS = [
  { label: "0 to 90 days", from: 0, to: 90 },
  { label: "91 to 180 days", from: 91, to: RETENTION_ALERT_DAYS },
  { label: "181 to 365 days", from: RETENTION_ALERT_DAYS + 1, to: 365 },
  { label: "Over 365 days", from: 366, to: Number.POSITIVE_INFINITY }
];

/** S2: Retensi held by age; buckets past RETENTION_ALERT_DAYS are aged. */
export function getRetentionAgeing(data: EpiDemoData): RetentionAgeingChartData {
  const held = data.paymentStages.filter((stage) => stage.retentionHeld > 0);
  const points = RETENTION_BUCKETS.map((bucket) => {
    const items = held.filter(
      (stage) => stage.retentionAgeDays >= bucket.from && stage.retentionAgeDays <= bucket.to
    );
    return {
      label: bucket.label,
      amount: sum(items.map((stage) => stage.retentionHeld)),
      count: items.length,
      aged: bucket.from > RETENTION_ALERT_DAYS
    };
  });
  const total = sum(points.map((point) => point.amount));
  const aged = held.filter((stage) => stage.retentionAgeDays > RETENTION_ALERT_DAYS);
  const oldest = [...held].sort((a, b) => b.retentionAgeDays - a.retentionAgeDays)[0];
  return {
    points,
    total,
    takeaway:
      held.length === 0
        ? null
        : `${formatRupiahMillions(total)} of Retensi held on ${held.length} payment stages; ${formatRupiahMillions(
            sum(aged.map((stage) => stage.retentionHeld))
          )} is older than ${RETENTION_ALERT_DAYS} days${oldest ? `, the oldest ${oldest.projectId} at ${oldest.retentionAgeDays} days` : ""}.`,
    table: chartTable(
      ["Age", "Retensi held", "Payment stages"],
      points.map((point) => [point.label, formatRupiahMillions(point.amount), String(point.count)])
    )
  };
}

export function getCoverageChart(data: EpiDemoData): CoverageChartData {
  const points = getCoverageByContract(data);
  const summary = getServiceSummary(data);
  const lowest = [...points].sort((a, b) => a.coverage - b.coverage)[0];
  return {
    points,
    takeaway: lowest
      ? `${formatPercent(summary.coverage, 2)} of required inspections are done; ${lowest.contractId} is lowest at ${formatPercent(lowest.coverage, 2)} with ${lowest.overdue} overdue.`
      : null,
    table: chartTable(
      ["Contract", "Required", "Done", "Due (scheduled)", "Overdue", "Coverage"],
      points.map((point) => [
        `${point.contractId} (${point.customer})`,
        String(point.required),
        String(point.done),
        String(point.upcoming),
        String(point.overdue),
        formatPercent(point.coverage, 2)
      ])
    )
  };
}

/** S1 hero sentence: how many projects are at risk, and how much value sits in them. */
export function getPortfolioHeadline(data: EpiDemoData): PortfolioHeadline {
  const rows = getPortfolioRows(data);
  const total = rows.length;
  const count = (rating: HealthRating) => rows.filter((row) => row.health.rating === rating).length;
  const atRisk = count("at-risk");
  const watch = count("watch");
  const atRiskValue = sum(
    rows.filter((row) => row.health.rating === "at-risk").map((row) => row.contractValue)
  );
  const portfolioValue = sum(rows.map((row) => row.contractValue));
  return {
    total,
    atRisk,
    watch,
    onTrack: count("on-track"),
    atRiskValue,
    headline:
      atRisk === 0
        ? `All ${total} projects are on track or on watch`
        : `${atRisk} of ${total} projects are at risk`,
    detail: `${watch} more are on watch. ${formatRupiahMillions(atRiskValue)} (${formatPercent(
      portfolioValue > 0 ? atRiskValue / portfolioValue : 0,
      2
    )}) of the portfolio value sits in at-risk projects.`
  };
}

/** Entries of the project filter, in portfolio order. */
export function getProjectFilterOptions(data: EpiDemoData): ProjectFilterOption[] {
  return getPortfolioRows(data).map((row) => ({
    id: row.projectId,
    customer: row.customer,
    stageLabel: row.stageLabel,
    statusGroup: row.statusGroup,
    contractValue: row.contractValue,
    tone: row.health.rating === "on-track" ? "good" : row.health.rating === "at-risk" ? "bad" : "watch"
  }));
}

// ---------------------------------------------------------------------------
// Universal project views: every project has them, so a screen never shows an
// empty panel when a project has no component schedule or no open stage.
// ---------------------------------------------------------------------------

const LIFECYCLE_STEPS = ["Offer", "Procurement", "Contract", "Delivery", "BAST", "Billing", "Retensi", "Closed"];

const LIFECYCLE_INDEX: Record<LifecycleStage, number> = {
  "PROSES PENAWARAN": 0,
  "PROSES PENGADAAN": 1,
  "KONTRAK - MENUNGGU BAMK": 2,
  BERJALAN: 3,
  "BERJALAN - KRITIS": 3,
  "BERJALAN - ADENDUM WAKTU": 3,
  "SELESAI - MENUNGGU BAST": 4,
  "SELESAI - PROSES PENAGIHAN": 5,
  "SELESAI - MASA RETENSI": 6,
  "SELESAI - TUTUP": 7
};

const NEXT_MOVE: Record<number, string | null> = {
  0: "Win the offer to move into procurement.",
  1: "Finish procurement and sign the contract.",
  2: "Sign the BAMK to start delivery.",
  3: "Deliver to 100% progress and get BAST I signed.",
  4: "Get BAST I signed by the customer to open the 95% billing.",
  5: "Invoice and collect the open payment stages.",
  6: "Release the 5% retensi after BAST II.",
  7: null
};

export function getProjectLifecycle(data: EpiDemoData, projectId: string): ProjectLifecycle {
  const project = getProject(data, projectId);
  const index = LIFECYCLE_INDEX[project.stage];
  const closed = index === LIFECYCLE_STEPS.length - 1;
  const dates = [
    { label: "Contract signed", value: project.signedDate },
    { label: "Start", value: project.startDate },
    { label: "Planned end", value: project.endDateAddendum ?? project.endDate }
  ]
    .filter((date): date is { label: string; value: string } => date.value !== null)
    .map((date) => ({ label: date.label, value: formatDateLabel(date.value) }));
  return {
    steps: LIFECYCLE_STEPS.map((label, i) => ({
      label,
      state: i < index || (closed && i === index) ? "done" : i === index ? "current" : "next"
    })),
    currentLabel: STAGE_LABELS[project.stage],
    nextMove: NEXT_MOVE[index] ?? null,
    dates
  };
}

const PAYMENT_STATUS: Record<string, { label: string; tone: PaymentScheduleTone }> = {
  LUNAS: { label: "Paid", tone: "good" },
  DITAGIH: { label: "Invoiced", tone: "neutral" },
  "SIAP DITAGIH": { label: "Ready to bill", tone: "good" },
  "JATUH TEMPO": { label: "Overdue", tone: "bad" },
  TERTAHAN: { label: "Blocked", tone: "bad" },
  "BELUM JATUH SYARAT": { label: "Condition not met yet", tone: "watch" }
};

const STAGE_TYPE_LABELS: Record<PaymentStage["stageType"], string> = {
  "Uang Muka": "Advance (Uang Muka)",
  Termin: "Termin",
  "Pelunasan 95%": "Completion 95%",
  "Retensi 5%": "Retensi 5%"
};

/** Every payment stage of a project in order, paid ones included. */
export function getPaymentSchedule(data: EpiDemoData, projectId: string): PaymentSchedule {
  const stages = data.paymentStages
    .filter((stage) => stage.projectId === projectId)
    .sort((a, b) => a.terminNo - b.terminNo);
  const rows = stages.map((stage) => {
    const status = PAYMENT_STATUS[stage.status] ?? { label: stage.status, tone: "neutral" as const };
    const date = stage.paidDate
      ? `Paid ${formatDateLabel(stage.paidDate)}`
      : stage.invoiceDate
        ? `Invoiced ${formatDateLabel(stage.invoiceDate)}`
        : stage.dueDate
          ? `Due ${formatDateLabel(stage.dueDate)}`
          : null;
    const sameType = stages.filter((other) => other.stageType === stage.stageType).length > 1;
    return {
      paymentId: stage.paymentId,
      label: sameType ? `${STAGE_TYPE_LABELS[stage.stageType]} ${stage.terminNo}` : STAGE_TYPE_LABELS[stage.stageType],
      condition: toEnglish(stage.billingCondition),
      amount: stage.amount,
      statusLabel: status.label,
      tone: status.tone,
      dateLabel: date
    };
  });
  const total = stages.reduce((sum, stage) => sum + stage.amount, 0);
  const paid = stages.filter((stage) => stage.status === "LUNAS").reduce((sum, stage) => sum + stage.amount, 0);
  return { rows, total, paid, paidShare: total > 0 ? paid / total : 0 };
}

/** Evidence documents on file for a project. */
export function getRegisterSummary(data: EpiDemoData, projectId: string): RegisterSummary {
  const docs = data.baRegister.filter((ba) => ba.projectId === projectId);
  const dated = docs
    .filter((ba) => ba.documentDate !== null)
    .sort((a, b) => (b.documentDate ?? "").localeCompare(a.documentDate ?? ""));
  const latest = dated[0] ?? null;
  const signed = docs.filter((ba) => ba.status === "Signed").length;
  return {
    total: docs.length,
    signed,
    notSigned: docs.length - signed,
    latestDocument: latest?.documentType ?? null,
    latestDateLabel: latest?.documentDate ? formatDateLabel(latest.documentDate) : null
  };
}

/** Recognised revenue, accrual of this year and value earned with a signed BA, for one project or all. */
export function getRevenueTrio(data: EpiDemoData, projectId?: string): RevenueTrio {
  const ids = projectId ? [projectId] : data.projects.map((p) => p.projectId);
  return {
    recognisedRevenue: sum(ids.map((id) => getRecognisedRevenue(data, id))),
    accrualThisYear: sum(ids.map((id) => getRevenueBreakdown(data, id).accruedThisYear)),
    earnedWithSignedBa: sum(
      ids.flatMap((id) => getEarningStages(data, id).map((stage) => stage.earnedValue))
    )
  };
}

/** Live portfolio figures beside the Nexa Intelligence chat; the same numbers as S1 to S4. */
export function getNexaContext(data: EpiDemoData): NexaContextKpi[] {
  const totals = getPortfolioTotals(data);
  const billing = getBillingSummary(getBillingRows(data));
  const atRisk = getPortfolioRows(data).filter((row) => row.health.rating === "at-risk").length;
  const hero = getProjectProgress(data, "PNP126");
  const evidence = getEvidenceSummary(getEvidenceStages(data, "PNP126"));
  return [
    {
      label: "Portfolio value",
      value: formatRupiahMillions(totals.contractValue),
      note: `${totals.projectCount} projects`,
      tone: "neutral"
    },
    {
      label: "Projects at risk",
      value: String(atRisk),
      note: `${totals.projectsWithExceptions} with exceptions`,
      tone: atRisk > 0 ? "bad" : "good"
    },
    {
      label: "Blocked from billing",
      value: formatRupiahMillions(billing.blocked.amount),
      note: `${billing.blocked.count} payment stages`,
      tone: billing.blocked.count > 0 ? "bad" : "good"
    },
    {
      label: "Retensi held",
      value: formatRupiahMillions(totals.retentionHeld),
      note: "Due, awaiting BAST II",
      tone: totals.retentionHeld > 0 ? "watch" : "good"
    },
    {
      label: "PNP126 deviation",
      value: hero.deviationPts === null ? "-" : formatPoints(hero.deviationPts),
      note: `${evidence.blocked} ${evidence.blocked === 1 ? "stage" : "stages"} blocked by a missing BA`,
      tone: hero.deviationPts !== null && hero.deviationPts <= -DEVIATION_ALERT_PTS ? "bad" : "neutral"
    }
  ];
}
