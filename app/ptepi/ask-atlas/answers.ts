import {
  formatDate,
  formatDecimal,
  formatPercent,
  formatPoints,
  formatPointsUnsigned,
  formatRupiah,
  formatRupiahMillions,
  formatWeekRange
} from "../format";
import {
  addDays,
  getBastGate,
  getBillingRows,
  getBillingSummary,
  getCostPortfolio,
  getCoverageByContract,
  getCriticalItem,
  getEvidenceStages,
  getEvidenceSummary,
  getOverRapProjects,
  getPortfolioRows,
  getPortfolioTotals,
  getRecoveryRate,
  getServiceScopeRows,
  getServiceSummary,
  getSuggestedAction,
  getWeekCard
} from "../selectors";
import type { EpiDemoData } from "../types";
import type { NewEpiAction } from "../store/actions-store";
import { QUESTIONS } from "./questions";
import type { Answer, QuestionId } from "./types";

/** Project the scripted answers are written around: Kapasitor Bank. */
export const HERO_PROJECT_ID = "PNP126";
const ACTION_DUE_DAYS = 7;
const HANDOVER_DUE_DAYS = 14;

const questionLabel = (id: QuestionId): string =>
  QUESTIONS.find((question) => question.id === id)?.label ?? id;

/** The seeded-exception issue a blocked billing row belongs to. */
function billingIssueOf(requiredDocument: string | null): string {
  if (requiredDocument === null) return "billing-progress-condition";
  if (requiredDocument.startsWith("BAST I")) return "billing-bast-i";
  if (requiredDocument.startsWith("Monthly")) return "billing-monthly-report";
  return "billing-blocked";
}

function draft(
  data: EpiDemoData,
  input: Pick<NewEpiAction, "title" | "projectId" | "ownerRole" | "source" | "issue"> & { dueInDays?: number }
): NewEpiAction {
  return {
    title: input.title,
    projectId: input.projectId,
    ownerRole: input.ownerRole,
    dueDate: addDays(data.asAt, input.dueInDays ?? ACTION_DUE_DAYS),
    source: input.source,
    autonomy: "L1",
    ...(input.issue ? { issue: input.issue } : {})
  };
}

/** AS-07: say what is missing instead of guessing. */
function noEvidence(id: QuestionId, data: EpiDemoData, what: string): Answer {
  return {
    questionId: id,
    question: questionLabel(id),
    conclusion: `ATLAS cannot answer this: ${what}.`,
    figures: [],
    points: ["No guess is made without evidence. Add the missing record and ask again."],
    sources: [{ kind: "table", label: "No matching record" }],
    actions: [],
    refreshedAt: data.asAt
  };
}

function behind(data: EpiDemoData): Answer {
  const week = getWeekCard(data, HERO_PROJECT_ID);
  if (!week || week.plan === null || week.actual === null || week.deviationPts === null) {
    return noEvidence("behind", data, `there is no weekly progress for ${HERO_PROJECT_ID}`);
  }
  const recovery = getRecoveryRate(data, HERO_PROJECT_ID);
  const critical = getCriticalItem(data, HERO_PROJECT_ID);
  const stages = getEvidenceStages(data, HERO_PROJECT_ID);
  const blockedStage = stages.find((stage) => stage.status === "blocked");

  const points: string[] = [];
  if (recovery && recovery.flatWeeks >= 2) {
    points.push(
      `No progress in ${formatWeekRange(recovery.flatFromWeek ?? week.weekNo, recovery.flatToWeek ?? week.weekNo)}: the cumulative actual stayed at ${formatPercent(week.actual)}.`
    );
  }
  if (critical) {
    points.push(
      `${critical.label} is the critical item: ${formatPercent(critical.weight)} of the project weight, ${formatPointsUnsigned(critical.behindPts)} behind plan${critical.claimedStage ? `, claimed stage ${critical.claimedStage}` : ""}.`
    );
    const unit = stages[2]?.units.find((u) => u.unit === critical.label);
    if (unit?.issue) {
      points.push(
        `${unit.unit}: ${unit.issue}. No FAT or delivery date is held in the data, so none is shown.`
      );
    }
  }
  if (recovery) {
    points.push(
      `Finishing on time needs ${formatDecimal(recovery.requiredPerWeek, 1)} points per week for ${recovery.weeksRemaining} weeks (${formatDecimal(recovery.remainingPts, 2)} points); the best week so far was ${formatPoints(recovery.bestPerWeek)}.`
    );
  }
  if (blockedStage) {
    points.push(`${blockedStage.label}: ${blockedStage.gate.reason}.`);
  }

  return {
    questionId: "behind",
    question: questionLabel("behind"),
    conclusion: `${HERO_PROJECT_ID} (Kapasitor Bank) is ${formatPointsUnsigned(Math.abs(week.deviationPts))} behind plan in week ${week.weekNo}: actual ${formatPercent(week.actual)} against a plan of ${formatPercent(week.plan)} (${formatPoints(week.deviationPts)}).`,
    figures: [
      { label: "Plan", value: formatPercent(week.plan) },
      { label: "Actual", value: formatPercent(week.actual) },
      { label: "Deviation", value: formatPoints(week.deviationPts) }
    ],
    points,
    sources: [
      { kind: "table", label: `PROGRESS_WEEKLY, week ${week.weekNo}` },
      { kind: "document", label: "Weekly report, week 18" },
      { kind: "table", label: "BA_REGISTER" },
      { kind: "rule", label: "OR-03 early warning on deviation" },
      { kind: "rule", label: "KR-02 every step needs a document" }
    ],
    actions: critical
      ? [
          draft(data, {
            title: `Confirm FAT and delivery dates for ${critical.label} with the vendor (${HERO_PROJECT_ID})`,
            projectId: HERO_PROJECT_ID,
            ownerRole: "Project Manager",
            source: `Nexa Intelligence: ${HERO_PROJECT_ID} behind plan`,
            issue: "critical-item"
          })
        ]
      : [],
    refreshedAt: data.asAt
  };
}

