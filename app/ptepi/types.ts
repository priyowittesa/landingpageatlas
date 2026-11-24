/**
 * Types for data/epi-demo-data.json (generated from Format Monitoring_synthetic_vF.xlsx).
 * Keys match the JSON exactly. Dates are ISO `YYYY-MM-DD`. Percent/progress
 * fields are fractions (0.28498 = 28.498%). Money is whole Rupiah.
 */

export type DataOrigin = "real" | "synthetic" | "mixed";
export type StatusGroup = "completed" | "in-progress" | "pipeline";

/** DATA MASTER "REMARK" column, verbatim. */
export type LifecycleStage =
  | "PROSES PENAWARAN"
  | "PROSES PENGADAAN"
  | "KONTRAK - MENUNGGU BAMK"
  | "BERJALAN"
  | "BERJALAN - KRITIS"
  | "BERJALAN - ADENDUM WAKTU"
  | "SELESAI - MENUNGGU BAST"
  | "SELESAI - PROSES PENAGIHAN"
  | "SELESAI - MASA RETENSI"
  | "SELESAI - TUTUP";

export type Project = {
  projectId: string;
  no: number;
  /** DATA MASTER section: I completed, II in progress, III pipeline */
  section: "I" | "II" | "III";
  statusGroup: StatusGroup;
  /** Customer header as written in DATA MASTER */
  customerName: string;
  /** Short customer name, e.g. "PT PNP" */
  customerShort: string;
  /** URAIAN PEKERJAAN */
  description: string;
  /** NO KONTRAK */
  contractNumber: string | null;
  /** PENGADAAN / PPBJ */
  procurementMethod: string | null;
  signedDate: string | null;
  startDate: string | null;
  endDate: string | null;
  /** TANGGAL AKHIR KONTRAK (ADENDUM PERPANJANGAN) */
  endDateAddendum: string | null;
  contractValue: number;
  addendumValue: number;
  finalContractValue: number;
  stage: LifecycleStage;
  dataOrigin: DataOrigin;
};

/** PROGRESS_WEEKLY row; `component` is "TOTAL" for the project total. */
export type ProgressWeekly = {
  rowId: string;
  projectId: string;
  weekNo: number;
  weekStart: string;
  weekEnd: string;
  component: string;
  weight: number | null;
  planCumulative: number | null;
  actualCumulative: number | null;
  deviation: number | null;
  earningStage: string | null;
  evidenceBaId: string | null;
  source: string | null;
  asalData: string | null;
};

export type RapBudget = {
  rapId: string;
  projectId: string;
  rapCategory: string;
  rapPlanned: number;
  costActual: number;
  rapRemaining: number;
  absorption: number;
  physicalProgress: number | null;
  marginStatus: string | null;
};

export type PaymentStage = {
  paymentId: string;
  projectId: string;
  terminNo: number;
  stageType: "Uang Muka" | "Termin" | "Pelunasan 95%" | "Retensi 5%";
  billingCondition: string | null;
  contractPct: number | null;
  amount: number;
  conditionMetDate: string | null;
  invoiceNo: string | null;
  invoiceDate: string | null;
  dueDate: string | null;
  paidDate: string | null;
  sapReceiptNo: string | null;
  status: string;
  daysOutstanding: number;
  daysOverdue: number;
  retentionHeld: number;
  retentionAgeDays: number;
  blocker: string | null;
};

export type BaRegisterEntry = {
  baId: string;
  projectId: string;
  documentType: string;
  documentNo: string | null;
  documentDate: string | null;
  component: string | null;
  relatedStage: string | null;
  customerSignatoryRole: string | null;
  epiSignatoryRole: string | null;
  signatoryName: string | null;
  /** Signed | Draft | Belum Ada */
  status: string;
  fileLink: string | null;
  asalData: string | null;
  note: string | null;
  key: string;
};

export type CostLine = {
  projectId: string;
  lineNo: number;
  description: string | null;
  vendor: string | null;
  amount: number;
  procurementMethod: string | null;
  prNo: string | null;
  poNo: string | null;
  sesNo: string | null;
  advanceNo: string | null;
  transactionDate: string | null;
  note: string | null;
  sapDocNo: string | null;
  postingDate: string | null;
  sapAmount: number | null;
  rapCategory: string | null;
};

