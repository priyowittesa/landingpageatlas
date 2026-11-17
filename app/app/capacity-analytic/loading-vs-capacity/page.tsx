"use client";

import { useState } from "react";
import { LoadingCapacityChart } from "../components/Chart";
import PageHeader from "@/components/PageHeader";
import { LEGEND } from "../types";
import { CustomTable, CustomTableColumn } from "../components/CustomTable";
import { CapacityFilters, currentPeriod } from "../components/CapacityFilters";
import { ManagementTables } from "../components/ManagementTables";
import { ApiState } from "../components/ApiState";
import { useCapacityQuery } from "../use-capacity";
import type { LoadingCapacity, Params } from "../api-types";
import { loadingGroups, loadingRows, thresholdLines } from "../analytics";

const capacityColumns: CustomTableColumn<ReturnType<typeof loadingRows>[number]>[] = [
  {
    header: "Line",
    cell: (row) => (
      <span className="font-medium text-foreground">{row.line}</span>
    ),
  },
  { header: "CT", cell: (row) => row.ct },
  { header: "Efficiency", cell: (row) => row.efficiency },
  { header: "Pcs/H", cell: (row) => row.pcsPerHour },
  { header: "Max Cap", cell: (row) => row.maxCap },
  { header: "N", cell: (row) => row.n },
  { header: "N After", cell: (row) => row.nAfter },
  { header: "N+1", cell: (row) => row.n1 },
  { header: "N+2", cell: (row) => row.n2 },
  { header: "N+3", cell: (row) => row.n3 },
];

export default function LoadingVsCapacityPage() {
  const [filters, setFilters] = useState<Params>(currentPeriod);
  const query = useCapacityQuery<LoadingCapacity>("/capacity/loading-vs-capacity", filters);
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title="Loading vs Capacity"
        subtitle="Compare production loading against available capacity across lines"
      />

      {/* Filters */}
      <CapacityFilters value={filters} onApply={setFilters} />
      <ApiState query={query} />

      {/* Chart */}
      <div className="rounded-lg border border-border bg-background p-6 space-y-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Loading vs Capacity by Line
          </h2>
          <p className="text-xs text-neutral-400">
            Compare workload and available capacity across each production line.
          </p>
        </div>

        <LoadingCapacityChart
          groups={loadingGroups(query.data)}
          legend={LEGEND}
          refLines={thresholdLines(query.data?.thresholds)}
        />
        {(query.data?.lines ?? []).flatMap((item) => (item.points ?? []).filter((point) => point.capacity?.problem).map((point) => (
          <p key={`${item.line.line_id}:${point.offset}`} className="text-sm text-muted-foreground">{item.line.line_code} ({point.label}): {point.capacity?.problem}</p>
        )))}
      </div>

      {/* Table */}
      <CustomTable
        title="Resume Loading vs Capacity"
        columns={capacityColumns}
        data={loadingRows(query.data)}
        getRowId={(row) => row.line}
        searchableFields={(row) => [row.line]}
        legends={
          <div className="text-sm font-semibold space-x-5 mt-5">
            <span>CD: Capacity Daily</span>
            <span>CM: Capacity Monthly</span>
          </div>
        }
      />

      <ManagementTables params={filters} />
    </div>
  );
}
