import type { ReactNode } from "react";
import {
  AlarmClock,
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Ban,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  CircleDot,
  Database,
  Package,
  PackageCheck,
  PackageX,
  ShieldAlert,
  Siren,
  Sparkles,
  Timer,
  UserCheck,
  Wrench,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { stockStatus } from "../lib/scoring";
import type { AttributeSource, InsightSeverity, Priority, ReportState, SparePart } from "../lib/types";
import { useActiveScoringConfiguration } from "../scoring/use-scoring-configurations";
import { formatDuration, slaState } from "./queue/queue-helpers";
import type { QueueReport } from "./queue/use-breakdown-reports";

export type Tone = "green" | "amber" | "red" | "blue" | "primary" | "muted";

const TONE_CLASSES: Record<Tone, string> = {
  green: "border-green-200 bg-green-50 text-green-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  red: "border-red-200 bg-red-50 text-red-600",
  blue: "border-blue-200 bg-blue-50 text-blue-600",
  primary: "border-primary-200 bg-primary-50 text-primary-700",
  muted: "border-gray-200 bg-gray-100 text-gray-700",
};

export function StatusPill({ tone, icon: Icon, children }: { tone: Tone; icon?: LucideIcon; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone]
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
}

const PRIORITY_CLASSES: Record<Priority, string> = {
  P1: "bg-red-100 text-red-800 ring-red-300 [&_svg]:text-red-600",
  P2: "bg-amber-100 text-amber-800 ring-amber-300 [&_svg]:text-amber-600",
  P3: "bg-blue-100 text-blue-800 ring-blue-200",
};

const PRIORITY_ICONS: Record<Priority, LucideIcon> = { P1: Siren, P2: AlertTriangle, P3: CalendarClock };

export function PriorityTag({ priority, safety, large }: { priority: Priority; safety?: boolean; large?: boolean }) {
  const Icon = safety ? ShieldAlert : PRIORITY_ICONS[priority];
  return (
    <span
      title={`Priority ${priority}`}
      className={cn(
        "inline-flex items-center justify-center gap-1 whitespace-nowrap font-bold tracking-wide ring-1 ring-inset",
        large ? "h-12 min-w-16 rounded-xl px-2.5 text-xl" : "h-6 rounded-md px-1.5 text-xs",
        PRIORITY_CLASSES[priority],
        safety && "outline outline-[1.5px] outline-offset-2 outline-red-600"
      )}
    >
      <Icon className={cn("stroke-[2.5]", large ? "h-4 w-4" : "h-3 w-3")} />
      {priority}
    </span>
  );
}

/** Effective priority of a report; safety-forced P1s get a red ring unless overridden. */
export function PriorityBadge({ report, large }: { report: QueueReport; large?: boolean }) {
  return <PriorityTag priority={report.priority} safety={report.safety && !report.override} large={large} />;
}

const STATE_BADGES: Record<ReportState, { tone: Tone; icon: LucideIcon; label: string }> = {
  new: { tone: "primary", icon: CircleDot, label: "New" },
  in_progress: { tone: "blue", icon: Wrench, label: "In progress" },
  scheduled: { tone: "muted", icon: Calendar, label: "Scheduled" },
  escalated: { tone: "amber", icon: ArrowUpRight, label: "Escalated" },
  completed: { tone: "green", icon: CheckCircle2, label: "Completed" },
  cancelled: { tone: "muted", icon: Ban, label: "Cancelled" },
};

export const REPORT_STATE_LABELS = Object.fromEntries(
  Object.entries(STATE_BADGES).map(([state, badge]) => [state, badge.label])
) as Record<ReportState, string>;

export function StateBadge({ state }: { state: ReportState }) {
  const badge = STATE_BADGES[state];
  return (
    <StatusPill tone={badge.tone} icon={badge.icon}>
      {badge.label}
    </StatusPill>
  );
}

export function SafetyBadge({ report }: { report: QueueReport }) {
  if (report.safety) {
    return (
      <StatusPill tone="red" icon={ShieldAlert}>
        Safety risk
      </StatusPill>
    );
  }
  if (report.asset.statutory) {
    return (
      <StatusPill tone="muted" icon={BadgeCheck}>
        Statutory
      </StatusPill>
    );
  }
  return <span className="text-sm text-gray-500">—</span>;
}

/** Response target against the API deadline, or the active scoring version's target for the priority. */
export function SlaBadge({ report }: { report: QueueReport }) {
  const active = useActiveScoringConfiguration();
  const sla = slaState(report, active.data?.config.slaMinutes);
  const base = "inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium [&_svg]:h-3.5 [&_svg]:w-3.5";
  switch (sla.kind) {
    case "responded":
      return <span className={cn(base, "text-green-700")}><CheckCircle2 />Responded in {sla.minutes} min</span>;
    case "scheduled":
      return <span className={cn(base, "text-gray-500")}><Calendar />{sla.label}</span>;
    case "completed":
      return <span className={cn(base, "text-green-700")}><CheckCircle2 />Completed</span>;
    case "none":
      return <span className={cn(base, "text-gray-500")}>—</span>;
    case "overdue":
      return <span className={cn(base, "text-red-600")}><AlarmClock />Overdue {sla.minutes} min</span>;
    case "remaining":
      return (
        <span className={cn(base, sla.warning ? "text-orange-700" : "text-green-700")}>
          <Timer />
          {formatDuration(sla.minutes)} left
        </span>
      );
  }
}

export function SourceTag({ source }: { source: AttributeSource }) {
  const tag = {
    ai: { icon: Sparkles, label: "LLM", className: "bg-primary-50 text-primary-700" },
    manual: { icon: UserCheck, label: "Manual", className: "bg-green-50 text-green-700" },
    fabrix: { icon: Database, label: "Fabrix", className: "bg-gray-100 text-gray-700" },
  }[source];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", tag.className)}>
      <tag.icon className="h-3 w-3" />
      {tag.label}
    </span>
  );
}

export const confidenceLabel = (confidence: number) =>
  confidence >= 0.8 ? "High" : confidence >= 0.7 ? "Medium" : "Low";

export function ConfidenceBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-sm text-gray-500">—</span>;
  const color = value >= 0.8 ? "bg-green-600" : value >= 0.7 ? "bg-amber-500" : "bg-red-600";
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-100">
        <span className={cn("block h-full", color)} style={{ width: `${value * 100}%` }} />
      </span>
      {Math.round(value * 100)}%
    </span>
  );
}

export function StockBadge({ part }: { part: SparePart }) {
  const status = stockStatus(part);
  if (status === "in_stock") return <StatusPill tone="green" icon={Check}>In stock</StatusPill>;
  if (status === "low") return <StatusPill tone="amber" icon={AlertTriangle}>Low</StatusPill>;
  return <StatusPill tone="red" icon={XCircle}>Out of stock</StatusPill>;
}

export function StockSummary({ parts }: { parts: SparePart[] }) {
  const out = parts.filter((part) => stockStatus(part) === "out_of_stock").length;
  const low = parts.filter((part) => stockStatus(part) === "low").length;
  if (out) return <StatusPill tone="red" icon={PackageX}>{out} out of stock</StatusPill>;
  if (low) return <StatusPill tone="amber" icon={Package}>{low} low stock</StatusPill>;
  return <StatusPill tone="green" icon={PackageCheck}>Parts in stock</StatusPill>;
}

export function SeverityBadge({ severity }: { severity: InsightSeverity }) {
  return <StatusPill tone={severity === "High" ? "red" : severity === "Medium" ? "amber" : "muted"}>{severity}</StatusPill>;
}