export type ServiceScope = {
  scopeId: string;
  contractId: string;
  scopeNo: string;
  group: string | null;
  scopeItem: string;
  frequency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  requiredInPeriod: number;
  done: number;
  compliance: number | null;
  status: string | null;
  scopeSource: string | null;
};

export type ServiceInspection = {
  inspectionId: string;
  contractId: string;
  scopeNo: string;
  scopeItem: string;
  inspectionDate: string | null;
  assetArea: string | null;
  visualCheck: string | null;
  thermalCheck: string | null;
  cleanlinessCheck: string | null;
  k3LabelCheck: string | null;
  measuredValue: number | string | null;
  unit: string | null;
  finding: string | null;
  followUp: string | null;
  officer: string | null;
  customerWitness: string | null;
  evidenceLink: string | null;
};

/** DATA_QUALITY section D. `value` meaning depends on the exception. */
export type SeededException = {
  /** 1..12, same numbering as the requirements table 3.4.4 */
  exceptionNo: number;
  projectId: string;
  useCase: string;
  /** Description in Bahasa Indonesia, verbatim */
  exception: string;
  value: number | string | null;
  /** TERDETEKSI when the exception is detected */
  status: string | null;
};

export type EpiDemoData = {
  asAt: string;
  source: string;
  projects: Project[];
  progressWeekly: ProgressWeekly[];
  rapBudget: RapBudget[];
  paymentStages: PaymentStage[];
  baRegister: BaRegisterEntry[];
  costLines: CostLine[];
  serviceScope: ServiceScope[];
  serviceInspection: ServiceInspection[];
  seededExceptions: SeededException[];
};

export type HealthRating = "on-track" | "watch" | "at-risk";
export type ExceptionSeverity = "high" | "medium";

export type HealthSignalCode =
  | "schedule-deviation"
  | "negative-margin"
  | "handover-pending"
  | "billing-overdue"
  | "retention-aged"
  | "billing-blocked"
  | "service-gap"
  | "bamk-pending"
  | "bamk-missing";

export type HealthSignal = {
  code: HealthSignalCode;
  rating: Exclude<HealthRating, "on-track">;
  /** English reason shown next to the health badge. */
  reason: string;
};

export type ProjectHealth = {
  rating: HealthRating;
  reason: string;
  signals: HealthSignal[];
};

export type ProjectProgress = {
  /** Cumulative plan at the as-at date, fraction */
  plan: number | null;
  /** Latest measured cumulative actual, fraction */
  actual: number | null;
  /** actual - plan in percentage points, 3 decimals (-44.989) */
  deviationPts: number | null;
};

export type PortfolioRow = {
  projectId: string;
  description: string;
  customer: string;
  contractValue: number;
  plan: number | null;
  actual: number | null;
  deviationPts: number | null;
  deviationAlert: boolean;
  stage: LifecycleStage;
  stageLabel: string;
  statusGroup: StatusGroup;
  exceptionCount: number;
  health: ProjectHealth;
  dataOrigin: DataOrigin;
};

export type PortfolioTotals = {
  projectCount: number;
  customerCount: number;
  contractValue: number;
  recognisedRevenue: number;
  billed: number;
  /** Recognised revenue not yet invoiced */
  unbilled: number;
  /** billed / recognised revenue, 0..1 */
  billedShare: number;
  retentionHeld: number;
  projectsWithExceptions: number;
};

export type AttentionItem = {
  exceptionNo: number;
  projectId: string;
  customer: string;
  label: string;
  severity: ExceptionSeverity;
};

export type AttentionGroup = {
  severity: ExceptionSeverity;
  items: AttentionItem[];
};

export type ValueByStatusPoint = {
  statusGroup: StatusGroup;
  label: string;
  total: number;
  count: number;
  onTrack: number;
  watch: number;
  atRisk: number;
};

/** Revenue split of one project, same definitions as the DATA MASTER columns. */
export type RevenueBreakdown = {
  /** Accrued up to 31 Dec of the previous year */
  accruedPrevYears: number;
  /** Accrued this year up to the as-at date */
  accruedThisYear: number;
  /** Taksasi: planned revenue of this year (after previous years) */
  estimateThisYear: number;
  /** Taksasi not yet accrued: estimate minus accrued this year */
  estimateRemaining: number;
  /** Spill over into next year */
  spillNextYear: number;
};

