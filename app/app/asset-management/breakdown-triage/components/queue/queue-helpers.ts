import {
  Activity,
  ArrowUpDown,
  ArrowUpRight,
  Ban,
  Calendar,
  CalendarX,
  CheckCircle2,
  Download,
  Pencil,
  Play,
  Reply,
  RotateCcw,
  Sparkles,
  StickyNote,
  Undo2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import type { MachineStatus, Priority, ReportState } from "../../lib/types";
import type { QueueReport } from "./use-breakdown-reports";

export const QUEUE_HREF = "/app/asset-management/breakdown-triage";
export const INSIGHTS_HREF = `${QUEUE_HREF}/ai-insights`;

export const MACHINE_STATUS_LABELS: Record<MachineStatus, string> = {
  stopped: "Fully stopped",
  running: "Still running",
};

export type TimeFilter = "today" | "7" | "30";

export const STATE_FILTERS: { value: "all" | ReportState; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "in_progress", label: "In progress" },
  { value: "scheduled", label: "Scheduled" },
  { value: "escalated", label: "Escalated" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const TIME_FILTERS: { value: TimeFilter; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

/** Start of the time window as RFC3339 (`reported_from`). */
export function timeFilterFrom(filter: TimeFilter, now = new Date()): string {
  const start = new Date(now);
  if (filter === "today") start.setHours(0, 0, 0, 0);
  else start.setDate(start.getDate() - Number(filter));
  return start.toISOString();
}

export const PRIORITY_HINTS = {
  P1: "Handle immediately",
  P2: "Respond within 60 minutes",
  P3: "Schedule within 24 hours",
} as const;

export const formatHours = (hours: number | null) =>
  hours == null ? "—" : `${hours % 1 === 0 ? hours.toFixed(0) : hours.toFixed(1)} h`;

export const initials = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("");

const parse = (value: string) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
};

/** "15:15" */
export function formatClock(value: string) {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "—";
}

/** "02 Nov 15:15" */
export function formatWhen(value: string) {
  const date = parse(value);
  if (!date) return value || "—";
  const day = new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(date);
  return `${day} ${formatClock(value)}`;
}

/** "02 Nov 2026" */
export function formatDay(value: string) {
  const date = parse(value);
  return date ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date) : value || "—";
}

export const minutesBetween = (from: string, to = new Date().toISOString()) => {
  const start = parse(from), end = parse(to);
  return start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : 0;
};

export function formatDuration(minutes: number): string {
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes} min`;
}

export function formatAgo(value: string): string {
  const minutes = minutesBetween(value);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} h ${minutes % 60} min ago`;
  const days = Math.floor(minutes / 1440);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export const isOpenReport = (report: QueueReport) => report.state !== "completed" && report.state !== "cancelled";

export type SlaState =
  | { kind: "responded"; minutes: number }
  | { kind: "scheduled"; label: string }
  | { kind: "completed" }
  | { kind: "none" }
  | { kind: "overdue"; minutes: number }
  | { kind: "remaining"; minutes: number; warning: boolean };

/** Response target of a report: the API's deadline, else the active config's target for its priority. */
export function slaState(report: QueueReport, slaMinutes: Record<Priority, number> | undefined): SlaState {
  if (report.state === "in_progress") return { kind: "responded", minutes: Math.max(0, minutesBetween(report.reportedAt, report.startedAt || undefined)) };
  if (report.state === "scheduled") return { kind: "scheduled", label: report.scheduledFor ? formatWhen(report.scheduledFor) : "Scheduled" };
  if (report.state === "completed") return { kind: "completed" };
  if (report.state === "cancelled") return { kind: "none" };
  const target = slaMinutes?.[report.priority];
  const remaining = report.responseDueAt
    ? -minutesBetween(report.responseDueAt)
    : target != null
      ? target - minutesBetween(report.reportedAt)
      : null;
  if (remaining == null) return { kind: "none" };
  if (remaining < 0) return { kind: "overdue", minutes: -remaining };
  const total = target ?? Math.max(remaining, 1);
  return { kind: "remaining", minutes: remaining, warning: remaining <= total * 0.35 };
}

/** Top reasons behind a report's priority: the triage's own reasons, else derived from its score components. */
export function priorityReasons(report: QueueReport): string[] {
  if (report.triage?.reasons.length) return report.triage.reasons.slice(0, 3);
  const reasons: string[] = [];
  if (report.triage?.keywordHits.length) reasons.push(`Safety signal: "${report.triage.keywordHits.join('", "')}"`);
  else if (report.safetyFlag) reasons.push("Flagged as hazardous by reporter");
  if (report.asset.criticality) reasons.push(`Criticality ${report.asset.criticality} asset`);
  if (report.asset.bottleneck) reasons.push(`${report.asset.line || "Line"} bottleneck`);
  if (report.triage?.history === "repeat") reasons.push(report.triage.historyText || "Repeat breakdown");
  return reasons.slice(0, 3);
}

/** P1 reports that need out-of-stock parts. */
export function triageWarnings(report: QueueReport): string[] {
  const missing = (report.triage?.spares ?? []).filter((part) => part.qty === 0);
  if (report.priority !== "P1" || !missing.length) return [];
  const parts = missing.map((part) => `${part.name} (lead time ${part.leadDays} days)`).join(", ");
  return [`P1 priority with parts out of stock: ${parts}. Coordinate with the warehouse/purchasing before heading out.`];
}

const ACTIVITY_ICONS: Record<string, LucideIcon> = {
  created: Download,
  ingested: Download,
  received: Download,
  triaged: Sparkles,
  triage_completed: Sparkles,
  assigned: UserPlus,
  reassigned: UserPlus,
  started: Play,
  scheduled: Calendar,
  schedule_cancelled: CalendarX,
  priority_overridden: ArrowUpDown,
  priority_override_reverted: RotateCcw,
  override_reverted: RotateCcw,
  escalated: ArrowUpRight,
  escalation_responded: Reply,
  note_added: StickyNote,
  note_updated: Pencil,
  cancelled: Ban,
  restored: Undo2,
  completed: CheckCircle2,
  updated: Pencil,
};

export const activityIcon = (type: string): LucideIcon => ACTIVITY_ICONS[type] ?? Activity;
