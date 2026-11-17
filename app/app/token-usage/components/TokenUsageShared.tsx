"use client";

import type { ElementType } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  granularityLabels,
  requestStatusClassMap,
  requestStatusLabels,
  type TokenRequestStatus,
  type TokenUsageGranularity
} from "../types";
import {
  formatMonthYear,
  formatPercent,
  formatTokens,
  shiftMonth
} from "../lib/format";

// ---------------------------------------------------------------------------
// KPI card
// ---------------------------------------------------------------------------

/**
 * The four-up metric card used at the top of every Token Usage page:
 * label, large value, and a muted caption with an optional trend chip.
 */
export function TokenKpiCard({
  label,
  value,
  caption,
  trendPercent,
  valueClassName
}: {
  label: string;
  value: string;
  caption?: string;
  trendPercent?: number;
  valueClassName?: string;
}) {
  const isUp = (trendPercent ?? 0) >= 0;
  const TrendIcon = isUp ? ArrowUp : ArrowDown;

  return (
    <Card className="px-4 py-4">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold leading-8 text-gray-950",
          valueClassName
        )}
      >
        {value}
      </p>
      <div className="mt-1 flex items-center gap-2">
        {caption && (
          <span className="truncate text-xs text-gray-500">{caption}</span>
        )}
        {trendPercent !== undefined && (
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-0.5 text-xs font-medium",
              isUp ? "text-primary-700" : "text-emerald-600"
            )}
          >
            <TrendIcon className="h-3 w-3" />
            {Math.abs(trendPercent)}% from yesterday
          </span>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Card shell with an icon header
// ---------------------------------------------------------------------------

/**
 * Card wrapper matching the design's `compliance-trend-card`: a soft icon
 * button, a title/subtitle stack, and an optional right-aligned control slot.
 */
export function TokenUsageCard({
  icon: Icon,
  title,
  subtitle,
  headerRight,
  footer,
  className,
  children
}: {
  icon: ElementType;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("flex flex-col p-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50">
            <Icon className="h-4 w-4 text-primary-700" />
          </div>
          <div>
            <h3 className="text-sm font-bold leading-5 text-gray-950">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>
            )}
          </div>
        </div>
        {headerRight}
      </div>

      <div className="mt-6 flex-1">{children}</div>

      {footer && (
        <div className="mt-6 border-t border-gray-100 pt-5">{footer}</div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Granularity segmented control
// ---------------------------------------------------------------------------

/** Segmented control ("Tabs for Blocks" in the design) for chart buckets. */
export function ConsumptionFilters({
  month,
  granularity,
  onMonthChange,
  onGranularityChange
}: {
  month: Date;
  granularity: TokenUsageGranularity;
  onMonthChange: (month: Date) => void;
  onGranularityChange: (granularity: TokenUsageGranularity) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex h-9 items-center rounded-lg border border-gray-200 bg-white px-2 shadow-sm">
        <CalendarDays className="mr-2 h-4 w-4 text-gray-600" />
        <span className="min-w-18 text-sm font-medium text-gray-800">
          {formatMonthYear(month)}
        </span>
        <button
          type="button"
          className="ml-1 rounded p-1 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          onClick={() => onMonthChange(shiftMonth(month, -1))}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded p-1 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-800"
          onClick={() => onMonthChange(shiftMonth(month, 1))}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <GranularityTabs
        value={granularity}
        options={["weekly", "monthly"]}
        onChange={onGranularityChange}
      />
    </div>
  );
}

export function GranularityTabs({
  value,
  options,
  onChange
}: {
  value: TokenUsageGranularity;
  options: TokenUsageGranularity[];
  onChange: (next: TokenUsageGranularity) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
            value === option
              ? "bg-primary-50 text-primary-700"
              : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
          )}
        >
          {granularityLabels[option]}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badges
// ---------------------------------------------------------------------------

/** Badge for a logged AI request — Completed / Rejected 402 / Failed. */
export function RequestStatusBadge({
  status,
  statusCode
}: {
  status: TokenRequestStatus;
  statusCode?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", requestStatusClassMap[status])}
    >
      {requestStatusLabels[status]}
      {statusCode ? ` ${statusCode}` : ""}
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Usage bars
// ---------------------------------------------------------------------------

/**
 * A labelled progress row: `module name · bar · token count`.
 * Used for the "Usage by module" breakdown on the Overview page.
 */
export function ModuleUsageRow({
  label,
  percent,
  tokens
}: {
  label: string;
  percent: number;
  tokens: number;
}) {
  return (
    <div className="flex items-center gap-4">
      <span className="w-40 shrink-0 truncate text-sm text-gray-700">
        {label}
      </span>
      <Progress
        value={percent}
        className="h-2 flex-1"
        indicatorClassName="bg-primary-600"
      />
      <span className="w-14 shrink-0 text-right text-sm font-semibold text-gray-700">
        {formatTokens(tokens)}
      </span>
    </div>
  );
}

/**
 * The "LEFT" table cell: a remaining-balance bar coloured by health, followed
 * by the raw remaining token count.
 */
export function RemainingBar({
  remaining,
  remainingPercent,
  warningThresholdPercent
}: {
  remaining: number;
  remainingPercent: number;
  warningThresholdPercent: number;
}) {
  const indicatorClassName =
    remainingPercent <= 0
      ? "bg-red-500"
      : remainingPercent < warningThresholdPercent
        ? "bg-amber-500"
        : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3">
      <Progress
        value={remainingPercent}
        className="h-2 w-40"
        indicatorClassName={indicatorClassName}
      />
      <span className="w-20 text-sm text-gray-700">
        {formatTokens(remaining)}
        <span className="ml-1 text-xs text-gray-400">
          {formatPercent(remainingPercent)}
        </span>
      </span>
    </div>
  );
}
