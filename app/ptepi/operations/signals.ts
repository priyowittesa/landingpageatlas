import { buildAllAnswers } from "../ask-atlas/answers";
import {
  formatDate,
  formatDecimal,
  formatPctPoints,
  formatPercent,
  formatPoints,
  formatRupiahMillions,
  formatWeekRange
} from "../format";
import {
  addDays,
  getBillingRows,
  getBillingSummary,
  getCoverageByContract,
  getCriticalItem,
  getDataQualityFlags,
  getEvidenceStages,
  getEvidenceSummary,
  getNoProgressPeriod,
  getPortfolioHeadline,
  getPortfolioRows,
  getProjectForecast,
  getRecoveryRate,
  getSuggestedAction,
  getWeekCard
} from "../selectors";
import { buildSeedActions } from "../store/action-helpers";
import type { EpiAction, NewEpiAction } from "../store/actions-store";
import { findOpenMatch } from "../store/actions-store";
import type { EpiDemoData } from "../types";

/** What the signal is: what is happening, what to do about it, or what is likely to happen. */
export type SignalKind = "insight" | "recommendation" | "prediction";
export type SignalLevel = "risk" | "watch";
/** What is at stake, so the reader can scan by value. */
export type ValueTag = "revenue" | "cost" | "schedule" | "compliance";
export type SignalModule = "portfolio" | "cockpit" | "evidence" | "commercial" | "cost" | "service";

export const SIGNAL_MODULES: Record<SignalModule, { label: string; href: (projectId: string) => string }> = {
  portfolio: { label: "Portfolio health", href: () => "/ptepi/portfolio" },
  cockpit: { label: "Project cockpit", href: (id) => `/ptepi/project/${id}` },
  evidence: { label: "Evidence gate", href: (id) => `/ptepi/project/${id}/evidence` },
  commercial: { label: "Commercial and billing", href: (id) => `/ptepi/commercial?project=${id}` },
  cost: { label: "Procurement and cost", href: (id) => `/ptepi/cost?project=${id}` },
  service: { label: "Service contracts", href: () => "/ptepi/service-contracts" }
};

export type SignalMetric = { label: string; value: string };

export type Signal = {
  id: string;
  kind: SignalKind;
  module: SignalModule;
  level: SignalLevel;
  tags: ValueTag[];
  projectId: string;
  title: string;
  summary: string;
  /** Two headline figures shown on the row */
  metrics: [SignalMetric, SignalMetric];
  /** Why ATLAS flagged it: the facts behind the title */
  evidence: string[];
  /** What the numbers rest on, shown in the drawer */
  basis: string[];
  /** The one action a person can take from here; ATLAS never executes it */
  action: NewEpiAction;
  /** A date or figure that ATLAS estimates rather than reads from a document */
  estimated: boolean;
};

const OWNER = {
  pm: "Project Manager",
  director: "SM Operasi dan Teknik",
  planning: "Manager Perencanaan",
  admin: "Admin Proyek",
  finance: "Finance"
} as const;

const DUE_DAYS = 7;

function action(
  data: EpiDemoData,
  input: { title: string; projectId: string; ownerRole: string; issue: string; dueInDays?: number }
): NewEpiAction {
  return {
    title: input.title,
    projectId: input.projectId,
    ownerRole: input.ownerRole,
    dueDate: addDays(data.asAt, input.dueInDays ?? DUE_DAYS),
    source: `Operations Intelligence: ${input.issue} ${input.projectId}`,
    autonomy: "L1",
    issue: input.issue
  };
}

const HERO = "PNP126";

/**
 * Everything ATLAS wants a person to look at, from the governed numbers: insights say what is
 * happening, recommendations say what to do, predictions say what is likely to happen.
 * Pure: the same data gives the same signals. Most severe first, then by kind.
 */
