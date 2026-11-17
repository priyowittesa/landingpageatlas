"use client";

import { Eye, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import type { PreventiveMaintenance } from "./types";
import { usePreventiveList } from "./use-preventives";
import { PreventiveBreakdownDialog } from "./report-breakdown-dialog";
import { WorkOrderDialog } from "../work-orders/work-order-dialog";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function PreventiveMaintenanceList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    status: "all",
    frequencyType: "all"
  });
  const { page, pageSize, status, frequencyType } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownItem, setBreakdownItem] =
    useState<PreventiveMaintenance | null>(null);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);
  const [workOrderItem, setWorkOrderItem] =
    useState<PreventiveMaintenance | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Preventive Maintenance" }]);
    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbs]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      frequencyType: frequencyType === "all" ? undefined : frequencyType,
      pageSize,
      pageToken: pageTokens[page - 1] ?? ""
    }),
    [debouncedSearch, frequencyType, page, pageSize, pageTokens, status]
  );
  const { data, isLoading, isFetching, isError, refetch } =
    usePreventiveList(params);
  const rows = data?.items ?? [];

  function changeFilter(key: "status" | "frequencyType", value: string) {
    setPageTokens([""]);
    setMany({ [key]: value, page: 1 });
  }

  const columns: TableColumn<PreventiveMaintenance>[] = [
    {
      key: "preventiveCode",
      header: "Preventive Code",
      render: (row) => (
        <span className="font-semibold text-primary-700">
          {row.preventiveCode}
        </span>
      )
    },
    {
      key: "asset",
      header: "Asset Code - Name",
      render: (row) => (
        <span className="block max-w-72 whitespace-normal font-medium">
          {row.assetCode} - {row.assetName}
        </span>
      )
    },
    { key: "frequencyType", header: "Frequency Type" },
    {
      key: "thresholdValue",
      header: "Threshold",
      render: (row) => formatUsage(row.thresholdValue, row.unit)
    },
    {
      key: "currentUsage",
      header: "Current Usage",
      render: (row) => formatUsage(row.currentUsage, row.unit)
    },
    {
      key: "lastServiceUsage",
      header: "Last Service",
      render: (row) => formatUsage(row.lastServiceUsage, row.unit)
    },
    {
      key: "workOrderStatus",
      header: "WO. Status",
      render: (row) => <StatusBadge value={row.workOrderStatus} />
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`View preventive detail for ${row.assetName}`}
          title="View Preventive Detail"
          onClick={() =>
            router.push(
              `/app/asset-management/preventive-maintenance/${row.id}`
            )
          }
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Preventive Maintenance"
        subtitle="Monitor, forecast, and schedule due maintenance milestones dynamically based on real-time machinery triggers."
      />

      <div className="flex justify-end gap-2">
        <Button
          variant="destructive"
          onClick={() => {
            setBreakdownItem(null);
            setBreakdownOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Breakdown
        </Button>
        <Button
          onClick={() => {
            setWorkOrderItem(null);
            setWorkOrderOpen(true);
          }}
        >
          <Plus className="h-4 w-4" /> Work Order
        </Button>
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading preventive maintenance...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Preventive maintenance data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          name="preventive maintenance"
          onRowClick={(row) =>
            router.push(
              `/app/asset-management/preventive-maintenance/${row.id}`
            )
          }
          searchValue={search}
          onSearchChange={(value) => {
            setSearch(value);
            setPageTokens([""]);
            if (page !== 1) set("page", 1);
          }}
          searchPlaceholder="Search Preventive Code or Asset Code - Name..."
          filters={[
            {
              key: "status",
              placeholder: "All Statuses",
              value: status,
              onChange: (value) => changeFilter("status", value),
              options: [
                { label: "All Statuses", value: "all" },
                { label: "Not Yet", value: "not_yet" },
                { label: "WO. Created", value: "work_order_created" }
              ]
            },
            {
              key: "frequencyType",
              placeholder: "All Types",
              value: frequencyType,
              onChange: (value) => changeFilter("frequencyType", value),
              options: [
                { label: "All Types", value: "all" },
                { label: "Hourly", value: "hourly" },
                { label: "Mileage", value: "mileage" },
                { label: "Monthly", value: "monthly" }
              ]
            }
          ]}
          emptyState={{
            description: "No preventive maintenance records found."
          }}
          pagination={{
            page,
            pageSize,
            totalEntries: data?.totalCount ?? 0,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: (nextPage) => {
              if (nextPage > page) {
                if (nextPage !== page + 1 || !data?.nextPageToken) return;
                setPageTokens((current) => {
                  const next = [...current];
                  next[page] = data.nextPageToken;
                  return next;
                });
              }
              set("page", nextPage);
            },
            onPageSizeChange: (size) => {
              setPageTokens([""]);
              setMany({ pageSize: size, page: 1 });
            }
          }}
        />
      )}

      {isFetching && !isLoading ? (
        <p className="text-right text-xs text-slate-500">Updating...</p>
      ) : null}

      <PreventiveBreakdownDialog
        open={breakdownOpen}
        item={breakdownItem}
        onOpenChange={(open) => {
          setBreakdownOpen(open);
          if (!open) setBreakdownItem(null);
        }}
      />
      <WorkOrderDialog
        open={workOrderOpen}
        preventive={workOrderItem}
        onOpenChange={(open) => {
          setWorkOrderOpen(open);
          if (!open) setWorkOrderItem(null);
        }}
      />
    </div>
  );
}

function formatUsage(value: number, unit: string) {
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value)} ${unit}`;
}

function StatusBadge({ value }: { value: string }) {
  const created = value.toLowerCase().includes("created");
  const label = created
    ? "WO Created"
    : value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
  return (
    <span
      className={`rounded-full px-2 py-1 text-[10px] font-medium ${
        created ? "bg-emerald-50 text-emerald-600" : "bg-sky-50 text-sky-600"
      }`}
    >
      {label}
    </span>
  );
}
