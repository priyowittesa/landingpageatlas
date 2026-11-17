"use client";

import { Sparkles, RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type {
  Insight,
  InsightCategory,
  InsightSeverity,
  KpiCard
} from "./mock-data";

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

export interface FilterBarProject {
  id: string;
  title: string;
}

interface FilterBarProps {
  projects: FilterBarProject[];
  projectsLoading?: boolean;
  projectId: string;
  dateFrom: string;
  dateTo: string;
  onProjectChange: (id: string) => void;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
  onReset: () => void;
}

const ALL_PROJECTS_VALUE = "all";

export function FilterBar({
  projects,
  projectsLoading = false,
  projectId,
  dateFrom,
  dateTo,
  onProjectChange,
  onDateFromChange,
  onDateToChange,
  onReset
}: FilterBarProps) {
  const hasActiveFilter = Boolean(projectId || dateFrom || dateTo);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={projectId || ALL_PROJECTS_VALUE}
        onValueChange={(value) =>
          onProjectChange(value === ALL_PROJECTS_VALUE ? "" : value)
        }
        disabled={projectsLoading}
      >
        <SelectTrigger className="h-8 w-auto gap-2 rounded-lg border-gray-200 bg-white px-3 text-xs font-medium text-gray-700 shadow-none hover:bg-gray-50">
          <span className="text-gray-400">Project:</span>
          <SelectValue
            placeholder={projectsLoading ? "Loading..." : "All Projects"}
          />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PROJECTS_VALUE}>All Projects</SelectItem>
          {projects.map((project) => (
            <SelectItem key={project.id} value={project.id}>
              {project.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <DatePicker
          value={dateFrom}
          onChange={onDateFromChange}
          placeholder="Start date"
          max={dateTo || undefined}
          className="h-8 w-32.5 rounded-lg border-gray-200 text-xs"
        />
        <span className="text-xs text-gray-400">—</span>
        <DatePicker
          value={dateTo}
          onChange={onDateToChange}
          placeholder="End date"
          min={dateFrom || undefined}
          className="h-8 w-32.5 rounded-lg border-gray-200 text-xs"
        />
      </div>

      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 text-[11px]"
        onClick={onReset}
        disabled={!hasActiveFilter}
      >
        <RotateCcw className="h-3 w-3" />
        Reset Filters
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI card row
// ---------------------------------------------------------------------------

export function KpiCardRow({ cards }: { cards: KpiCard[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((kpi) => (
        <Card key={kpi.id} className="px-4 py-3.5">
          <p className="text-[11px] font-medium text-gray-500">{kpi.label}</p>
          <p className="mt-2 text-2xl font-bold leading-none text-gray-950">
            {kpi.value}
          </p>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Insights section
// ---------------------------------------------------------------------------

const categoryStyles: Record<InsightCategory, string> = {
  ANOMALY: "bg-red-50 text-red-600",
  PREDICTION: "bg-blue-50 text-blue-600",
  RECOMMENDATION: "bg-purple-50 text-purple-600"
};

const severityStyles: Record<InsightSeverity, string> = {
  High: "bg-red-50 text-red-600",
  Medium: "bg-amber-50 text-amber-600",
  Low: "bg-gray-100 text-gray-500"
};

function InsightCardView({ insight }: { insight: Insight }) {
  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold tracking-wide",
            categoryStyles[insight.category]
          )}
        >
          {insight.category}
        </span>
        <span
          className={cn(
            "rounded px-2 py-0.5 text-[10px] font-bold",
            severityStyles[insight.severity]
          )}
        >
          {insight.severity}
        </span>
      </div>
      <h4 className="mt-3 text-sm font-semibold leading-5 text-gray-950">
        {insight.title}
      </h4>
      <p className="mt-2 text-[11px] leading-normal text-gray-600">
        {insight.description}
      </p>
      <p className="mt-auto pt-4 text-[10px] text-gray-400">{insight.source}</p>
      {insight.actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {insight.actions.map((action, i) => (
            <button
              key={action}
              type="button"
              className={cn(
                "h-7 rounded-md px-3 text-[11px] font-semibold transition-colors",
                i === 0
                  ? "border border-primary-700 text-primary-700 hover:bg-primary-50"
                  : "border border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
            >
              {action}
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

export function AiInsightsSection({
  insights,
  insightCount,
  updatedAt,
  actionLabel = "Ask AI",
  onAction,
  actionPending = false,
  loading = false
}: {
  insights: Insight[];
  insightCount: number;
  /** "2 min ago"; left out of the subtitle when empty. */
  updatedAt: string;
  actionLabel?: string;
  onAction?: () => void;
  actionPending?: boolean;
  loading?: boolean;
}) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50">
            <Sparkles className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-950">AI Insights</h3>
            <p className="text-[11px] text-gray-500">
              {loading
                ? "Loading insights..."
                : `${insightCount} insights detected${updatedAt ? ` · updated ${updatedAt}` : ""}`}
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={onAction}
          disabled={actionPending}
        >
          {actionPending ? (
            <Spinner className="h-3.5 w-3.5" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {actionLabel}
        </Button>
      </div>
      {loading ? (
        <div className="mt-5 flex h-24 items-center justify-center">
          <Spinner className="size-6 text-primary" />
        </div>
      ) : insights.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-gray-200 py-8 text-center text-xs text-gray-500">
          No insights yet. Click {actionLabel} to scan the latest data.
        </p>
      ) : (
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <InsightCardView key={insight.id} insight={insight} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Chart card wrapper (shared by all chart sections)
// ---------------------------------------------------------------------------

export function ChartCard({
  title,
  subtitle,
  badge,
  children,
  className,
  headerRight
}: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-gray-950">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-[10px] text-gray-400">{subtitle}</p>
          )}
        </div>
        {headerRight ??
          (badge && (
            <span className="shrink-0 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">
              {badge}
            </span>
          ))}
      </div>
      <div className="mt-5">{children}</div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Horizontal bar list (shared by Man-hour per Employee, Activity Code, etc.)
// ---------------------------------------------------------------------------

export type BarListItem = {
  label: string;
  sublabel?: string;
  value: number;
  maxValue: number;
  valueLabel: string;
  secondaryValueLabel?: string;
  secondaryValue?: number;
};

export function HorizontalBarList({
  items,
  primaryColor = "bg-primary-600",
  secondaryColor = "bg-primary-200",
  showSecondary = false
}: {
  items: BarListItem[];
  primaryColor?: string;
  secondaryColor?: string;
  showSecondary?: boolean;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <div className="w-28 shrink-0 truncate text-right text-[11px] font-medium text-gray-700">
            {item.sublabel && (
              <span className="text-primary-600">{item.sublabel} </span>
            )}
            {item.label}
          </div>
          <div className="flex h-3.5 flex-1 items-center gap-0.5">
            <div
              className={cn("h-2.5 rounded-sm", primaryColor)}
              style={{
                width: `${(item.value / item.maxValue) * 100}%`
              }}
            />
            {showSecondary && item.secondaryValue !== undefined && (
              <div
                className={cn("h-2.5 rounded-sm", secondaryColor)}
                style={{
                  width: `${(item.secondaryValue / item.maxValue) * 100}%`
                }}
              />
            )}
          </div>
          <div className="w-20 shrink-0 text-right text-[11px] font-semibold text-gray-700">
            {item.valueLabel}
            {showSecondary && item.secondaryValueLabel && (
              <span className="font-normal text-gray-400">
                {" · "}
                {item.secondaryValueLabel}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
