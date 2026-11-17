"use client";

import PageHeader from "@/components/PageHeader";
import { LoadingCapacityChart } from "../components/Chart";
import { LEGEND } from "../types";
import { Badge } from "../components/Badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useCapacityAccess, useCapacityQuery } from "../use-capacity";
import type { LoadingCapacity, Params } from "../api-types";
import { loadingGroups, thresholdLines } from "../analytics";
import { CapacityFilters, currentPeriod } from "../components/CapacityFilters";
import { ApiState } from "../components/ApiState";
import { BridgingTable, OvertimeTable } from "../components/ManagementTables";
import { BridgingForm } from "./components/ContingencyForms";

function StatCard({
  label,
  value,
  badge,
}: {
  label: string;
  value: string | number;
  badge?: { text: string; variant: "success" | "warning" };
}) {
  return (
    <div className="flex-1 rounded-lg border border-border bg-background p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <Badge color={badge?.text === "Success" ? "green" : "orange"}>
          {badge?.text}
        </Badge>
      </div>
      <div className="mt-1.5 text-2xl font-bold text-foreground">{value}</div>
    </div>
  );
}

export default function ContingencyPlanPage() {
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const { canManage } = useCapacityAccess();
  const [filters, setFilters] = useState<Params>(currentPeriod);
  const capacity = useCapacityQuery<LoadingCapacity>("/capacity/loading-vs-capacity", filters);
  const summary = useCapacityQuery<{ active_cases: number; lines_resolved: number; pending_review: number }>("/bridging-cases/summary");

  return (
    <div className="mb-15">
      <div className="flex flex-col gap-8">
        {/* Header */}
        <PageHeader
          title="Contingency Plan"
          subtitle="Manage bridging activities and plan contingency actions for over-capacity lines"
        />
        <CapacityFilters value={filters} onApply={setFilters} />
        <ApiState query={capacity} />
        <ApiState query={summary} />

        {/* Chart */}
        <div className="rounded-lg border border-border bg-background p-6 space-y-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Loading vs Capacity by Line
            </h2>
            <p className="text-xs text-neutral-400">
              Compare workload and available capacity across each production
              line.
            </p>
          </div>

          <LoadingCapacityChart
            groups={loadingGroups(capacity.data)}
            legend={LEGEND}
            refLines={thresholdLines(capacity.data?.thresholds)}
          />
        </div>

        {/* Bridging Management */}
        <div className="space-y-5 border p-6 rounded-lg">
          <h2 className="text-lg font-semibold text-foreground">
            Bridging Management
          </h2>

          <div className="flex flex-col gap-4 sm:flex-row">
            <StatCard label="Active Bridging Cases" value={summary.data?.active_cases ?? "-"} />
            <StatCard
              label="Lines Resolved"
              value={summary.data?.lines_resolved ?? "-"}
              badge={{ text: "Success", variant: "success" }}
            />
            <StatCard
              label="Pending Review"
              value={summary.data?.pending_review ?? "-"}
              badge={{ text: "Warning", variant: "warning" }}
            />
          </div>

          <BridgingTable title="Bridging Cases" params={{ year: filters.year, month: filters.month }} />
        </div>

        {/* Overtime Management */}
        <OvertimeTable params={{ year: filters.year, month: filters.month }} />
      </div>

      <div className="mt-5 flex justify-end">
        <Button disabled={!canManage} onClick={() => setIsOpenModal(true)}>Submit Bridging</Button>
      </div>

      {isOpenModal && <BridgingForm onClose={() => setIsOpenModal(false)} />}
    </div>
  );
}