/**
 * billable = condition met AND required BA signed; awaiting-bast = Retensi 5% that is due
 * but BAST II is not signed; blocked = held by an unmet condition or an unsigned BA.
 */
export type BillingReadiness = "billable" | "awaiting-bast" | "blocked" | "invoiced" | "not-due";

/** signed = BA signed; draft = BA exists but unsigned; missing = not in the register; none = no BA required */
export type DocStatus = "signed" | "draft" | "missing" | "none";

/** An open (unpaid) payment stage with its readiness. */
export type BillingRow = {
  paymentId: string;
  projectId: string;
  customer: string;
  stageType: PaymentStage["stageType"];
  condition: string | null;
  amount: number;
  readiness: BillingReadiness;
  /** Required BA, e.g. "BAST I"; null when the condition is a progress threshold */
  requiredDocument: string | null;
  /** Customer role that must sign the required BA */
  expectedSigner: string | null;
  docStatus: DocStatus;
  /** Why a stage is blocked, or the warning on a billable stage whose BA is not signed */
  reason: string | null;
  dataOrigin: DataOrigin;
};

export type BillingSummary = Record<
  BillingReadiness,
  { count: number; amount: number }
>;

/** Invoiced amounts up to the as-at date (DATA MASTER "Tagihan" columns). */
export type BilledByType = {
  termin: number;
  ninetyFive: number;
  retention: number;
};

export type RevenueTotals = {
  accruedThisYear: number;
  estimateRemaining: number;
  spillNextYear: number;
};

export type RevenueChartPoint = {
  projectId: string;
  accrued: number;
  estimateRemaining: number;
};

/**
 * One stage vocabulary for S2 and S4. Earned = signed BA on file; Blocked = progress
 * claimed without a signed BA; Not started = nothing claimed yet.
 */
export type EarningStageStatus = "earned" | "blocked" | "not-started";

/** One earning-rule stage (15/15/30/30/10) rolled up over the components of a project. */
export type EarningStageRow = {
  stageNo: number;
  label: string;
  weight: number;
  requiredDocument: string;
  stageValue: number;
  earnedValue: number;
  /** Stage claimed but the required BA is not signed */
  blockedValue: number;
  signedCount: number;
  requiredCount: number;
  status: EarningStageStatus;
  dataOrigin: DataOrigin;
};

// ---- S3 project cockpit ----

export type ProjectInfo = {
  projectId: string;
  customer: string;
  customerFullName: string;
  description: string;
  contractNumber: string | null;
  contractValue: number;
  startDate: string | null;
  endDate: string | null;
  /** End date after a time addendum, when there is one */
  endDateAddendum: string | null;
  stage: LifecycleStage;
  stageLabel: string;
  statusGroup: StatusGroup;
  health: ProjectHealth;
  /** real when the weekly schedule comes from a real report */
  progressOrigin: DataOrigin;
};

/** One week of the S-curve. Values are percentage points (0..100). */
export type SCurvePoint = {
  weekNo: number;
  label: string;
  plan: number | null;
  /** null for weeks that have not been measured yet */
  actual: number | null;
};

export type WeekCard = {
  weekNo: number;
  weekStart: string;
  weekEnd: string;
  plan: number | null;
  actual: number | null;
  deviationPts: number | null;
  /** Progress gained during this week, percentage points */
  gainPts: number | null;
};

export type WeightRow = {
  component: string;
  /** Component name without the roman numeral, e.g. "Panel SVGm" */
  label: string;
  /** Share of the project, fraction */
  weight: number;
  /** Same share in percentage points, for bar widths */
  weightPts: number;
  /** Cumulative plan and actual of this component, fractions of the project */
  plan: number | null;
  actual: number | null;
};

export type RecoveryRate = {
  /** Points still to earn: 100 - actual */
  remainingPts: number;
  weeksRemaining: number;
  /** Points per week needed to finish on the last planned week */
  requiredPerWeek: number;
  /** Best weekly gain achieved so far */
  bestPerWeek: number;
  /** requiredPerWeek / bestPerWeek, null when the project never progressed */
  ratioToBest: number | null;
  /** Average weekly gain over the last 4 measured weeks */
  recentPerWeek: number;
  /** Consecutive latest weeks at the same cumulative actual */
  flatWeeks: number;
  flatFromWeek: number | null;
  flatToWeek: number | null;
};

