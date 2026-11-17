"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CircleAlert, MoreHorizontal } from "lucide-react";
import Table from "@/components/Table";
import type { TableColumn } from "@/types/type";
import { type Asset, type AssetStatus } from "./data";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { useUrlState } from "@/hooks/useUrlState";
import { useProjects } from "@/app/app/master-data/equipment/use-equipment";
import { useAssetList } from "./use-assets";
import { ReportBreakdownDialog } from "./report-breakdown-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const statusStyle: Record<AssetStatus, string> = {
  Active: "bg-emerald-50 text-emerald-600",
  Preventive: "bg-amber-50 text-amber-600",
  Breakdown: "bg-red-50 text-red-600"
};
type FilterKey = "status" | "type" | "project";

export function AssetList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((s) => s.setItems);
  const clear = useBreadcrumbStore((s) => s.clear);
  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    status: "all",
    type: "all",
    project: "all"
  });
  const { page, pageSize, status, type, project } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [pendingFilters, setPendingFilters] = useState<
    Partial<Record<FilterKey, string>>
  >({});
  const [breakdownAsset, setBreakdownAsset] = useState<Asset | null>(null);
  const projects = useProjects();

  useEffect(() => {
    setBreadcrumbs([{ title: "Asset List" }]);
    return clear;
  }, [setBreadcrumbs, clear]);
  useEffect(() => {
    const timeout = window.setTimeout(
      () => setDebouncedSearch(search.trim()),
      350
    );
    return () => window.clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    if (Object.keys(pendingFilters).length === 0) return;
    const timeout = window.setTimeout(() => {
      setMany({ ...pendingFilters, page: 1 });
      setPageTokens([""]);
      setPendingFilters({});
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingFilters, setMany]);

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status === "all" ? undefined : status,
      frequency_type: type === "all" ? undefined : type,
      project_id: project === "all" ? undefined : project,
      page_size: pageSize,
      page_token: pageTokens[page - 1] ?? ""
    }),
    [debouncedSearch, status, type, project, pageSize, page, pageTokens]
  );
  const { data, isLoading, isFetching, isError, refetch } =
    useAssetList(params);
  const rows = data?.items ?? [];
  const projectNames = useMemo(
    () =>
      new Map((projects.data ?? []).map((item) => [item.value, item.label])),
    [projects.data]
  );

  function changeSearch(value: string) {
    setSearch(value);
    setPageTokens([""]);
    if (page !== 1) set("page", 1);
  }
  const hasFilters = Boolean(
    search.trim() || status !== "all" || type !== "all" || project !== "all"
  );
  const columns: TableColumn<Asset>[] = [
    {
      key: "code",
      header: "Asset Code",
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.code}</span>
      )
    },
    { key: "name", header: "Asset Name" },
    { key: "model", header: "Model Type" },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <span
          className={`rounded-full px-2 py-1 text-xs font-medium ${statusStyle[row.status]}`}
        >
          {row.status}
        </span>
      )
    },
    {
      key: "project",
      header: "Project",
      render: (row) =>
        projectNames.get(row.project) ??
        (projects.data?.some((item) => item.label === row.project)
          ? row.project
          : "-")
    },
    { key: "frequency", header: "Frequency Type" },
    { key: "threshold", header: "Threshold" },
    {
      key: "serviceInterval",
      header: "Service Interval",
      render: (row) =>
        `${row.serviceInterval.toLocaleString("en-US")}${row.usageUnit ? ` ${row.usageUnit}` : ""}`
    },
    { key: "usage", header: "Current Usage" },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Actions for ${row.name}`}
              className="rounded p-1 hover:bg-gray-200"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/app/asset-management/asset-list/${row.id}`}>
                View Asset Detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setBreakdownAsset(row)}>
              Report Breakdown
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }
  ];

  return (
    <div className="space-y-5 pb-8">
      <div>
        <h1 className="text-2xl font-bold">Asset List</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage and track heavy machinery operating hours, thresholds, and live
          status.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-sky-50 px-4 py-3 text-xs text-sky-600">
        <CircleAlert className="h-4 w-4 shrink-0" />
        <span>
          To add, edit, or remove Asset, go to Master Data &gt; Asset List.
          Changes made there will automatically reflect across all projects.
        </span>
        <Link
          href="/app/master-data/equipment"
          className="ml-auto shrink-0 rounded-md bg-sky-600 px-4 py-1.5 font-semibold text-white hover:bg-sky-700"
        >
          Go to Master Data
        </Link>
      </div>
      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading assets...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Asset data could not be loaded.
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
          name="asset"
          onRowClick={(row) =>
            router.push(`/app/asset-management/asset-list/${row.id}`)
          }
          searchValue={search}
          onSearchChange={changeSearch}
          searchPlaceholder="Search asset code or name..."
          toolbarLayout="horizontal"
          filters={[
            {
              key: "status",
              placeholder: "All Statuses",
              value: pendingFilters.status ?? status,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, status: value })),
              options: [
                { label: "All Statuses", value: "all" },
                ...["Active", "Preventive", "Breakdown"].map((value) => ({
                  label: value,
                  value
                }))
              ]
            },
            {
              key: "type",
              placeholder: "All Types",
              value: pendingFilters.type ?? type,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, type: value })),
              options: [
                { label: "All Types", value: "all" },
                ...["Hourly", "Mileage", "Monthly"].map((value) => ({
                  label: value,
                  value
                }))
              ]
            },
            {
              key: "project",
              placeholder: "All Projects",
              value: pendingFilters.project ?? project,
              onChange: (value) =>
                setPendingFilters((prev) => ({ ...prev, project: value })),
              options: [
                { label: "All Projects", value: "all" },
                ...(projects.data ?? []).map((item) => ({
                  label: item.label,
                  value: item.value
                }))
              ]
            }
          ]}
          emptyState={{
            description: hasFilters
              ? "Try changing your search or filters."
              : "No assets found."
          }}
          pagination={{
            page,
            pageSize,
            totalEntries: data?.totalCount ?? 0,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            canPageChange: (next) =>
              next <= 1 ||
              Boolean(pageTokens[next - 1]) ||
              (next === page + 1 && Boolean(data?.nextPageToken)),
            onPageChange: (next) => {
              if (next === page + 1 && data?.nextPageToken) {
                setPageTokens((current) => {
                  const updated = current.slice(0, page);
                  updated[page] = data.nextPageToken;
                  return updated;
                });
              } else if (next > 1 && !pageTokens[next - 1]) return;
              set("page", next);
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
      <ReportBreakdownDialog
        asset={breakdownAsset}
        open={Boolean(breakdownAsset)}
        onOpenChange={(open) => !open && setBreakdownAsset(null)}
      />
    </div>
  );
}
