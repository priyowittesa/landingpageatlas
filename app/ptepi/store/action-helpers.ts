import { EXCEPTION_LABELS } from "../labels";
import { addDays, getProjectHealth } from "../selectors";
import type { ActionAutonomy, ChartTable, EpiDemoData, ExceptionSeverity } from "../types";
import type { ActionStatus, EpiAction } from "./actions-store";

/** Screen where each seeded exception is worked (requirements, tables 3.4.4 and 11). */
const EXCEPTION_SCREEN: Record<number, { name: string }> = {
  1: { name: "Project cockpit" },
  2: { name: "Project cockpit" },
  3: { name: "Evidence gate" },
  4: { name: "Commercial and billing" },
  5: { name: "Procurement and cost" },
  6: { name: "Evidence gate" },
  7: { name: "Commercial and billing" },
  8: { name: "Commercial and billing" },
  9: { name: "Service contracts" },
  10: { name: "Commercial and billing" },
  11: { name: "Portfolio health" },
  12: { name: "Evidence gate" }
};

const JR_MANAGER = "Jr Manager Pengendalian Investasi dan Pemeliharaan";

/** Owner of each exception by the org chart; billing items go to Finance (Billing agent, L2). */
const EXCEPTION_OWNER: Record<number, { ownerRole: string; autonomy: ActionAutonomy }> = {
  1: { ownerRole: "ASM Teknik", autonomy: "L1" },
  2: { ownerRole: "Project Manager", autonomy: "L1" },
  3: { ownerRole: "Project Manager", autonomy: "L1" },
  4: { ownerRole: "Finance", autonomy: "L2" },
  5: { ownerRole: "Manager Pengendalian Teknik", autonomy: "L1" },
  6: { ownerRole: "SM Operasi dan Teknik", autonomy: "L1" },
  7: { ownerRole: "Finance", autonomy: "L2" },
  8: { ownerRole: "Finance", autonomy: "L2" },
  9: { ownerRole: JR_MANAGER, autonomy: "L1" },
  10: { ownerRole: "Finance", autonomy: "L2" },
  11: { ownerRole: "Admin Proyek", autonomy: "L1" },
  12: { ownerRole: "Admin Proyek", autonomy: "L1" }
};

const DUE_DAYS: Record<ExceptionSeverity, number> = { high: 7, medium: 14 };

export const AUTONOMY_LABELS: Record<ActionAutonomy, string> = {
  L0: "L0 Inform",
  L1: "L1 Recommend",
  L2: "L2 Act with approval"
};

export const STATUS_LABELS: Record<ActionStatus, string> = {
  open: "Open",
  "in-progress": "In progress",
  done: "Done"
};

const STATUS_RANK: Record<ActionStatus, number> = { open: 0, "in-progress": 1, done: 2 };

/** The issue each seeded exception tracks; S4 and S7 actions with the same key dedupe to it. */
const EXCEPTION_ISSUE: Record<number, string> = {
  1: "schedule-deviation",
  2: "critical-item",
  3: "evidence-stage-2",
  4: "billing-progress-condition",
  5: "cost-over-rap",
  6: "billing-bast-i",
  7: "billing-overdue",
  8: "retention-aged",
  9: "inspection-missed",
  10: "billing-monthly-report",
  11: "bamk-draft",
  12: "register-gaps"
};

/** Issue of a seeded action from its id ("EXC-03" -> "evidence-stage-2"); undefined otherwise. */
export function issueForActionId(id: string): string | undefined {
  const match = /^EXC-(\d+)$/.exec(id);
  return match ? EXCEPTION_ISSUE[Number(match[1])] : undefined;
}

/** The detected seeded exceptions as actions; ids EXC-01 to EXC-12. */
export function buildSeedActions(data: EpiDemoData): EpiAction[] {
  return data.seededExceptions
    .filter((item) => item.status === "TERDETEKSI")
    .map((item) => {
      const screen = EXCEPTION_SCREEN[item.exceptionNo] ?? { name: "Portfolio health" };
      const owner = EXCEPTION_OWNER[item.exceptionNo] ?? {
        ownerRole: "ASM Teknik",
        autonomy: "L1" as const
      };
      const severity: ExceptionSeverity =
        getProjectHealth(data, item.projectId).rating === "at-risk" ? "high" : "medium";
      return {
        id: `EXC-${String(item.exceptionNo).padStart(2, "0")}`,
        title: `Resolve: ${EXCEPTION_LABELS[item.exceptionNo] ?? item.exception}`,
        projectId: item.projectId,
        ownerRole: owner.ownerRole,
        dueDate: addDays(data.asAt, DUE_DAYS[severity]),
        status: "open" as const,
        source: `${screen.name}: exception #${item.exceptionNo}`,
        autonomy: owner.autonomy,
        issue: EXCEPTION_ISSUE[item.exceptionNo]
      };
    });
}