export type CostMargin = {
  contractValue: number;
  /** (contract value - RAP) / contract value: the margin the budget promises */
  plannedMargin: number | null;
  cost: number;
  rapPlanned: number;
  /** RAP minus cost; negative means over RAP */
  rapRemaining: number;
  recognisedRevenue: number;
  profit: number;
  /** (revenue - cost) / revenue, null when nothing is recognised yet. Includes vendor advances. */
  margin: number | null;
  /** Vendor advances (uang muka) paid without an SES: in cost, not yet delivered */
  vendorAdvances: number;
  /** Vendor advances / realised cost */
  advancesShareOfCost: number | null;
};

export type CriticalItem = {
  component: string;
  label: string;
  weight: number;
  /** How far the component is behind plan, percentage points of the project */
  behindPts: number;
  claimedStage: string | null;
};

export type ProjectExceptionItem = {
  exceptionNo: number;
  label: string;
  severity: ExceptionSeverity;
};

// ---- S4 evidence gate ----

/** Autonomy ladder: L0 Inform, L1 Recommend, L2 Act with approval. */
export type ActionAutonomy = "L0" | "L1" | "L2";

export type EvidenceStatus = EarningStageStatus;
export type GateResult = "can-earn" | "blocked";

/** One component (or the whole system) at one earning stage. */
export type StageUnit = {
  unit: string;
  claimed: boolean;
  status: EvidenceStatus;
  /** Why the unit is not complete, null when it is */
  issue: string | null;
  baId: string | null;
  documentNo: string | null;
  documentDate: string | null;
  signerRole: string | null;
  fileLink: string | null;
  note: string | null;
  /** Share of the contract value tied to this unit at this stage */
  value: number;
};

export type EvidenceStage = {
  stageNo: number;
  label: string;
  weight: number;
  /** Document the kick-off BA requires */
  requiredDocument: string;
  /** Register document type that proves the stage */
  documentType: string;
  /** Customer role that must sign */
  expectedSigner: string;
  additionalRequirement: string | null;
  /** Latest signing date among the complete units */
  signedDate: string | null;
  status: EvidenceStatus;
  gate: { result: GateResult; reason: string };
  units: StageUnit[];
  stageValue: number;
  /** Value claimed without a signed BA */
  blockedValue: number;
  dataOrigin: DataOrigin;
};

export type EvidenceSummary = {
  canEarn: number;
  blocked: number;
  /** Units claimed in the report without a signed BA */
  claimedWithoutBa: number;
  blockedValue: number;
  notStarted: number;
};

/** What the Evidence agent recommends when a stage is blocked (autonomy L1). */
export type SuggestedAction = {
  title: string;
  projectId: string;
  ownerRole: string;
  dueDate: string;
  source: string;
  autonomy: ActionAutonomy;
  issue?: string;
};

export type RegisterRow = {
  baId: string;
  documentType: string;
  documentNo: string | null;
  documentDate: string | null;
  component: string | null;
  relatedStage: string | null;
  customerSigner: string | null;
  epiSigner: string | null;
  status: string;
  fileLink: string | null;
  note: string | null;
  dataOrigin: DataOrigin;
};

// ---- S5 procurement and cost ----

export type CostFlagCode =
  | "missing-po"
  | "missing-ses"
  | "advance-without-ses"
  | "paid-without-document"
  | "not-posted"
  | "petty-cash-open";

export type CostLineFlag = {
  code: CostFlagCode;
  /** high: money left the company without the document; watch: a document is still due */
  severity: "high" | "watch";
  label: string;
};

export type CostLineRow = {
  projectId: string;
  lineNo: number;
  /** Uraian */
  item: string;
  /** Pelaksana: vendor or petty cash */
  executor: string;
  method: string;
  prNo: string | null;
  poNo: string | null;
  sesNo: string | null;
  /** Kas uang muka (advance or petty cash number) */
  advanceNo: string | null;
  transactionDate: string | null;
  /** Posted = SAP document number and posting date exist */
  paymentStatus: "Posted" | "Not posted";
  sapDocNo: string | null;
  amount: number;
  category: string;
  note: string | null;
  flags: CostLineFlag[];
};