function billing(data: EpiDemoData): Answer {
  const rows = getBillingRows(data);
  const summary = getBillingSummary(rows);
  const blocked = rows.filter((row) => row.readiness === "blocked");
  const awaiting = rows.filter((row) => row.readiness === "awaiting-bast");

  const points = [
    ...blocked.map(
      (row) =>
        `${row.projectId} ${row.stageType} (${formatRupiahMillions(row.amount)}): ${row.reason ?? "held"}.`
    ),
    ...awaiting.map(
      (row) =>
        `${row.projectId} ${row.stageType} (${formatRupiahMillions(row.amount)}) is due, awaiting BAST II: ${row.reason ?? "BAST II not signed"}.`
    )
  ];

  const byProject = new Map<string, { reason: string; issue: string }>();
  for (const row of blocked) {
    if (!byProject.has(row.projectId)) {
      byProject.set(row.projectId, { reason: row.reason ?? "held", issue: billingIssueOf(row.requiredDocument) });
    }
  }

  return {
    questionId: "billing",
    question: questionLabel("billing"),
    conclusion: `${summary.blocked.count} payment stages worth ${formatRupiahMillions(summary.blocked.amount)} are blocked from billing; ${summary.billable.count === 0 ? "nothing can be billed now" : `${summary.billable.count} worth ${formatRupiahMillions(summary.billable.amount)} can be billed now`}; ${summary["awaiting-bast"].count} Retensi worth ${formatRupiahMillions(summary["awaiting-bast"].amount)} are due, awaiting BAST II.`,
    figures: [
      { label: "Blocked", value: formatRupiahMillions(summary.blocked.amount) },
      { label: "Billable now", value: formatRupiahMillions(summary.billable.amount) },
      { label: "Blocked stages", value: String(summary.blocked.count) }
    ],
    points,
    sources: [
      { kind: "table", label: "PAYMENT_STAGES" },
      { kind: "table", label: "BA_REGISTER" },
      { kind: "rule", label: "KR-08 billing needs the signed BA" },
      { kind: "document", label: "BA Kick Off Meeting (payment documents)" }
    ],
    actions: [...byProject.entries()].map(([projectId, { reason, issue }]) =>
      draft(data, {
        title: `Unblock Tagihan ${projectId}: ${reason}`,
        projectId,
        ownerRole: "SM Operasi dan Teknik",
        source: `Nexa Intelligence: billing ${projectId}`,
        issue
      })
    ),
    refreshedAt: data.asAt
  };
}

