"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Info, Lightbulb, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getMetric, type MetricId } from "../../metrics";
import type { ChartTable } from "../../types";
import { EmptyState } from "../EmptyState";

type ChartCardProps = {
  title: string;
  /** Formula tooltip comes from the metric dictionary */
  metricId?: MetricId;
  /** Overrides the formula of the metric, for a chart that combines several */
  formula?: string;
  /** The conclusion of the chart, computed in selectors */
  takeaway: string | null;
  /** The same data as the chart, behind "View data" */
  table: ChartTable;
  /** Screen-reader description of the chart */
  ariaLabel: string;
  /** Shown instead of the chart when there is no data */
  empty?: { title: string; description?: string } | null;
  badge?: ReactNode;
  className?: string;
  children: ReactNode;
};

/**
 * Frame of every chart: title, formula tooltip, the computed takeaway, a
 * "View data" switch to the underlying table, and an empty state.
 */
export function ChartCard({
  title,
  metricId,
  formula,
  takeaway,
  table,
  ariaLabel,
  empty = null,
  badge,
  className,
  children
}: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const panelId = useId();
  const metric = metricId ? getMetric(metricId) : null;
  const formulaText = formula ?? metric?.formula ?? null;
  const threshold = metric?.threshold ?? null;
  const hasData = empty === null && table.rows.length > 0;

  return (
    <section className={cn("ptepi-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-6 py-5">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-5 w-1 shrink-0 rounded-full bg-primary-600" />
            <h2 className="text-base font-semibold">{title}</h2>
            {formulaText && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label={`Formula of ${title}: ${formulaText}`}
                      className="rounded-full p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    >
                      <Info size={16} aria-hidden />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{formulaText}</p>
                    {threshold && <p className="mt-1 opacity-80">{threshold}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {takeaway && (
            <p className="flex items-start gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-primary-900">
              <Lightbulb size={16} className="mt-0.5 shrink-0 text-primary-700" aria-hidden />
              {takeaway}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {hasData && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              aria-pressed={showTable}
              aria-controls={panelId}
              onClick={() => setShowTable((value) => !value)}
            >
              {showTable ? <BarChart3 size={16} aria-hidden /> : <Table2 size={16} aria-hidden />}
              {showTable ? "View chart" : "View data"}
            </Button>
          )}
        </div>
      </div>

      <div id={panelId} className="p-6">
        {!hasData ? (
          <EmptyState
            title={empty?.title ?? "No data for this chart"}
            description={empty?.description}
          />
        ) : showTable ? (
          <DataTable table={table} caption={title} />
        ) : (
          <div role="img" aria-label={ariaLabel}>
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

function DataTable({ table, caption }: { table: ChartTable; caption: string }) {
  return (
    <div className="max-h-96 overflow-auto rounded-lg border border-border">
      <Table>
        <caption className="sr-only">{caption}</caption>
        <TableHeader>
          <TableRow>
            {table.columns.map((column, index) => (
              <TableHead key={column} className={cn(index > 0 && "text-right")}>
                {column}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row, rowIndex) => (
            <TableRow key={`${row.cells[0]}-${rowIndex}`}>
              {row.cells.map((cell, index) => (
                <TableCell
                  key={`${table.columns[index]}-${index}`}
                  className={cn("whitespace-nowrap tabular-nums", index > 0 && "text-right")}
                >
                  {index === 0 && row.href ? (
                    <Link href={row.href} className="font-medium text-primary-700 hover:underline">
                      {cell}
                    </Link>
                  ) : (
                    cell
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
