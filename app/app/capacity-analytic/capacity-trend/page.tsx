"use client";

import PageHeader from "@/components/PageHeader";
import { useState } from "react";
import { CapacityFilters, currentPeriod } from "../components/CapacityFilters";
import { CapacityTrendChart } from "./components/CapacityTrendChart";
import { ApiState } from "../components/ApiState";
import { BridgingTable } from "../components/ManagementTables";
import { useCapacityQuery } from "../use-capacity";
import type { Params, Trend } from "../api-types";

const legend = [
  { label: "Loading", color: "#3B0764" }, { label: "N-1", color: "#A78BFA" },
  { label: "Capacity 1 Shift", color: "#F59E0B" }, { label: "Capacity 2 Shift", color: "#FBBF24" },
  { label: "Capacity 3 Shift", color: "#FDE68A" },
];

export default function CapacityTrendPage() {
  const [filters, setFilters] = useState<Params>(() => ({ year: currentPeriod().year, plan: "production" }));
  const query = useCapacityQuery<Trend>("/capacity/trend", {
    year: filters.year, line_id: filters.line_id, plan: filters.plan,
  }, !!filters.line_id);
  const points = (query.data?.months ?? []).map((point) => ({
    month: new Date(Number(filters.year), point.month - 1).toLocaleString("en", { month: "short" }),
    loading: point.capacity?.capacity_pct, n1: point.previous_year?.capacity_pct,
    shift1: point.shift_capacities?.find((item) => item.shifts_per_day === 1)?.capacity_pct,
    shift2: point.shift_capacities?.find((item) => item.shifts_per_day === 2)?.capacity_pct,
    shift3: point.shift_capacities?.find((item) => item.shifts_per_day === 3)?.capacity_pct,
  }));
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Capacity Trend"
        subtitle="Analyze production capacity trends over time by plan, product, and line"
      />

      {/* Filters */}
      <CapacityFilters value={filters} onApply={setFilters} trend />
      {filters.line_id ? <ApiState query={query} /> : <p className="text-sm text-muted-foreground">Select a production line to view its yearly trend.</p>}

      {/* Chart */}
      <div className="rounded-xl border border-border bg-background p-4">
        <h2 className="text-lg font-semibold text-foreground">
          Capacity Trend - Yearly Overview
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1 max-w-2xl">
          {query.data?.summary}
        </p>
        <div className="mt-4">
          <CapacityTrendChart
            data={points}
            legend={legend}
            refLines={query.data?.thresholds ? [
              { pct: query.data.thresholds.warning_pct, label: `Warning (${query.data.thresholds.warning_pct}%)`, color: "#F59E0B", dashStyle: "dashed" },
              { pct: query.data.thresholds.ng_pct, label: `NG Threshold (${query.data.thresholds.ng_pct}%)`, color: "#EF4444", dashStyle: "dotted" },
            ] : []}
          />
        </div>
        {(query.data?.months ?? []).filter((point) => point.capacity?.problem).map((point) => <p key={point.month} className="text-sm text-muted-foreground">
          Month {point.month}: {point.capacity?.problem}
        </p>)}
      </div>

      {/* Bridging History */}
      <BridgingTable params={{ year: filters.year, line_id: filters.line_id }} />
    </div>
  );
}