/** RAP budget against the cost lines of one category. */
export type CostCategoryPoint = {
  category: string;
  rapPlanned: number;
  cost: number;
};

export type ProjectCostView = {
  projectId: string;
  customer: string;
  margin: CostMargin;
  categories: CostCategoryPoint[];
  lines: CostLineRow[];
  /** Bullet-bar chart and margin bridge with their computed takeaways */
  chart: CostChartData;
  bridge: WaterfallChartData;
};

export type CostPortfolio = {
  projectCount: number;
  rapPlanned: number;
  cost: number;
  recognisedRevenue: number;
  /** (recognised revenue - cost) / recognised revenue */
  margin: number | null;
  flaggedLines: number;
  flaggedProjects: number;
  overRapProjects: number;
};

// ---- S6 service contracts ----

export type ScopeStatus = "compliant" | "short" | "not-done";

/** One contracted inspection item with its delivery against the period. */
export type ServiceScopeRow = {
  scopeId: string;
  contractId: string;
  customer: string;
  scopeNo: string;
  /** Weekly or monthly */
  group: "weekly" | "monthly";
  scopeItem: string;
  periodStart: string | null;
  periodEnd: string | null;
  required: number;
  done: number;
  /** Required but not carried out, once the period has ended */
  overdue: number;
  /** Inspections scheduled after the as-at date */
  upcoming: number;
  /** done / required, fraction */
  compliance: number;
  status: ScopeStatus;
  /** Where the scope comes from, e.g. the IKT minutes */
  scopeSource: string | null;
};

export type InspectionTiming = "done" | "scheduled";

export type ServiceInspectionRow = {
  inspectionId: string;
  contractId: string;
  customer: string;
  scopeNo: string;
  group: "weekly" | "monthly";
  scopeItem: string;
  inspectionDate: string;
  assetArea: string | null;
  /** Checks that failed, e.g. ["Visual"]; empty when all are OK */
  failedChecks: string[];
  measurement: string | null;
  finding: string | null;
  followUp: string | null;
  officer: string | null;
  witness: string | null;
  timing: InspectionTiming;
};

export type ContractCoverage = {
  contractId: string;
  customer: string;
  required: number;
  done: number;
  overdue: number;
  /** Scheduled after the as-at date */
  upcoming: number;
  /** done / required, fraction */
  coverage: number;
};

export type ServiceSummary = {
  contractCount: number;
  required: number;
  done: number;
  coverage: number;
  overdueInspections: number;
  overdueItems: number;
  upcomingCount: number;
  nextDate: string | null;
};

// ---- S7 Nexa Intelligence ----

export type BastCheck = {
  /** Rule id, e.g. KR-06 */
  rule: string;
  label: string;
  ok: boolean;
};

/** Whether a BAST can be drafted: KR-06 (physical inspection) and KR-07 (Rikmatek, Comtest). */
export type BastGate = {
  allowed: boolean;
  /** Latest measured progress, fraction */
  progress: number | null;
  checks: BastCheck[];
};

export type OverRapProject = {
  projectId: string;
  customer: string;
  /** Cost minus RAP, in Rupiah */
  overBy: number;
  margin: number | null;
};

// ---- Chart data: every chart gets points, a computed takeaway and a table of the same data ----

export type ChartTableRow = { cells: string[]; href?: string };
export type ChartTable = { columns: string[]; rows: ChartTableRow[] };

export type ValueByStatusChartData = {
  points: ValueByStatusPoint[];
  takeaway: string | null;
  table: ChartTable;
};

/** One project of the plan-vs-actual dumbbell; values in percentage points (0..100). */
export type DumbbellPoint = {
  projectId: string;
  customer: string;
  plan: number;
  actual: number;
  deviationPts: number;
  /** Where the connecting bar starts and how long it is */
  gapStart: number;
  gapSize: number;
};

export type DumbbellChartData = {
  points: DumbbellPoint[];
  takeaway: string | null;
  table: ChartTable;
};

export type WaterfallInput = { label: string; value: number; kind: "total" | "delta" };

export type WaterfallStep = {
  label: string;
  kind: "total" | "delta";
  /** The total, or the signed change */
  value: number;
  /** Invisible bar below the visible one, and the visible bar's length */
  base: number;
  size: number;
  /** Running level after this step */
  end: number;
  direction: "total" | "up" | "down";
};