/** "S4 Evidence gate: ..." gives "S4"; anything else gives "Other". */
const SOURCE_SCREENS = [
  "Portfolio health",
  "Commercial and billing",
  "Project cockpit",
  "Evidence gate",
  "Procurement and cost",
  "Service contracts",
  "Nexa Intelligence",
  "Action tracker"
];

/** Drops an internal screen code such as "S4 " from the start of a source. */
export function stripScreenCode(source: string): string {
  return source.replace(/^S\d\s+/, "");
}

/** Screen name an action came from, read from its source; older "S4 ..." sources still map. */
export function sourceScreen(source: string): string {
  const name = stripScreenCode(source).split(":")[0]?.trim() ?? "";
  return SOURCE_SCREENS.includes(name) ? name : "Other";
}

export function isOverdue(action: Pick<EpiAction, "dueDate" | "status">, asAt: string): boolean {
  return action.status !== "done" && action.dueDate < asAt;
}

export type ActionFilters = {
  search: string;
  project: string;
  owner: string;
  status: string;
  source: string;
};

export function filterActions(actions: EpiAction[], filters: ActionFilters): EpiAction[] {
  const query = filters.search.trim().toLowerCase();
  return actions.filter(
    (action) =>
      (filters.project === "all" || action.projectId === filters.project) &&
      (filters.owner === "all" || action.ownerRole === filters.owner) &&
      (filters.status === "all" || action.status === filters.status) &&
      (filters.source === "all" || sourceScreen(action.source) === filters.source) &&
      (query === "" ||
        `${action.id} ${action.title} ${action.projectId} ${action.ownerRole}`
          .toLowerCase()
          .includes(query))
  );
}

/** Unfinished first, then by due date, then id. */
export function sortActions(actions: EpiAction[]): EpiAction[] {
  return [...actions].sort(
    (a, b) =>
      STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
      a.dueDate.localeCompare(b.dueDate) ||
      a.id.localeCompare(b.id)
  );
}

export type ActionSummary = {
  total: number;
  open: number;
  inProgress: number;
  done: number;
  overdue: number;
};

export function getActionSummary(actions: EpiAction[], asAt: string): ActionSummary {
  return {
    total: actions.length,
    open: actions.filter((a) => a.status === "open").length,
    inProgress: actions.filter((a) => a.status === "in-progress").length,
    done: actions.filter((a) => a.status === "done").length,
    overdue: actions.filter((a) => isOverdue(a, asAt)).length
  };
}

export function getSourceOptions(actions: EpiAction[]): string[] {
  return [...new Set(actions.map((a) => sourceScreen(a.source)))].sort();
}

export function getProjectOptions(actions: EpiAction[]): string[] {
  return [...new Set(actions.map((a) => a.projectId))].sort();
}

// ---------------------------------------------------------------------------
// S8 chart data
// ---------------------------------------------------------------------------

export type ActionChartData<T> = {
  points: T[];
  takeaway: string | null;
  table: ChartTable;
};

export type OwnerStatusPoint = {
  ownerRole: string;
  open: number;
  inProgress: number;
  total: number;
};

export type AgingBucketId = "overdue" | "week" | "two-weeks" | "later";

export type AgingBucket = {
  id: AgingBucketId;
  label: string;
  count: number;
};

/** Due-date bucket limits, in days from the as-at date. */
export const AGING_WEEK_DAYS = 7;
export const AGING_TWO_WEEKS_DAYS = 14;

const unfinished = (actions: EpiAction[]) => actions.filter((action) => action.status !== "done");

/** Unfinished actions per owner role, split by open and in progress; largest first. */
export function getActionsByOwner(actions: EpiAction[]): OwnerStatusPoint[] {
  const byOwner = new Map<string, OwnerStatusPoint>();
  for (const action of unfinished(actions)) {
    const point = byOwner.get(action.ownerRole) ?? {
      ownerRole: action.ownerRole,
      open: 0,
      inProgress: 0,
      total: 0
    };
    if (action.status === "open") point.open += 1;
    else point.inProgress += 1;
    point.total += 1;
    byOwner.set(action.ownerRole, point);
  }
  return [...byOwner.values()].sort(
    (a, b) => b.total - a.total || a.ownerRole.localeCompare(b.ownerRole)
  );
}

/** Unfinished actions by days from the as-at date to the due date. */
export function getAgingBuckets(actions: EpiAction[], asAt: string): AgingBucket[] {
  const counts: Record<AgingBucketId, number> = { overdue: 0, week: 0, "two-weeks": 0, later: 0 };
  for (const action of unfinished(actions)) {
    const days = Math.round((Date.parse(action.dueDate) - Date.parse(asAt)) / 86_400_000);
    if (days < 0) counts.overdue += 1;
    else if (days <= AGING_WEEK_DAYS) counts.week += 1;
    else if (days <= AGING_TWO_WEEKS_DAYS) counts["two-weeks"] += 1;
    else counts.later += 1;
  }
  return [
    { id: "overdue", label: "Overdue", count: counts.overdue },
    { id: "week", label: `Due in ${AGING_WEEK_DAYS} days or less`, count: counts.week },
    { id: "two-weeks", label: `Due in ${AGING_WEEK_DAYS + 1} to ${AGING_TWO_WEEKS_DAYS} days`, count: counts["two-weeks"] },
    { id: "later", label: `Due in more than ${AGING_TWO_WEEKS_DAYS} days`, count: counts.later }
  ];
}

