import { EXCEPTION_LABELS } from "../labels";
import { addDays, getProjectHealth } from "../selectors";
import type { ActionAutonomy, ChartTable, EpiDemoData, ExceptionSeverity } from "../types";
import type { ActionStatus, EpiAction } from "./actions-store";

/** Screen where each seeded exception is worked (requirements, tables 3.4.4 and 11). */
const EXCEPTION_SCREEN: Record<number, { code: string; name: string }> = {
  1: { code: "S3", name: "Project cockpit" },
  2: { code: "S3", name: "Project cockpit" },
  3: { code: "S4", name: "Evidence gate" },
  4: { code: "S2", name: "Commercial and billing" },
  5: { code: "S5", name: "Procurement and cost" },
  6: { code: "S4", name: "Evidence gate" },
  7: { code: "S2", name: "Commercial and billing" },
  8: { code: "S2", name: "Commercial and billing" },
  9: { code: "S6", name: "Service contracts" },
  10: { code: "S2", name: "Commercial and billing" },
  11: { code: "S1", name: "Portfolio health" },
  12: { code: "S4", name: "Evidence gate" }
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

/** The detected seeded exceptions as actions; ids EXC-01 to EXC-12. */
export function buildSeedActions(data: EpiDemoData): EpiAction[] {
  return data.seededExceptions
    .filter((item) => item.status === "TERDETEKSI")
    .map((item) => {
      const screen = EXCEPTION_SCREEN[item.exceptionNo] ?? { code: "S1", name: "Portfolio health" };
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
        source: `${screen.code} ${screen.name}: exception #${item.exceptionNo}`,
        autonomy: owner.autonomy
      };
    });
}

/** "S4 Evidence gate: ..." gives "S4"; anything else gives "Other". */
export function sourceScreen(source: string): string {
  return /^(S\d)\b/.exec(source)?.[1] ?? "Other";
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