export type WaterfallChartData = {
  steps: WaterfallStep[];
  takeaway: string | null;
  table: ChartTable;
};

export type EarningStageChartPoint = {
  label: string;
  earned: number;
  blocked: number;
  open: number;
};

export type EarningStageChartData = {
  points: EarningStageChartPoint[];
  takeaway: string | null;
  table: ChartTable;
};

/** S-curve week in percentage points, with the shaded gap and the required-pace line. */
export type SCurveChartPoint = {
  weekNo: number;
  label: string;
  plan: number | null;
  actual: number | null;
  /** Stacked under the gap so only the gap is shaded */
  gapBase: number | null;
  gap: number | null;
  pace: number | null;
};

export type SCurveChartData = {
  points: SCurveChartPoint[];
  /** Label of the as-at week, drawn as the today marker */
  todayLabel: string | null;
  /** Points per week needed to finish on the planned date */
  requiredPace: number | null;
  takeaway: string | null;
  table: ChartTable;
};

export type IncrementPoint = {
  weekNo: number;
  label: string;
  /** Progress gained in the week, points */
  gain: number;
  zero: boolean;
  /** Stub drawn for zero-progress weeks so they are visible; 0 otherwise */
  marker: number;
};

export type WeeklyIncrementChartData = {
  points: IncrementPoint[];
  takeaway: string | null;
  table: ChartTable;
};

export type DeficitPoint = {
  component: string;
  label: string;
  weight: number;
  deficitPts: number;
  /** Share of the project deviation, fraction */
  share: number;
};

export type DeficitChartData = {
  points: DeficitPoint[];
  takeaway: string | null;
  table: ChartTable;
};

/** A RAP category as a share of its budget used, for readable small categories. */
export type CostUsagePoint = CostCategoryPoint & {
  /** cost / RAP budget x 100; 0 when there is no budget */
  usedPct: number;
  over: boolean;
};

export type CostChartData = {
  points: CostUsagePoint[];
  takeaway: string | null;
  table: ChartTable;
};

export type CoverageChartData = {
  points: ContractCoverage[];
  takeaway: string | null;
  table: ChartTable;
};

/** S1 hero: the one sentence the portfolio view opens with. */
export type PortfolioHeadline = {
  total: number;
  atRisk: number;
  watch: number;
  onTrack: number;
  /** Contract value in at-risk projects */
  atRiskValue: number;
  headline: string;
  detail: string;
};

/** One entry of the project filter. */
export type ProjectFilterOption = {
  id: string;
  customer: string;
  stageLabel: string;
  statusGroup: StatusGroup;
  contractValue: number;
  tone: "good" | "watch" | "bad";
};

// ---- Universal project views (every project has them) ----

export type LifecycleStepState = "done" | "current" | "next";

export type LifecycleStep = {
  label: string;
  state: LifecycleStepState;
};

/** Where a project sits in the contractor lifecycle, from offer to close. */
export type ProjectLifecycle = {
  steps: LifecycleStep[];
  currentLabel: string;
  /** What has to happen to move to the next step, null once closed */
  nextMove: string | null;
  dates: { label: string; value: string }[];
};

export type PaymentScheduleTone = "good" | "watch" | "bad" | "neutral";

export type PaymentScheduleRow = {
  paymentId: string;
  label: string;
  condition: string | null;
  amount: number;
  statusLabel: string;
  tone: PaymentScheduleTone;
  /** Most relevant date for the status (paid, invoiced or due), already formatted */
  dateLabel: string | null;
};

export type PaymentSchedule = {
  rows: PaymentScheduleRow[];
  total: number;
  paid: number;
  /** Share of the scheduled value already paid, 0..1 */
  paidShare: number;
};

/** Evidence on file for a project, for screens without a component schedule. */
export type RegisterSummary = {
  total: number;
  signed: number;
  notSigned: number;
  latestDocument: string | null;
  latestDateLabel: string | null;
};

/** The three revenue figures, with the same labels on S1, S2 and S3. */
export type RevenueTrio = {
  recognisedRevenue: number;
  accrualThisYear: number;
  earnedWithSignedBa: number;
};
