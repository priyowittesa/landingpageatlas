"use client";

import { Tr } from "../Tr";
import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { BarChart3, Info, Sparkles, Table2 } from "lucide-react";
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
import { SyntheticDataBadge } from "../SyntheticDataBadge";

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
      <div className="space-y-3 border-b border-primary-100/60 bg-gradient-to-r from-primary-50/70 to-transparent px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-5 w-1 shrink-0 rounded-full bg-primary-600" />
            <h2 className="text-base font-semibold"><Tr>{title}</Tr></h2>
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
                    <p><Tr>{formulaText}</Tr></p>
                    {threshold && <p className="mt-1 opacity-80"><Tr>{threshold}</Tr></p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
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
              <Tr>{showTable ? "View chart" : "View data"}</Tr>
            </Button>
          )}
        </div>
      </div>
        {takeaway && (
          <p className="flex w-full items-start gap-2.5 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2.5 text-sm text-primary-950">
            <span className="mt-0.5 flex shrink-0 items-center gap-1 rounded-md bg-primary-700 px-1.5 py-0.5 text-[0.6875rem] font-semibold text-white">
              <Sparkles size={12} aria-hidden />
              <Tr>AI insight</Tr>
            </span>
            <Tr>{takeaway}</Tr>
          </p>
        )}
      </div>

      <div id={panelId} className="p-6">
        {!hasData ? (
          <EmptyState
            title={empty?.title ?? "No data for this chart"}
            description={empty?.description}
          />
        ) : showTable ? (
          <div className="space-y-2">
            <p className="flex flex-wrap items-center gap-2 text-xs text-gray-700">
              {badge ?? <SyntheticDataBadge />}
            </p>
            <DataTable table={table} caption={title} />
          </div>
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
                <Tr>{column}</Tr>
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
                      <Tr>{cell}</Tr>
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
