"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import Table from "@/components/Table";
import { Input } from "@/components/ui/input";
import type { TableColumn } from "@/types/type";
import type { Asset } from "../data";
import { useAssetDetail } from "../use-assets";
import { useFrequencyType } from "../../frequency-type/use-frequency-types";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useAssetUsageLogs, type AssetUsageLog } from "./use-asset-usage-logs";
import {
  useWorkOrders,
  type WorkOrder
} from "../../work-orders/use-work-orders";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

type Tab = "overview" | "usage" | "orders";

export function AssetDetail({ id }: { id: string }) {
  const assetQuery = useAssetDetail(id);
  const frequencyQuery = useFrequencyType(
    assetQuery.data?.frequencyTypeId ?? ""
  );
  const [tab, setTab] = useState<Tab>("overview");
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setItems);
  const clear = useBreadcrumbStore((s) => s.clear);
  useEffect(() => {
    setBreadcrumbs([
      { title: "Asset List", href: "/app/asset-management/asset-list" },
      { title: "Asset Detail" }
    ]);
    return clear;
  }, [setBreadcrumbs, clear]);

  if (assetQuery.isLoading)
    return (
      <div className="flex min-h-80 items-center justify-center text-sm text-gray-500">
        Loading asset detail...
      </div>
    );
  if (assetQuery.isError || !assetQuery.data)
    return (
      <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border bg-white">
        <p className="text-sm text-red-600">Unable to load asset detail.</p>
        <button
          type="button"
          onClick={() => assetQuery.refetch()}
          className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Try Again
        </button>
      </div>
    );

  const asset = assetQuery.data;
  return (
    <div className="space-y-5 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/app/asset-management/asset-list"
            className="flex items-center gap-2 text-base font-semibold hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            {asset.name}
          </Link>
          <p className="mt-1 text-xs text-gray-500">Asset Code: {asset.code}</p>
        </div>
        <AssetStatusBadge value={asset.status} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Metric
          label="Frequency Type"
          value={
            frequencyQuery.isLoading
              ? "Loading..."
              : frequencyQuery.data?.name || asset.frequency
          }
        />
        <Metric label="Threshold" value={asset.threshold} />
        <Metric label="Current Usage" value={asset.usage} />
      </div>
      <div className="flex gap-5 border-b">
        {(
          [
            ["overview", "Overview"],
            ["usage", "Usage Log"],
            ["orders", "Work Orders"]
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`border-b-2 px-1 pb-2 text-xs font-medium ${tab === key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "overview" && (
        <Overview asset={asset} assetId={id} onViewDetail={setTab} />
      )}{" "}
      {tab === "usage" && <UsageLog assetId={id} />}{" "}
      {tab === "orders" && <WorkOrders assetId={id} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}
function AssetStatusBadge({ value }: { value: Asset["status"] }) {
  const style =
    value === "Breakdown"
      ? "bg-red-50 text-red-600"
      : value === "Preventive"
        ? "bg-amber-50 text-amber-600"
        : "bg-emerald-50 text-emerald-600";
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${style}`}
    >
      {value}
    </span>
  );
}
function Card({
  title,
  subtitle,
  children,
  action
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
function Overview({
  asset,
  assetId,
  onViewDetail
}: {
  asset: Asset;
  assetId: string;
  onViewDetail: (tab: Tab) => void;
}) {
  const usageQuery = useAssetUsageLogs({ assetId, pageSize: 5 });
  const workOrderQuery = useWorkOrders({ asset_id: assetId, page_size: 5 });
  const usageRows = usageQuery.data?.items ?? [];
  const workOrderRows = workOrderQuery.data?.items ?? [];
  const progress =
    asset.serviceInterval > 0
      ? Math.min(
          100,
          Math.max(0, (asset.usageNumber / asset.serviceInterval) * 100)
        )
      : 0;
  const progressLabel = `${Number(progress.toFixed(1))}%`;
  const unit = asset.usageUnit ? ` ${asset.usageUnit}` : "";
  const usageProgress = `${asset.usageNumber.toLocaleString("en-US")} / ${asset.serviceInterval.toLocaleString("en-US")}${unit}`;
  const schedule =
    asset.serviceInterval > 0
      ? `${asset.autoCreateWorkOrder ? "Automatic work order enabled. " : ""}Next maintenance is due at ${asset.serviceInterval.toLocaleString("en-US")}${unit}.`
      : "Maintenance service interval has not been configured.";

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card
          title="Asset Specifications"
          subtitle="Core details and operational status"
        >
          <dl className="divide-y text-xs">
            {[
              ["Asset Code", asset.code],
              ["Asset Name", asset.name],
              ["Model", asset.model],
              ["Current Project / Site", asset.project]
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-3">
                <dt className="text-gray-500">{k}</dt>
                <dd className="font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <Card
          title="Maintenance Progress"
          subtitle="Operational health and upcoming schedules"
        >
          <div className="flex justify-between text-sm">
            <b>{progressLabel} Service Interval Reached</b>
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] text-white">
              {progressLabel}
            </span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            {asset.serviceInterval > 0
              ? `${usageProgress} used toward the next service`
              : "Service interval is not configured"}
          </p>
          <div className="mt-5 flex items-center gap-3 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            <span>{schedule}</span>
          </div>
        </Card>
      </div>
      <Card
        title="Recent Usage"
        action={
          <button
            onClick={() => onViewDetail("usage")}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            View Detail
          </button>
        }
      >
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[620px] text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {["Date", "Usage Value", "Recorded By"].map((header) => (
                  <th key={header} className="p-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usageRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{formatRecordedAt(row.recordedAt)}</td>
                  <td className="p-3">
                    {row.usageValue}
                    {row.recordedUnit ? ` ${row.recordedUnit}` : ""}
                  </td>
                  <td className="p-3">{row.recordedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {(usageQuery.isLoading || usageQuery.isFetching) && (
            <TableState text="Loading recent usage..." />
          )}
          {usageQuery.isError && (
            <TableState text="Unable to load recent usage." error />
          )}
          {!usageQuery.isLoading &&
            !usageQuery.isError &&
            usageRows.length === 0 && (
              <TableState text="No recent usage found." />
            )}
        </div>
      </Card>
      <Card
        title="Recent Work Orders"
        action={
          <button
            onClick={() => onViewDetail("orders")}
            className="text-xs text-gray-500 hover:text-gray-900"
          >
            View Detail
          </button>
        }
      >
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                {["WO Number", "Type", "Date", "Status"].map((header) => (
                  <th key={header} className="p-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workOrderRows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3 font-medium">
                    <Link
                      href={`/app/asset-management/work-orders/${row.id}`}
                      className="hover:underline"
                    >
                      {row.number}
                    </Link>
                  </td>
                  <td className="p-3">{prettyWorkOrderValue(row.type)}</td>
                  <td className="p-3">{formatRecordedAt(row.occurredAt)}</td>
                  <td className="p-3">
                    <WorkOrderStatus value={row.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(workOrderQuery.isLoading || workOrderQuery.isFetching) && (
            <TableState text="Loading recent work orders..." />
          )}
          {workOrderQuery.isError && (
            <TableState text="Unable to load recent work orders." error />
          )}
          {!workOrderQuery.isLoading &&
            !workOrderQuery.isError &&
            workOrderRows.length === 0 && (
              <TableState text="No recent work orders found." />
            )}
        </div>
      </Card>
    </div>
  );
}
function UsageLog({ assetId }: { assetId: string }) {
  const [search, setSearch] = useState("");
  const [recordedUnit, setRecordedUnit] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);

  const params = useMemo(
    () => ({
      assetId,
      search: debouncedSearch || undefined,
      recordedUnit: recordedUnit || undefined,
      startRecordedAt: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      endRecordedAt: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      pageSize,
      pageToken: pageTokens[page - 1] || undefined
    }),
    [
      assetId,
      debouncedSearch,
      recordedUnit,
      startDate,
      endDate,
      pageSize,
      page,
      pageTokens
    ]
  );
  const query = useAssetUsageLogs(params);
  const rows = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;
  const columns: TableColumn<AssetUsageLog>[] = [
    {
      key: "recordedAt",
      header: "Date",
      render: (row) => formatRecordedAt(row.recordedAt)
    },
    {
      key: "usageValue",
      header: "Usage Value",
      render: (row) =>
        `${row.usageValue}${row.recordedUnit ? ` ${row.recordedUnit}` : ""}`
    },
    { key: "recordedBy", header: "Recorded By" }
  ];

  function resetPagination() {
    setPageTokens([""]);
    setPage(1);
  }

  function canChangePage(targetPage: number) {
    return (
      !query.isFetching &&
      search.trim() === debouncedSearch &&
      (targetPage === 1 ||
        Boolean(pageTokens[targetPage - 1]) ||
        (targetPage === page + 1 && Boolean(query.data?.nextPageToken)))
    );
  }

  function changePage(targetPage: number) {
    if (!canChangePage(targetPage)) return;
    if (targetPage === page + 1) {
      const token = query.data?.nextPageToken;
      if (!token) return;
      setPageTokens((current) => {
        const next = [...current];
        next[page] = token;
        return next;
      });
    }
    setPage(targetPage);
  }

  if (query.isLoading) {
    return (
      <Card title="Usage Log">
        <TableState text="Loading usage logs..." />
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card title="Usage Log">
        <RetryState
          text="Unable to load usage logs."
          onRetry={() => query.refetch()}
        />
      </Card>
    );
  }

  return (
    <Card title="Usage Log">
      <Table
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        name="usage log"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetPagination();
        }}
        searchPlaceholder="Search recorded by, unit, asset name, or code..."
        className="border-0 bg-transparent p-0 shadow-none"
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={recordedUnit}
              onChange={(event) => {
                setRecordedUnit(event.target.value);
                resetPagination();
              }}
              aria-label="Recorded unit"
              placeholder="Recorded unit"
              className="h-10 w-36 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <Input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  resetPagination();
                }}
                aria-label="From date"
                className="h-10 w-40 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              To
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  resetPagination();
                }}
                aria-label="To date"
                className="h-10 w-40 text-sm"
              />
            </label>
          </div>
        }
        emptyState={{
          description: "No usage logs match the current search and filters."
        }}
        pagination={{
          page,
          pageSize,
          totalEntries: total,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          canPageChange: canChangePage,
          onPageChange: changePage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            resetPagination();
          }
        }}
      />
      {query.isFetching && (
        <p className="text-right text-xs text-muted-foreground">Updating...</p>
      )}
    </Card>
  );
}

function formatRecordedAt(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-US", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }).format(date);
}

function TableState({
  text,
  error = false
}: {
  text: string;
  error?: boolean;
}) {
  return (
    <div
      className={`border-t py-10 text-center text-xs ${error ? "text-red-600" : "text-gray-500"}`}
    >
      {text}
    </div>
  );
}

function RetryState({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <p className="text-sm text-red-600">{text}</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Try Again
      </button>
    </div>
  );
}

function WorkOrders({ assetId }: { assetId: string }) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("");
  const [sourceType, setSourceType] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const debouncedSearch = useDebouncedValue(search.trim(), 350);
  const debouncedSourceId = useDebouncedValue(sourceId.trim(), 350);

  const filters = useMemo(
    () => ({
      asset_id: assetId,
      search: debouncedSearch || undefined,
      priority: priority || undefined,
      source_type: sourceType || undefined,
      source_id: debouncedSourceId || undefined,
      start_occurred_at: startDate ? `${startDate}T00:00:00.000Z` : undefined,
      end_occurred_at: endDate ? `${endDate}T23:59:59.999Z` : undefined,
      page_size: pageSize,
      page_token: pageTokens[page - 1] || undefined
    }),
    [
      assetId,
      debouncedSearch,
      priority,
      sourceType,
      debouncedSourceId,
      startDate,
      endDate,
      pageSize,
      page,
      pageTokens
    ]
  );
  const query = useWorkOrders(filters);
  const rows = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;
  const columns: TableColumn<WorkOrder>[] = [
    {
      key: "number",
      header: "WO Number",
      render: (row) => (
        <Link
          href={`/app/asset-management/work-orders/${row.id}`}
          className="font-medium text-primary-700 hover:underline"
        >
          {row.number}
        </Link>
      )
    },
    {
      key: "type",
      header: "Type",
      render: (row) => prettyWorkOrderValue(row.type)
    },
    {
      key: "occurredAt",
      header: "Date",
      render: (row) => formatRecordedAt(row.occurredAt)
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <WorkOrderStatus value={row.status} />
    }
  ];

  function resetPagination() {
    setPageTokens([""]);
    setPage(1);
  }

  function canChangePage(targetPage: number) {
    return (
      !query.isFetching &&
      search.trim() === debouncedSearch &&
      sourceId.trim() === debouncedSourceId &&
      (targetPage === 1 ||
        Boolean(pageTokens[targetPage - 1]) ||
        (targetPage === page + 1 && Boolean(query.data?.nextPageToken)))
    );
  }

  function changePage(targetPage: number) {
    if (!canChangePage(targetPage)) return;
    if (targetPage === page + 1) {
      const token = query.data?.nextPageToken;
      if (!token) return;
      setPageTokens((current) => {
        const next = [...current];
        next[page] = token;
        return next;
      });
    }
    setPage(targetPage);
  }

  if (query.isLoading) {
    return (
      <Card title="Work Orders">
        <TableState text="Loading work orders..." />
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card title="Work Orders">
        <RetryState
          text="Unable to load work orders."
          onRetry={() => query.refetch()}
        />
      </Card>
    );
  }

  return (
    <Card title="Work Orders">
      <Table
        columns={columns}
        data={rows}
        getRowId={(row) => row.id}
        name="work order"
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          resetPagination();
        }}
        searchPlaceholder="Search work orders..."
        className="border-0 bg-transparent p-0 shadow-none"
        filters={[
          {
            key: "priority",
            placeholder: "All Priorities",
            value: priority || "all",
            onChange: (value) => {
              setPriority(value === "all" ? "" : value);
              resetPagination();
            },
            options: [
              { label: "All Priorities", value: "all" },
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
              { label: "Critical", value: "critical" }
            ]
          },
          {
            key: "sourceType",
            placeholder: "All Source Types",
            value: sourceType || "all",
            onChange: (value) => {
              setSourceType(value === "all" ? "" : value);
              resetPagination();
            },
            options: [
              { label: "All Source Types", value: "all" },
              { label: "Preventive", value: "preventive" },
              { label: "Breakdown", value: "breakdown" }
            ]
          }
        ]}
        toolbarActions={
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={sourceId}
              onChange={(event) => {
                setSourceId(event.target.value);
                resetPagination();
              }}
              aria-label="Source ID"
              placeholder="Source ID"
              className="h-10 w-36 text-sm"
            />
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              From
              <Input
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(event) => {
                  setStartDate(event.target.value);
                  resetPagination();
                }}
                aria-label="From date"
                className="h-10 w-40 text-sm"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              To
              <Input
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(event) => {
                  setEndDate(event.target.value);
                  resetPagination();
                }}
                aria-label="To date"
                className="h-10 w-40 text-sm"
              />
            </label>
          </div>
        }
        emptyState={{
          description: "No work orders match the current search and filters."
        }}
        pagination={{
          page,
          pageSize,
          totalEntries: total,
          pageSizeOptions: PAGE_SIZE_OPTIONS,
          canPageChange: canChangePage,
          onPageChange: changePage,
          onPageSizeChange: (size) => {
            setPageSize(size);
            resetPagination();
          }
        }}
      />
      {query.isFetching && (
        <p className="text-right text-xs text-muted-foreground">Updating...</p>
      )}
    </Card>
  );
}
function prettyWorkOrderValue(value: string) {
  return value && value !== "-"
    ? value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "-";
}
function WorkOrderStatus({ value }: { value: string }) {
  const normalized = value.toLowerCase().replaceAll("_", " ");
  const style =
    normalized === "completed"
      ? "bg-emerald-50 text-emerald-600"
      : normalized === "cancelled"
        ? "bg-gray-100 text-gray-600"
        : normalized === "in progress"
          ? "bg-sky-50 text-sky-600"
          : "bg-amber-50 text-amber-600";
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] font-medium ${style}`}>
      {prettyWorkOrderValue(value)}
    </span>
  );
}