function next(data: EpiDemoData): Answer {
  const stages = getEvidenceStages(data, HERO_PROJECT_ID);
  const summary = getEvidenceSummary(stages);
  const blockedStage = stages.find((stage) => stage.status === "blocked");
  const critical = getCriticalItem(data, HERO_PROJECT_ID);
  const termin = getBillingRows(data).find(
    (row) => row.projectId === HERO_PROJECT_ID && row.readiness === "blocked"
  );

  const actions: NewEpiAction[] = [];
  if (blockedStage) actions.push(getSuggestedAction(data, HERO_PROJECT_ID, blockedStage));
  if (critical) {
    actions.push(
      draft(data, {
        title: `Confirm FAT and delivery dates for ${critical.label} with the vendor (${HERO_PROJECT_ID})`,
        projectId: HERO_PROJECT_ID,
        ownerRole: "Project Manager",
        source: `Nexa Intelligence: ${HERO_PROJECT_ID} behind plan`,
        issue: "critical-item"
      })
    );
  }
  if (actions.length === 0) {
    return noEvidence("next", data, `no blocked stage or critical item was found for ${HERO_PROJECT_ID}`);
  }

  const points = actions.map((action) => `${action.title}. Owner ${action.ownerRole}, due ${formatDate(action.dueDate)}.`);
  if (summary.claimedWithoutBa > 0) {
    points.push(`Progress claimed without a signed BA is worth ${formatRupiah(summary.blockedValue)}.`);
  }
  if (termin?.reason) points.push(`Billing stays blocked: ${termin.reason}.`);

  return {
    questionId: "next",
    question: questionLabel("next"),
    conclusion: `ATLAS recommends ${actions.length} actions on ${HERO_PROJECT_ID}, the most urgent first.`,
    figures: [
      { label: "Recommended actions", value: String(actions.length) },
      { label: "Claimed without BA", value: formatRupiahMillions(summary.blockedValue) }
    ],
    points,
    sources: [
      { kind: "table", label: "BA_REGISTER" },
      { kind: "table", label: "PAYMENT_STAGES" },
      { kind: "document", label: "Weekly report, week 18" },
      { kind: "rule", label: "KR-02 every step needs a document" }
    ],
    actions,
    refreshedAt: data.asAt
  };
}

function attention(data: EpiDemoData): Answer {
  const rows = getPortfolioRows(data);
  const totals = getPortfolioTotals(data);
  const atRisk = rows.filter((row) => row.health.rating === "at-risk");
  const watch = rows.filter((row) => row.health.rating === "watch");

  const points = atRisk.map((row) => `${row.projectId} (${row.customer}): ${row.health.reason}.`);
  if (watch.length > 0) {
    points.push(`On watch: ${watch.map((row) => row.projectId).join(", ")}.`);
  }

  return {
    questionId: "attention",
    question: questionLabel("attention"),
    conclusion: `${atRisk.length} of ${totals.projectCount} projects are at risk and ${watch.length} are on watch.`,
    figures: [
      { label: "At risk", value: String(atRisk.length) },
      { label: "On watch", value: String(watch.length) },
      { label: "With exceptions", value: String(totals.projectsWithExceptions) }
    ],
    points,
    sources: [
      { kind: "table", label: "DATA MASTER" },
      { kind: "table", label: "DATA_QUALITY, seeded exceptions" },
      { kind: "rule", label: "OR-09 portfolio health from named signals" }
    ],
    actions: atRisk.map((row) =>
      draft(data, {
        title: `Review at-risk project ${row.projectId}: ${row.health.reason}`,
        projectId: row.projectId,
        ownerRole: "ASM Teknik",
        source: `Nexa Intelligence: at risk ${row.projectId}`
      })
    ),
    refreshedAt: data.asAt
  };
}

function bast(data: EpiDemoData): Answer {
  const gate = getBastGate(data, HERO_PROJECT_ID);
  const failed = gate.checks.filter((check) => !check.ok);

  return {
    questionId: "bast",
    question: questionLabel("bast"),
    conclusion: gate.allowed
      ? `The BAST for ${HERO_PROJECT_ID} can be drafted: every check passes.`
      : `The BAST for ${HERO_PROJECT_ID} cannot be drafted yet: ${failed.length} of ${gate.checks.length} checks fail.`,
    figures: [
      { label: "Checks failed", value: `${failed.length} of ${gate.checks.length}` },
      { label: "Progress", value: gate.progress === null ? "-" : formatPercent(gate.progress) }
    ],
    points: gate.checks.map((check) => `${check.label}: ${check.ok ? "met" : "missing"}.`),
    sources: [
      { kind: "rule", label: "KR-06 handover needs a physical inspection BA" },
      { kind: "rule", label: "KR-07 BAST I needs Rikmatek and Comtest" },
      { kind: "table", label: "BA_REGISTER" },
      { kind: "document", label: "SOP Pelaksanaan Proyek, steps 5 and 6" }
    ],
    actions: gate.allowed
      ? []
      : [
          draft(data, {
            title: `Prepare the missing handover BAs for ${HERO_PROJECT_ID}: ${failed.map((check) => check.label).join(", ")}`,
            projectId: HERO_PROJECT_ID,
            ownerRole: "Project Manager",
            source: `Nexa Intelligence: ${HERO_PROJECT_ID} BAST`,
            dueInDays: HANDOVER_DUE_DAYS
          })
        ],
    refreshedAt: data.asAt
  };
}

