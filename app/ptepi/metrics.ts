import {
  CRITICAL_ITEM_LAG_PTS,
  DEVIATION_ALERT_PTS,
  DEVIATION_CRITICAL_PTS,
  OVERDUE_ALERT_DAYS,
  RETENTION_ALERT_DAYS
} from "./thresholds";

/**
 * The metric dictionary: every figure the prototype shows, with one formula and
 * the selector that computes it. Screens never compute a metric themselves;
 * charts read their formula tooltip from here.
 */

export type MetricUnit = "Rp" | "%" | "pts" | "pts/week" | "count" | "days";

/** `selectors.<function>` or `action-helpers.<function>`; checked by the tests. */
export type MetricOwner = `selectors.${string}` | `action-helpers.${string}`;

export type Metric = {
  id: string;
  label: string;
  unit: MetricUnit;
  /** One line, no jargon beyond the EPI terms */
  formula: string;
  /** What turns the metric into an alert, or null when it is only informative */
  threshold: string | null;
  owner: MetricOwner;
  /** Screens that show it, S1 to S8 */
  screens: string[];
};

export const METRICS = [
  {
    id: "plan",
    label: "Plan progress",
    unit: "%",
    formula: "Cumulative planned progress of the latest week that has started by the as-at date.",
    threshold: null,
    owner: "selectors.getProjectProgress",
    screens: ["S1", "S3"]
  },
  {
    id: "actual",
    label: "Actual progress",
    unit: "%",
    formula: "Highest measured cumulative actual of a week that has ended by the as-at date.",
    threshold: null,
    owner: "selectors.getProjectProgress",
    screens: ["S1", "S3"]
  },
  {
    id: "deviation",
    label: "Deviation",
    unit: "pts",
    formula: "(Actual - plan) x 100, in percentage points.",
    threshold: `More than ${DEVIATION_ALERT_PTS} pts behind: watch. ${DEVIATION_CRITICAL_PTS} pts or more: at risk.`,
    owner: "selectors.getProjectProgress",
    screens: ["S1", "S3", "S7"]
  },
  {
    id: "requiredPace",
    label: "Required pace",
    unit: "pts/week",
    formula: "(100 - actual) / weeks left on the plan, in points per week.",
    threshold: "Compared with the best week so far.",
    owner: "selectors.getRecoveryRate",
    screens: ["S3", "S7"]
  },
  {
    id: "flatWeeks",
    label: "Weeks without progress",
    unit: "count",
    formula: "Consecutive latest weeks at the same cumulative actual, counting the week that level was reached.",
    threshold: "Two weeks or more is flagged.",
    owner: "selectors.getRecoveryRate",
    screens: ["S3"]
  },
  {
    id: "weeklyIncrement",
    label: "Weekly increment",
    unit: "pts",
    formula: "Cumulative actual of the week minus the cumulative actual of the week before, x 100.",
    threshold: "A week at 0 pts is a zero-progress week.",
    owner: "selectors.getWeeklyIncrements",
    screens: ["S3"]
  },
  {
    id: "criticalItemLag",
    label: "Critical item lag",
    unit: "pts",
    formula: "Plan minus actual of the heaviest component, in points of the project.",
    threshold: `More than ${CRITICAL_ITEM_LAG_PTS} pts behind plan.`,
    owner: "selectors.getCriticalItem",
    screens: ["S3", "S7"]
  },
  {
    id: "componentDeficit",
    label: "Deficit per work package",
    unit: "pts",
    formula: "Weight x (component plan - component actual); the packages add up to the project deviation.",
    threshold: null,
    owner: "selectors.getDeficitByComponent",
    screens: ["S3"]
  },
  {
    id: "contractValue",
    label: "Contract value",
    unit: "Rp",
    formula: "Contract value plus addendum value (value after addendum).",
    threshold: null,
    owner: "selectors.getPortfolioTotals",
    screens: ["S1", "S3"]
  },
  {
    id: "contractValueByStatus",
    label: "Contract value by status group",
    unit: "Rp",
    formula: "Sum of final contract value per status group, split by project health.",
    threshold: null,
    owner: "selectors.getValueByStatusChart",
    screens: ["S1"]
  },
  {
    id: "recognisedRevenue",
    label: "Recognised revenue",
    unit: "Rp",
    formula: "Final contract value x measured progress, since the start of the contract.",
    threshold: null,
    owner: "selectors.getRecognisedRevenue",
    screens: ["S1", "S3", "S5"]
  },
  {
    id: "accrualRevenue",
    label: "Accrual revenue 2026",
    unit: "Rp",
    formula: "Recognised revenue minus what was recognised up to 31 Dec of the previous year.",
    threshold: null,
    owner: "selectors.getRevenueTotals",
    screens: ["S2"]
  },
  {
    id: "taksasiRevenue",
    label: "Taksasi revenue",
    unit: "Rp",
    formula: "Planned revenue of this year (plan to 31 Dec) minus the accrual so far.",
    threshold: null,
    owner: "selectors.getRevenueTotals",
    screens: ["S2"]
  },
  {
    id: "billed",
    label: "Billed",
    unit: "Rp",
    formula: "Sum of Tagihan with an invoice date on or before the as-at date.",
    threshold: null,
    owner: "selectors.getPortfolioTotals",
    screens: ["S1", "S2"]
  },
  {
    id: "unbilled",
    label: "Unbilled",
    unit: "Rp",
    formula: "Recognised revenue minus billed, never below zero.",
    threshold: null,
    owner: "selectors.getPortfolioTotals",
    screens: ["S1"]
  },
  {
    id: "billable",
    label: "Billable now",
    unit: "Rp",
    formula: "Unpaid payment stages that are ready to invoice, with no invoice yet.",
    threshold: null,
    owner: "selectors.getBillingSummary",
    screens: ["S2", "S7"]
  },
  {
    id: "blockedBilling",
    label: "Blocked from billing",
    unit: "Rp",
    formula: "Unpaid payment stages held by a missing BA or an unmet condition.",
    threshold: "Any held stage.",
    owner: "selectors.getBillingSummary",
    screens: ["S2", "S7"]
  },
  {
    id: "invoiceOverdue",
    label: "Invoice overdue",
    unit: "days",
    formula: "As-at date minus the due date of an unpaid invoice.",
    threshold: `More than ${OVERDUE_ALERT_DAYS} days.`,
    owner: "selectors.getProjectHealth",
    screens: ["S1"]
  },
  {
    id: "retentionHeld",
    label: "Retensi held",
    unit: "Rp",
    formula: "Retensi 5% whose condition is met and which is not yet paid.",
    threshold: `Held more than ${RETENTION_ALERT_DAYS} days.`,
    owner: "selectors.getPortfolioTotals",
    screens: ["S1", "S2"]
  },
  {
    id: "earnedValue",
    label: "Earned by signed BA",
    unit: "Rp",
    formula: "Contract value x stage weight (15/15/30/30/10) x component share, for stages claimed with a signed BA.",
    threshold: null,
    owner: "selectors.getEarningStages",
    screens: ["S2", "S4"]
  },
  {
    id: "blockedByBa",
    label: "Claimed without signed BA",
    unit: "Rp",
    formula: "Same value as earned, for stages claimed in the report without a signed BA.",
    threshold: "Any amount.",
    owner: "selectors.getEarningStages",
    screens: ["S2", "S4"]
  },
  {
    id: "revenueWaterfall",
    label: "Contract value to cash",
    unit: "Rp",
    formula: "Contract value, earned with signed BA, accrued, billed and Retensi still to bill.",
    threshold: null,
    owner: "selectors.getRevenueWaterfall",
    screens: ["S2"]
  },
  {
    id: "cost",
    label: "Realised cost",
    unit: "Rp",
    formula: "Sum of the dated cost lines of the project, by RAP category.",
    threshold: null,
    owner: "selectors.getCostMargin",
    screens: ["S3", "S5"]
  },
  {
    id: "rapRemaining",
    label: "Left in RAP",
    unit: "Rp",
    formula: "RAP budget minus realised cost; negative means over RAP.",
    threshold: "Below zero is over RAP.",
    owner: "selectors.getCostMargin",
    screens: ["S5"]
  },
  {
    id: "margin",
    label: "Margin",
    unit: "%",
    formula: "(Recognised revenue - cost) / recognised revenue.",
    threshold: "Below zero is a loss.",
    owner: "selectors.getCostMargin",
    screens: ["S3", "S5"]
  },
  {
    id: "plannedMargin",
    label: "Margin at RAP budget",
    unit: "%",
    formula: "(Contract value - RAP budget) / contract value.",
    threshold: null,
    owner: "selectors.getCostMargin",
    screens: ["S5"]
  },
  {
    id: "marginBridge",
    label: "Margin bridge",
    unit: "Rp",
    formula: "Recognised revenue, less cost per RAP category, equals profit to date.",
    threshold: null,
    owner: "selectors.getMarginBridge",
    screens: ["S5"]
  },
  {
    id: "coverage",
    label: "Inspection coverage",
    unit: "%",
    formula: "Inspections done / inspections required in the period.",
    threshold: "Below 100% with the period ended is overdue.",
    owner: "selectors.getServiceSummary",
    screens: ["S6", "S7"]
  },
  {
    id: "overdueInspections",
    label: "Overdue inspections",
    unit: "count",
    formula: "Required minus done, for scope items whose period has ended.",
    threshold: "Any item.",
    owner: "selectors.getCoverageByContract",
    screens: ["S6", "S7"]
  },
  {
    id: "healthRating",
    label: "Health rating",
    unit: "count",
    formula: "At risk, watch or on track, from the named signals of the project.",
    threshold: "Any at-risk signal rates the project at risk.",
    owner: "selectors.getProjectHealth",
    screens: ["S1", "S3"]
  },
  {
    id: "projectsWithExceptions",
    label: "Projects with exceptions",
    unit: "count",
    formula: "Projects with at least one detected seeded exception.",
    threshold: null,
    owner: "selectors.getPortfolioTotals",
    screens: ["S1"]
  },
  {
    id: "actionsByOwner",
    label: "Open actions by owner role",
    unit: "count",
    formula: "Actions that are open or in progress, grouped by owner role.",
    threshold: null,
    owner: "action-helpers.getActionsByOwner",
    screens: ["S8"]
  },
  {
    id: "actionAging",
    label: "Action due-date buckets",
    unit: "count",
    formula: "Unfinished actions grouped by days from the as-at date to the due date.",
    threshold: "Past the due date is overdue.",
    owner: "action-helpers.getAgingBuckets",
    screens: ["S8"]
  }
] as const satisfies readonly Metric[];

export type MetricId = (typeof METRICS)[number]["id"];

export function getMetric(id: MetricId): Metric {
  const metric: Metric | undefined = METRICS.find((item) => item.id === id);
  if (!metric) throw new Error(`Unknown metric: ${id}`);
  return metric;
}
