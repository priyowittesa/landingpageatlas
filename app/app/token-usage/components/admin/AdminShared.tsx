"use client";

import type { ElementType } from "react";
import { CalendarClock, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { resetPeriodLabels, type TokenPolicyValues } from "../../types/admin";
import { formatTokens } from "../../lib/format";

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

/** "Default" / "Custom" badge for a client's policy source. */
export function PolicySourceBadge({
  source
}: {
  source: "default" | "override";
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        source === "override"
          ? "border-violet-400 bg-violet-50 text-violet-600"
          : "border-gray-300 bg-gray-50 text-gray-600"
      )}
    >
      {source === "override" ? "Custom" : "Default"}
    </Badge>
  );
}

/** "Pending" badge for a scheduled change. */
export function PendingBadge() {
  return (
    <Badge
      variant="outline"
      className="border-amber-400 bg-amber-50 text-xs font-medium text-amber-600"
    >
      <CalendarClock className="mr-1 h-3 w-3" />
      Scheduled
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Policy values display
// ---------------------------------------------------------------------------

/** A single labelled value row. */
function ValueRow({
  label,
  value,
  highlight
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-xs text-gray-500">{label}</span>
      <span
        className={cn(
          "text-sm font-semibold",
          highlight ? "text-primary-700" : "text-gray-800"
        )}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * Read-only stack of the four policy values. When `compareAgainst` is supplied,
 * fields that differ from the reference are highlighted — used on the client
 * detail page to show the in-force policy vs the default baseline.
 */
export function PolicyValuesDisplay({
  values,
  compareAgainst
}: {
  values: TokenPolicyValues;
  compareAgainst?: TokenPolicyValues;
}) {
  const differs = (field: keyof TokenPolicyValues) =>
    compareAgainst ? compareAgainst[field] !== values[field] : false;

  return (
    <div className="divide-y divide-gray-100">
      <ValueRow
        label="Token allowance"
        value={formatTokens(values.allowance)}
        highlight={differs("allowance")}
      />
      <ValueRow
        label="Reset period"
        value={resetPeriodLabels[values.resetPeriod]}
        highlight={differs("resetPeriod")}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card shell (mirrors TokenUsageCard but local to the admin pages)
// ---------------------------------------------------------------------------

export function AdminCard({
  icon: Icon,
  title,
  subtitle,
  headerRight,
  className,
  children
}: {
  icon: ElementType;
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
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
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Small labelled KPI card (reuses the Token Usage card styling)
// ---------------------------------------------------------------------------

export function AdminKpiCard({
  label,
  value,
  caption,
  valueClassName
}: {
  label: string;
  value: string;
  caption?: string;
  valueClassName?: string;
}) {
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
      {caption && (
        <p className="mt-1 truncate text-xs text-gray-500">{caption}</p>
      )}
    </Card>
  );
}

/** Icon-only decorative chip used in dialog headers. */
export function DialogIcon({
  icon: Icon,
  className
}: {
  icon: ElementType;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </div>
  );
}

export { SlidersHorizontal, ShieldCheck };