export function getSignals(data: EpiDemoData): Signal[] {
  const answers = buildAllAnswers(data);
  const rows = getPortfolioRows(data);
  const headline = getPortfolioHeadline(data);
  const signals: Signal[] = [];

  // ---- Insights: what is happening now ----
  const atRisk = rows.filter((row) => row.health.rating === "at-risk");
  const worst = [...atRisk].sort((a, b) => (a.deviationPts ?? 0) - (b.deviationPts ?? 0))[0];
  if (worst) {
    signals.push({
      id: "I-AT-RISK",
      kind: "insight",
      module: "portfolio",
      level: "risk",
      tags: ["revenue", "schedule"],
      projectId: worst.projectId,
      title: `${headline.atRisk} of ${headline.total} projects are at risk`,
      summary: `${headline.watch} more are on watch. ${formatRupiahMillions(headline.atRiskValue)} of the portfolio value sits in at-risk projects.`,
      metrics: [
        { label: "At risk", value: String(headline.atRisk) },
        { label: "Value at risk", value: formatRupiahMillions(headline.atRiskValue) }
      ],
      evidence: atRisk.map((row) => `${row.projectId} (${row.customer}): ${row.health.reason}.`),
      basis: ["Health rating of every project", "PROGRESS_WEEKLY", "PAYMENT_STAGES"],
      action: action(data, {
        title: `Review the ${atRisk.length} at-risk projects with their project managers`,
        projectId: worst.projectId,
        ownerRole: OWNER.director,
        issue: "oi-at-risk"
      }),
      estimated: false
    });
  }

  const flat = getNoProgressPeriod(data, HERO);
  const week = getWeekCard(data, HERO);
  const recovery = getRecoveryRate(data, HERO);
  if (flat && week && week.actual !== null && week.deviationPts !== null) {
    signals.push({
      id: "I-NO-PROGRESS",
      kind: "insight",
      module: "cockpit",
      level: "risk",
      tags: ["schedule", "revenue"],
      projectId: HERO,
      title: `${HERO} shows no progress in ${formatWeekRange(flat.fromWeek, flat.toWeek)}`,
      summary: `The cumulative actual stayed at ${formatPercent(week.actual)} while the plan moved on to ${formatPercent(week.plan ?? 0)}.`,
      metrics: [
        { label: "Flat at", value: formatPercent(week.actual) },
        { label: "Deviation", value: formatPoints(week.deviationPts) }
      ],
      evidence: [
        `No progress in ${formatWeekRange(flat.fromWeek, flat.toWeek)}: the cumulative actual stayed at ${formatPercent(week.actual)}.`,
        ...(recovery ? [`The best week so far gained ${formatDecimal(recovery.bestPerWeek, 1)} points.`] : [])
      ],
      basis: [`PROGRESS_WEEKLY, week ${week.weekNo}`, "OR-03 early warning on deviation"],
      action: action(data, {
        title: `Get a recovery plan for ${HERO} from the site team`,
        projectId: HERO,
        ownerRole: OWNER.pm,
        issue: "oi-no-progress"
      }),
      estimated: false
    });
  }

  const critical = getCriticalItem(data, HERO);
  const criticalAction = answers.behind.actions[0];
  if (critical && criticalAction) {
    signals.push({
      id: "I-CRITICAL",
      kind: "insight",
      module: "cockpit",
      level: "risk",
      tags: ["schedule", "revenue"],
      projectId: HERO,
      title: `${critical.label} is the critical item of ${HERO}`,
      summary: `${formatPercent(critical.weight)} of the project weight, ${formatPoints(-critical.behindPts)} against plan${critical.claimedStage ? `, claimed stage ${critical.claimedStage}` : ""}.`,
      metrics: [
        { label: "Weight", value: formatPercent(critical.weight) },
        { label: "Behind plan", value: formatPoints(-critical.behindPts) }
      ],
      evidence: answers.behind.points.filter((point) => point.includes(critical.label)),
      basis: answers.behind.sources.map((source) => source.label),
      action: criticalAction,
      estimated: false
    });
  }

  const stages = getEvidenceStages(data, HERO);
  const evidenceSummary = getEvidenceSummary(stages);
  const claimedStage = stages.find((stage) => stage.status === "blocked" && stage.units.some((unit) => unit.claimed));
  if (claimedStage && evidenceSummary.claimedWithoutBa > 0) {
    signals.push({
      id: "I-CLAIMED",
      kind: "insight",
      module: "evidence",
      level: "risk",
      tags: ["revenue", "compliance"],
      projectId: HERO,
      title: `${formatRupiahMillions(evidenceSummary.blockedValue)} claimed without a signed BA on ${HERO}`,
      summary: `${claimedStage.label}: ${claimedStage.gate.reason}.`,
      metrics: [
        { label: "Claimed without BA", value: formatRupiahMillions(evidenceSummary.blockedValue) },
        { label: "Components", value: String(evidenceSummary.claimedWithoutBa) }
      ],
      evidence: claimedStage.units.filter((unit) => unit.claimed && unit.issue).map((unit) => `${unit.unit}: ${unit.issue}.`),
      basis: ["BA_REGISTER", "KR-02 every step needs a document"],
      action: getSuggestedAction(data, HERO, claimedStage),
      estimated: false
    });
  }

  const billing = getBillingSummary(getBillingRows(data));
  const billingActions = answers.billing.actions;
  if (billing.blocked.count > 0 && billingActions[0]) {
    signals.push({
      id: "I-BILLING",
      kind: "insight",
      module: "commercial",
      level: "risk",
      tags: ["revenue"],
      projectId: billingActions[0].projectId,
      title: `${billing.blocked.count} payment stages worth ${formatRupiahMillions(billing.blocked.amount)} are blocked from billing`,
      summary: answers.billing.conclusion,
      metrics: [
        { label: "Blocked", value: formatRupiahMillions(billing.blocked.amount) },
        { label: "Payment stages", value: String(billing.blocked.count) }
      ],
      evidence: answers.billing.points.slice(0, 4),
      basis: answers.billing.sources.map((source) => source.label),
      action: billingActions[0],
      estimated: false
    });
  }

  const retention = data.paymentStages
    .filter((stage) => stage.retentionHeld > 0 && stage.retentionAgeDays > 180)
    .sort((a, b) => b.retentionAgeDays - a.retentionAgeDays)[0];
  if (retention) {
    signals.push({
      id: "I-RETENTION",
      kind: "insight",
      module: "commercial",
      level: "watch",
      tags: ["revenue"],
      projectId: retention.projectId,
      title: `Retensi of ${formatRupiahMillions(retention.retentionHeld)} on ${retention.projectId} has been held ${retention.retentionAgeDays} days`,
      summary: `Retensi held more than 180 days after BAST I; BAST II is not in the register.`,
      metrics: [
        { label: "Retensi held", value: formatRupiahMillions(retention.retentionHeld) },
        { label: "Held for", value: `${retention.retentionAgeDays} days` }
      ],
      evidence: [`${retention.projectId} Retensi 5% (${formatRupiahMillions(retention.retentionHeld)}) is due, awaiting BAST II.`],
      basis: ["PAYMENT_STAGES", "KR-08 billing needs the signed BA"],
      action: action(data, {
        title: `Get BAST II signed to release the ${retention.projectId} Retensi`,
        projectId: retention.projectId,
        ownerRole: OWNER.finance,
        issue: "oi-retention-aged"
      }),
      estimated: false
    });
  }

  const flags = getDataQualityFlags(data);
  if (flags.length > 0) {
    const flagged = new Set(flags.map((flag) => flag.projectId));
    signals.push({
      id: "I-DATA-QUALITY",
      kind: "insight",
      module: "portfolio",
      level: "watch",
      tags: ["compliance"],
      projectId: flags[0]?.projectId ?? HERO,
      title: `${flags.length} records need fixing before they can be trusted`,
      summary: `Copied or incomplete document numbers and files on personal drives, in ${flagged.size} projects.`,
      metrics: [
        { label: "Flags", value: String(flags.length) },
        { label: "Projects", value: String(flagged.size) }
      ],
      evidence: flags.slice(0, 4).map((flag) => `${flag.projectId} ${flag.reference}: ${flag.label}.`),
      basis: ["BA_REGISTER", "DATA_QUALITY, seeded exceptions"],
      action: action(data, {
        title: "Fix the data-quality flags in the BA register",
        projectId: flags[0]?.projectId ?? HERO,
        ownerRole: OWNER.admin,
        issue: "oi-data-quality",
        dueInDays: 14
      }),
      estimated: false
    });
  }

  // ---- Recommendations: what to do about it ----
  const mosStage = stages.find((stage) => stage.stageNo === 3);
  if (mosStage && mosStage.status === "blocked" && !mosStage.units.some((unit) => unit.claimed)) {
    const mosAction = getSuggestedAction(data, HERO, mosStage);
    signals.push({
      id: "R-MOS",
      kind: "recommendation",
      module: "evidence",
      level: "watch",
      tags: ["schedule", "compliance"],
      projectId: HERO,
      title: `Prepare the BA Material On Site for ${HERO}`,
      summary: `${mosStage.label}: ${mosStage.gate.reason}.`,
      metrics: [
        { label: "Stage value", value: formatRupiahMillions(mosStage.stageValue) },
        { label: "Prepare by", value: formatDate(mosAction.dueDate) }
      ],
      evidence: mosStage.units.filter((unit) => unit.issue).map((unit) => `${unit.unit}: ${unit.issue}.`),
      basis: ["BA_REGISTER", "KR-02 every step needs a document"],
      action: mosAction,
      estimated: false
    });
  }

  const bastAction = answers.bast.actions[0];
  if (bastAction) {
    signals.push({
      id: "R-BAST",
      kind: "recommendation",
      module: "evidence",
      level: "watch",
      tags: ["compliance", "revenue"],
      projectId: bastAction.projectId,
      title: `Prepare the missing handover BAs for ${bastAction.projectId}`,
      summary: answers.bast.conclusion,
      metrics: [
        { label: "Checks failed", value: answers.bast.figures.find((figure) => figure.label.startsWith("Checks failed"))?.value ?? "-" },
        { label: "Rule", value: "KR-06" }
      ],
      evidence: answers.bast.points,
      basis: answers.bast.sources.map((source) => source.label),
      action: { ...bastAction, issue: bastAction.issue ?? "oi-handover-bas" },
      estimated: false
    });
  }

  billingActions.slice(1, 3).forEach((billingAction, index) => {
    signals.push({
      id: `R-BILLING-${index + 1}`,
      kind: "recommendation",
      module: "commercial",
      level: "watch",
      tags: ["revenue"],
      projectId: billingAction.projectId,
      title: billingAction.title,
      summary: answers.billing.points[index + 1] ?? answers.billing.conclusion,
      metrics: [
        { label: "Owner", value: billingAction.ownerRole },
        { label: "Due", value: formatDate(billingAction.dueDate) }
      ],
      evidence: [answers.billing.points[index + 1] ?? answers.billing.conclusion],
      basis: answers.billing.sources.map((source) => source.label),
      action: billingAction,
      estimated: false
    });
  });

  const inspectionAction = answers.inspections.actions[0];
  const coverage = [...getCoverageByContract(data)].sort((a, b) => a.coverage - b.coverage)[0];
  if (inspectionAction && coverage) {
    signals.push({
      id: "R-INSPECTION",
      kind: "recommendation",
      module: "service",
      level: "watch",
      tags: ["compliance"],
      projectId: inspectionAction.projectId,
      title: inspectionAction.title,
      summary: answers.inspections.points[0] ?? answers.inspections.conclusion,
      metrics: [
        { label: "Overdue", value: String(coverage.overdue) },
        { label: "Coverage", value: formatPercent(coverage.coverage) }
      ],
      evidence: answers.inspections.points.slice(0, 3),
      basis: answers.inspections.sources.map((source) => source.label),
      action: inspectionAction,
      estimated: false
    });
  }

  answers.rap.actions.slice(0, 2).forEach((rapAction, index) => {
    signals.push({
      id: `R-RAP-${index + 1}`,
      kind: "recommendation",
      module: "cost",
      level: "risk",
      tags: ["cost"],
      projectId: rapAction.projectId,
      title: rapAction.title,
      summary: answers.rap.points[index] ?? answers.rap.conclusion,
      metrics: [
        { label: "Owner", value: rapAction.ownerRole },
        { label: "Due", value: formatDate(rapAction.dueDate) }
      ],
      evidence: [answers.rap.points[index] ?? answers.rap.conclusion],
      basis: answers.rap.sources.map((source) => source.label),
      action: rapAction,
      estimated: false
    });
  });

  // ---- Predictions: what is likely to happen ----
  for (const row of rows.filter((item) => item.statusGroup === "in-progress")) {
    const forecast = getProjectForecast(data, row.projectId);
    if (!forecast || forecast.floatDays === null || forecast.floatDays >= 0 || !forecast.finishDate) continue;
    signals.push({
      id: `P-LATE-${row.projectId}`,
      kind: "prediction",
      module: "cockpit",
      level: forecast.floatDays <= -60 ? "risk" : "watch",
      tags: ["schedule", "revenue"],
      projectId: row.projectId,
      title: `${row.projectId} is likely to finish ${-forecast.floatDays} days after the planned end`,
      summary: `At its best 4-week pace of ${formatDecimal(forecast.pacePerWeek, 1)} points per week the project reaches 100% on ${formatDate(forecast.finishDate)}, against a planned end of ${formatDate(forecast.plannedEndDate)}.`,
      metrics: [
        { label: "Forecast finish", value: formatDate(forecast.finishDate) },
        { label: "Float", value: `${forecast.floatDays} days` }
      ],
      evidence: [
        `Best 4-week rolling average: ${formatDecimal(forecast.pacePerWeek, 1)} points per week.`,
        `Planned end ${formatDate(forecast.plannedEndDate)}; forecast finish ${formatDate(forecast.finishDate)}.`
      ],
      basis: ["PROGRESS_WEEKLY", "Scenario if best pace repeats (ATLAS-estimated)"],
      action: action(data, {
        title: `Agree a recovery date for ${row.projectId} with the customer`,
        projectId: row.projectId,
        ownerRole: OWNER.pm,
        issue: "oi-forecast-late"
      }),
      estimated: true
    });
  }

  if (recovery && recovery.ratioToBestFour !== null && recovery.ratioToBestFour > 1) {
    signals.push({
      id: "P-PACE",
      kind: "prediction",
      module: "cockpit",
      level: "risk",
      tags: ["schedule"],
      projectId: HERO,
      title: `${HERO} needs ${formatDecimal(recovery.ratioToBestFour, 1)}x the pace it has ever sustained`,
      summary: `Finishing on the planned date needs ${formatDecimal(recovery.requiredPerWeek, 1)} points per week; the best 4-week average so far is ${formatDecimal(recovery.bestFourWeekAvg, 1)}.`,
      metrics: [
        { label: "Required pace", value: `${formatDecimal(recovery.requiredPerWeek, 1)} pts per week` },
        { label: "Best 4 weeks", value: `${formatDecimal(recovery.bestFourWeekAvg, 1)} pts per week` }
      ],
      evidence: [
        `${formatDecimal(recovery.remainingPts, 1)} points are still to earn in ${recovery.weeksRemaining} weeks.`,
        `The best single week gained ${formatPctPoints(recovery.bestPerWeek)}.`
      ],
      basis: ["PROGRESS_WEEKLY", "OR-03 early warning on deviation"],
      action: action(data, {
        title: `Re-baseline the ${HERO} schedule with the customer`,
        projectId: HERO,
        ownerRole: OWNER.planning,
        issue: "oi-pace-gap"
      }),
      estimated: false
    });
  }

  const LEVEL_RANK: Record<SignalLevel, number> = { risk: 0, watch: 1 };
  const KIND_RANK: Record<SignalKind, number> = { insight: 0, recommendation: 1, prediction: 2 };
  return signals.sort(
    (a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level] || KIND_RANK[a.kind] - KIND_RANK[b.kind] || a.id.localeCompare(b.id)
  );
}