function inspections(data: EpiDemoData): Answer {
  const summary = getServiceSummary(data);
  const notDone = getServiceScopeRows(data).filter((row) => row.status === "not-done");
  const behindContracts = getCoverageByContract(data).filter((row) => row.overdue > 0);

  const points = [
    ...notDone.map(
      (row) =>
        `${row.contractId}: ${row.scopeItem} was required ${row.required} times and carried out ${row.done} times.`
    ),
    ...behindContracts.map(
      (row) =>
        `${row.contractId}: ${row.done} of ${row.required} inspections done (${formatPercent(row.coverage, 2)}), ${row.overdue} overdue, ${row.upcoming} scheduled.`
    )
  ];

  return {
    questionId: "inspections",
    question: questionLabel("inspections"),
    conclusion: `${summary.overdueInspections} required inspections in ${summary.overdueItems} scope items are overdue; overall coverage is ${formatPercent(summary.coverage, 2)}.`,
    figures: [
      { label: "Overdue", value: String(summary.overdueInspections) },
      { label: "Coverage", value: formatPercent(summary.coverage, 2) },
      { label: "Scheduled", value: String(summary.upcomingCount) }
    ],
    points,
    sources: [
      { kind: "table", label: "SERVICE_SCOPE" },
      { kind: "table", label: "SERVICE_INSPECTION" },
      { kind: "document", label: "Notulen Rapat Manage Service IKT, 10 Jun 2025" }
    ],
    actions: notDone.map((row) =>
      draft(data, {
        title: `Schedule the missing ${row.scopeItem} (${row.contractId})`,
        projectId: row.contractId,
        ownerRole: "Jr Manager Pengendalian Investasi dan Pemeliharaan",
        source: `Nexa Intelligence: inspection ${row.scopeId}`,
        issue: "inspection-missed"
      })
    ),
    refreshedAt: data.asAt
  };
}

function rap(data: EpiDemoData): Answer {
  const over = getOverRapProjects(data);
  const portfolio = getCostPortfolio(data);
  const largest = over[0];
  if (!largest) {
    return noEvidence("rap", data, "no project is over its RAP budget in the data");
  }

  const points = over.map(
    (project) =>
      `${project.projectId} (${project.customer}): cost is ${formatRupiah(project.overBy)} above RAP${project.margin === null ? "" : `, margin ${formatPercent(project.margin, 2)}`}.`
  );
  if (portfolio.margin !== null) {
    points.push(
      `Portfolio margin is ${formatPercent(portfolio.margin, 2)} on ${formatRupiahMillions(portfolio.recognisedRevenue)} recognised revenue.`
    );
  }

  return {
    questionId: "rap",
    question: questionLabel("rap"),
    conclusion: `${over.length} projects are over their RAP budget; the largest overrun is ${largest.projectId} at ${formatRupiahMillions(largest.overBy)}.`,
    figures: [
      { label: "Projects over RAP", value: String(over.length) },
      { label: "Largest overrun", value: formatRupiahMillions(largest.overBy) },
      {
        label: "Portfolio margin",
        value: portfolio.margin === null ? "-" : formatPercent(portfolio.margin, 2)
      }
    ],
    points,
    sources: [
      { kind: "table", label: "RAP_BUDGET" },
      { kind: "table", label: "Project cost lines with SAP keys" },
      { kind: "rule", label: "Margin = (recognised revenue - cost) / recognised revenue" }
    ],
    actions: over
      .filter((project) => project.margin !== null && project.margin < 0)
      .map((project) =>
        draft(data, {
          title: `Review the cost overrun on ${project.projectId}`,
          projectId: project.projectId,
          ownerRole: "Manager Pengendalian Teknik",
          source: `Nexa Intelligence: over RAP ${project.projectId}`,
          issue: "cost-over-rap"
        })
      ),
    refreshedAt: data.asAt
  };
}

const BUILDERS: Record<QuestionId, (data: EpiDemoData) => Answer> = {
  behind,
  billing,
  next,
  attention,
  bast,
  inspections,
  rap
};

export function buildAnswer(id: QuestionId, data: EpiDemoData): Answer {
  return BUILDERS[id](data);
}

export function buildAllAnswers(data: EpiDemoData): Record<QuestionId, Answer> {
  return {
    behind: behind(data),
    billing: billing(data),
    next: next(data),
    attention: attention(data),
    bast: bast(data),
    inspections: inspections(data),
    rap: rap(data)
  };
}
