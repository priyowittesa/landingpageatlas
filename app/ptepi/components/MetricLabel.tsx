"use client";

import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getMetric, type MetricId } from "../metrics";

type MetricLabelProps = {
  metricId: MetricId;
  className?: string;
};

/**
 * The label of a metric with its formula on hover or focus. Label and formula come
 * from metrics.ts, so the same figure reads the same on every screen.
 */
export function MetricLabel({ metricId, className }: MetricLabelProps) {
  const metric = getMetric(metricId);
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      {metric.label}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`Formula of ${metric.label}: ${metric.formula}`}
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <Info size={14} aria-hidden />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p>{metric.formula}</p>
            {metric.threshold && <p className="mt-1 opacity-80">{metric.threshold}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}