export type SignalFilter = { kind: SignalKind | "all"; module: SignalModule | "all" };

export function filterSignals(signals: Signal[], filter: SignalFilter): Signal[] {
  return signals.filter(
    (signal) => (filter.kind === "all" || signal.kind === filter.kind) && (filter.module === "all" || signal.module === filter.module)
  );
}

export function countByKind(signals: Signal[]): Record<SignalKind | "all", number> {
  return {
    all: signals.length,
    insight: signals.filter((signal) => signal.kind === "insight").length,
    recommendation: signals.filter((signal) => signal.kind === "recommendation").length,
    prediction: signals.filter((signal) => signal.kind === "prediction").length
  };
}

/** The tracked action a signal already has, if any: same source, or the same issue on the same project. */
export function trackedActionOf(signal: Signal, actions: EpiAction[]): EpiAction | undefined {
  return findOpenMatch(actions, signal.action);
}

/** Signals nobody has acted on yet, and how many modules they span. */
export function splitByAction(signals: Signal[], actions: EpiAction[]) {
  const open = signals.filter((signal) => trackedActionOf(signal, actions) === undefined);
  return { open, actioned: signals.length - open.length };
}

/** The actions the demo opens with: the seeded exceptions, as S8 always showed them. */
export function getSeedActions(data: EpiDemoData): EpiAction[] {
  return buildSeedActions(data);
}
