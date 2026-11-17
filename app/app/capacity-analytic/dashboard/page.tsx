"use client";

import { useState } from "react";
import { History, Upload, InfoIcon } from "lucide-react";
import { Badge } from "../components/Badge";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useCapacityAccess, useCapacityOptions, useCapacityQuery } from "../use-capacity";
import { Dashboard, ProductionPart } from "../api-types";
import { enumLabel, formatNumber } from "../api";
import { ApiState } from "../components/ApiState";
import { ActivityPlans } from "../components/ActivityPlans";
import { UploadHistory } from "../components/UploadHistory";
import { UploadPanel } from "../components/UploadPanel";
import { currentPeriod } from "../components/CapacityFilters";
import { DashboardPeriodFilter } from "./DashboardPeriodFilter";
import { productionPartStatus } from "../analytics";
import type { Params } from "../api-types";

export default function DashboardPage() {
  const [uploadKind, setUploadKind] = useState<"marketing-data" | "master-part" | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { canManage } = useCapacityAccess();
  const [period, setPeriod] = useState<Params>(currentPeriod);
  const dashboard = useCapacityQuery<Dashboard>("/capacity/dashboard", period);
  const parts = useCapacityOptions<ProductionPart>("/capacity/production-parts", period);
  const hasUnmappedParts = (dashboard.data?.unmapped_part_count ?? 0) > 0;
  const data = dashboard.data;
  const STATS = [
    { label: "Total Production Lines", value: formatNumber(data?.total_lines), badge: data ? "Active" : "", badgeColor: "blue" as const, caption: data ? data.unknown_lines ? `${data.unknown_lines} lines cannot be calculated` : "Production lines in the selected scope" : "-" },
    { label: "NG Lines (Overloaded)", value: data ? String(data.ng_lines?.length ?? 0) : "-", badge: data?.ng_lines?.length ? "Critical" : "", badgeColor: "red" as const, caption: data ? data.ng_lines?.map((line) => line.line_code).join(", ") || "No overloaded lines" : "-" },
    { label: "Overall Capacity", value: formatNumber(data?.overall_capacity_pct, "%"), badge: enumLabel(data?.overall_status), badgeColor: data?.overall_status?.endsWith("_NG") ? "red" as const : data?.overall_status?.endsWith("_WARNING") ? "orange" as const : "green" as const, caption: "Calculated for the selected period" },
    { label: "Recent Uploads Today", value: formatNumber(data?.uploads_today), badge: data ? "Today" : "", badgeColor: "green" as const, caption: data ? data.latest_upload_at ? `Latest: ${new Date(data.latest_upload_at).toLocaleString()}` : "No recent uploads" : "-" },
  ];
  const PARTS = (parts.data ?? []).map((part) => ({
    id: `${part.part_id}:${part.line?.line_id}`,
    pn: part.part_number,
    status: productionPartStatus(part),
    assignedLine: part.line?.line_code ?? "-", modelName: part.model || "-",
    orderVolume: formatNumber(part.loading_pcs, " pcs"),
  }));

  return (
    <div className="flex flex-col gap-6 xl:flex-row">
      {/* Main content */}
      <div className="min-w-0 flex-1 space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
            <PageHeader title="Dashboard" subtitle="Monitor production capacity and manage marketing data uploads" />
          <div className="flex flex-wrap items-center gap-2">
            <DashboardPeriodFilter value={period} onApply={setPeriod} />
            <Button variant="ghost" size="icon" aria-label="Upload History & Mapping" title="Upload History & Mapping" onClick={() => setHistoryOpen(true)}><History size={16} /></Button>
            <Button disabled={!canManage} onClick={() => setUploadKind("master-part")} variant="outline"><Upload size={16} />Upload Master Part</Button>
            <Button disabled={!canManage} onClick={() => setUploadKind("marketing-data")}>
              <Upload size={16} />
              Upload Marketing Data
            </Button>
          </div>
        </div>

        <ApiState query={dashboard} />
        <ApiState query={parts} />
        {/* Stat cards */}
        <div className={`grid grid-cols-1 gap-5 sm:grid-cols-2 ${uploadKind ? "2xl:grid-cols-4" : "xl:grid-cols-4"}`}>
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="min-w-0 rounded-xl border border-border bg-background p-6"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-neutral-500">
                  {stat.label}
                </span>
                {stat.badge && <Badge color={stat.badgeColor}>{stat.badge}</Badge>}
              </div>

              <div className="text-[32px] font-bold text-foreground">
                {stat.value}
              </div>
              <div className="mt-1 text-[11px] text-neutral-400">
                {stat.caption}
              </div>
            </div>
          ))}
        </div>

        {/* Production Parts List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            Production Parts List
          </h2>

          {hasUnmappedParts && (
            <div className="flex flex-wrap gap-3 items-center rounded-lg border border-warning/30 bg-warning/10 px-4 py-3">
              <InfoIcon size={16} className="shrink-0 text-warning" />
              <div className="min-w-0 flex-1 basis-48">
                <p className="text-sm font-semibold text-warning">
                  Unmapped Parts Found
                </p>
                <p className="text-sm text-warning">
                  {data?.unmapped_part_count} parts could not be mapped. Upload the latest Master Part
                  Data to complete the mapping.
                </p>
              </div>
              <Button disabled={!canManage} className="bg-warning" onClick={() => setUploadKind("master-part")}>Upload Master Part Data</Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PARTS.map((part) => {
              const isAlert = part.status?.alert;

              return (
                <div
                  key={part.id}
                  className={`min-w-0 rounded-xl border bg-background p-5 ${
                    isAlert ? "border-destructive" : "border-border"
                  }`}
                >
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="break-all font-bold text-foreground">{part.pn}</span>

                    {part.status && <Badge color={part.status.color}>
                      {part.status.label}
                    </Badge>}
                  </div>

                  <dl className="space-y-1.5 text-xs">
                    <div className="flex justify-between gap-3">
                      <dt className="text-neutral-500">Assigned Line</dt>
                      <dd className="min-w-0 break-words text-right font-semibold text-foreground">
                        {part.assignedLine}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-3">
                      <dt className="text-neutral-500">Model Name</dt>
                      <dd className="min-w-0 break-words text-right font-semibold text-foreground">
                        {part.modelName}
                      </dd>
                    </div>

                    <div className="flex justify-between gap-3">
                      <dt className="text-neutral-500">Order Volume</dt>
                      <dd className="font-semibold text-foreground">
                        {part.orderVolume}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
          {!parts.isPending && !parts.error && !PARTS.length && <p className="text-sm text-muted-foreground">No production parts for this period.</p>}
        </div>

        {/* Activity Plan & Line Audits */}
        <ActivityPlans />
      </div>

      {uploadKind && <UploadPanel key={uploadKind} kind={uploadKind} onClose={() => setUploadKind(null)} />}
      {historyOpen && <UploadHistory onClose={() => setHistoryOpen(false)} />}
    </div>
  );
}