export function getActionsByOwnerChart(actions: EpiAction[]): ActionChartData<OwnerStatusPoint> {
  const points = getActionsByOwner(actions);
  const total = points.reduce((sum, point) => sum + point.total, 0);
  const top = points[0];
  return {
    points,
    takeaway: top ? `${top.ownerRole} holds the most unfinished actions: ${top.total} of ${total}.` : null,
    table: {
      columns: ["Owner role", "Open", "In progress", "Total"],
      rows: points.map((point) => ({
        cells: [point.ownerRole, String(point.open), String(point.inProgress), String(point.total)]
      }))
    }
  };
}

export function getAgingChart(actions: EpiAction[], asAt: string): ActionChartData<AgingBucket> {
  const points = getAgingBuckets(actions, asAt);
  const total = points.reduce((sum, point) => sum + point.count, 0);
  const overdue = points.find((point) => point.id === "overdue")?.count ?? 0;
  const soon = points.find((point) => point.id === "week")?.count ?? 0;
  return {
    points,
    takeaway: total > 0 ? `${overdue} of ${total} unfinished actions are overdue; ${soon} fall due within ${AGING_WEEK_DAYS} days.` : null,
    table: {
      columns: ["Due date", "Unfinished actions"],
      rows: points.map((point) => ({ cells: [point.label, String(point.count)] }))
    }
  };
}

// ---------------------------------------------------------------------------
// Action tracker focus panels: the actions behind each figure
// ---------------------------------------------------------------------------

export type FocusAction = {
  action: EpiAction;
  /** Whole days from the as-at date to the due date; negative when overdue */
  daysLeft: number;
  /** Screen where the action is worked */
  screen: string;
  href: string;
};

const SCREEN_HREF: Record<string, (projectId: string) => string> = {
  "Project cockpit": (id) => `/ptepi/project/${id}`,
  "Evidence gate": (id) => `/ptepi/project/${id}/evidence`,
  "Commercial and billing": (id) => `/ptepi/commercial?project=${id}`,
  "Procurement and cost": (id) => `/ptepi/cost?project=${id}`,
  "Service contracts": () => "/ptepi/service-contracts",
  "Nexa Intelligence": () => "/ptepi/ask-atlas",
  "Portfolio health": () => "/ptepi/portfolio"
};

const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000);

export function toFocusAction(action: EpiAction, asAt: string): FocusAction {
  const screen = sourceScreen(action.source);
  const href = SCREEN_HREF[screen]?.(action.projectId) ?? `/ptepi/project/${action.projectId}`;
  return { action, daysLeft: daysBetween(asAt, action.dueDate), screen, href };
}

export type DueGroup = AgingBucket & { items: FocusAction[] };

function bucketOf(days: number): AgingBucketId {
  if (days < 0) return "overdue";
  if (days <= AGING_WEEK_DAYS) return "week";
  return days <= AGING_TWO_WEEKS_DAYS ? "two-weeks" : "later";
}

/** The due-date buckets with their unfinished actions, soonest first. */
export function getDueGroups(actions: EpiAction[], asAt: string): DueGroup[] {
  const items = sortActions(unfinished(actions)).map((action) => toFocusAction(action, asAt));
  return getAgingBuckets(actions, asAt).map((bucket) => ({
    ...bucket,
    items: items.filter((item) => bucketOf(item.daysLeft) === bucket.id).sort((a, b) => a.daysLeft - b.daysLeft)
  }));
}

export type OwnerLoad = OwnerStatusPoint & {
  items: FocusAction[];
  /** Bar length against the busiest owner, 0 to 100 */
  barPct: number;
};

/** Actions shown under an opened owner role; the rest are in the table. */
export const OWNER_PREVIEW_COUNT = 2;

/** Each owner role with its unfinished actions, busiest first. */
export function getOwnerLoads(actions: EpiAction[], asAt: string): OwnerLoad[] {
  const points = getActionsByOwner(actions);
  const max = points[0]?.total ?? 0;
  const items = unfinished(actions).map((action) => toFocusAction(action, asAt));
  return points.map((point) => ({
    ...point,
    barPct: max === 0 ? 0 : (point.total / max) * 100,
    items: items.filter((item) => item.action.ownerRole === point.ownerRole).sort((a, b) => a.daysLeft - b.daysLeft)
  }));
}
