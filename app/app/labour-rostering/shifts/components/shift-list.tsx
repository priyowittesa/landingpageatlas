"use client";

import {
  CalendarCheck2,
  CalendarClock,
  Network
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import ConfirmationModal from "@/components/ConfirmationModal";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import SummaryCard from "@/components/SummaryCard";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import type { Shift } from "../types";
import {
  useDeleteShift,
  useShiftDashboardSummary,
  useShiftList
} from "../use-shifts";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
export function ShiftList() {
  const router = useRouter();
  const setBreadcrumbItems = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const deleteShift = useDeleteShift();

  const { values, set, setMany } = useUrlState({
    page: 1,
    pageSize: 10,
    status: "all",
    sortBy: "",
    sortDir: "asc",
  });

  const {
    page,
    pageSize,
    status,
    sortBy,
    sortDir
  } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const appliedSearch = useRef("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [deleting, setDeleting] = useState<Shift | null>(null);
  const [pendingSort, setPendingSort] = useState<
    { by: string; dir: "asc" | "desc" } | null
  >(null);
  const [pendingFilters, setPendingFilters] = useState<
    Partial<{ status: string }>
  >({});

  useEffect(() => {
    setBreadcrumbItems([
      { title: "Labour Rostering" },
      { title: "Shifts" }
    ]);

    return clearBreadcrumbs;
  }, [clearBreadcrumbs, setBreadcrumbItems]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextSearch = search.trim();
      setDebouncedSearch(nextSearch);
      if (appliedSearch.current === nextSearch) return;
      appliedSearch.current = nextSearch;
      setPageTokens([""]);
      set("page", 1);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [search, set]);

  // Page tokens are tied to the previous sort order — reset them when sort changes,
  // and debounce so a rapid burst of header clicks only fires one fetch.
  useEffect(() => {
    if (!pendingSort) return;
    const timeout = window.setTimeout(() => {
      setMany({
        sortBy: pendingSort.by,
        sortDir: pendingSort.dir,
        page: 1,
      });
      setPageTokens([""]);
      setPendingSort(null);
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingSort, setMany]);

  // Debounce filter dropdown changes so a rapid burst of selections only fires one
  // fetch. Reset page tokens because they are tied to the previous filter state.
  useEffect(() => {
    if (Object.keys(pendingFilters).length === 0) return;
    const timeout = window.setTimeout(() => {
      setMany({ ...pendingFilters, page: 1 });
      setPageTokens([""]);
      setPendingFilters({});
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [pendingFilters, setMany]);

  // UI reflects pendingSort immediately so the header icon feels responsive
  // while the URL/fetch is debounced.
  const sortByForUI = (pendingSort?.by ?? sortBy) || null;
  const sortDirForUI: "asc" | "desc" =
    pendingSort?.dir ?? (sortDir === "desc" ? "desc" : "asc");

  const statusForUI = pendingFilters.status ?? status;

  const filters = useMemo(
    () => ({
      pageSize,
      pageToken: pageTokens[page - 1] ?? "",
      status: status === "all" ? undefined : status,
      search: debouncedSearch || undefined,
      ...(sortBy ? { sortBy, sortDir: sortDirForUI } : {}),
    }),
    [
      debouncedSearch,
      page,
      pageSize,
      pageTokens,
      status,
      sortBy,
      sortDirForUI,
    ],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useShiftList(filters);
  const shifts = data?.items ?? [];
  const dashboardSummaryQuery = useShiftDashboardSummary();

  const summaryValue = (...keys: string[]) => {
    if (dashboardSummaryQuery.isLoading) return "…";
    for (const key of keys) {
      if (dashboardSummaryQuery.data?.[key] != null) {
        return dashboardSummaryQuery.data[key];
      }
    }
    return 0;
  };

  useEffect(() => {
    if (!data?.nextPageToken) return;
    setPageTokens((current) => {
      if (current[page] === data.nextPageToken) return current;
      const next = [...current];
      next[page] = data.nextPageToken;
      return next;
    });
  }, [data?.nextPageToken, page]);

  const hasActiveFilters = Boolean(search.trim() || status !== "all");

  const columns: TableColumn<Shift>[] = [
    {
      key: "shift_code",
      header: "Shift Code",
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-primary-700">{row.code || "-"}</span>
      ),
    },
    {
      key: "shift_name",
      header: "Shift Name",
      sortable: true,
      render: (row) => <span className="font-semibold">{row.name}</span>,
    },
    {
      key: "start_time",
      header: "Start Time",
      sortable: true,
      render: (row) => row.start_time || "-",
    },
    {
      key: "end_time",
      header: "End Time",
      sortable: true,
      render: (row) => row.end_time || "-",
    },
    {
      key: "working_hours",
      header: "Working Hours",
      sortable: true,
      render: (row) => formatDuration(row.working_hours),
    },
    {
      key: "break_duration",
      header: "Break Duration",
      sortable: true,
      render: (row) => formatDuration(row.break_duration),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (row) => (
        <MasterDataActions
          name={row.name}
          editHref={`/app/labour-rostering/shifts/${row.id}/edit`}
          onDelete={() => setDeleting(row)}
          disabled={deleteShift.isPending}
        />
      ),
    },
  ];

  return (
    <div className="space-y-5 pb-8">
      <PageHeader
        title="Shift"
        subtitle="Manage all shift data in the system. Add, edit, or deactivate shift records."
        addBtnLabel="Add Shift"
        handleAdd={() => router.push("/app/labour-rostering/shifts/new")}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Shifts"
          value={summaryValue("total_shifts", "total_shift", "total")}
          subtitle="All shift records"
          icon={CalendarClock}
        />
        <SummaryCard
          title="Active Shifts"
          value={summaryValue("active_shifts", "active_shift", "active")}
          subtitle="Currently active"
          icon={CalendarCheck2}
        />
        <SummaryCard
          title="Working Patterns"
          value={summaryValue(
            "working_patterns",
            "working_pattern",
            "total_working_patterns",
            "total_patterns",
            "patterns"
          )}
          subtitle="Different patterns"
          icon={Network}
        />
      </div>

      {isLoading ? (
        <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">
          Loading shifts...
        </div>
      ) : isError ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white">
          <p className="text-sm text-muted-foreground">
            Shift data could not be loaded.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      ) : (
        <Table
          columns={columns}
          data={shifts}
          getRowId={(row) => row.id}
          name="shift"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search shift by code or name..."
          sortKey={sortByForUI}
          sortDir={sortDirForUI}
          onSortChange={(key, dir) => {
            setPendingSort({ by: key ?? "", dir });
          }}
          // filters={[
          //   {
          //     key: "status",
          //     placeholder: "All Status",
          //     value: statusForUI,
          //     onChange: (value) =>
          //       setPendingFilters((prev) => ({ ...prev, status: value })),
          //     options: [
          //       { label: "All Status", value: "all" },
          //       { label: "Active", value: "active" },
          //       { label: "Inactive", value: "inactive" },
          //       { label: "On Leave", value: "on_leave" },
          //     ],
          //   },
          // ]}
          emptyState={
            hasActiveFilters
              ? { description: "Try changing your search or filters." }
              : {
                  description:
                    "You haven't added any shifts yet. Get started by creating your first shift record.",
                  actionLabel: "Add Shift",
                  onAction: () => router.push("/app/labour-rostering/shifts/new"),
                }
          }
          pagination={{
            page,
            pageSize,
            totalEntries: data?.totalCount ?? 0,
            pageSizeOptions: PAGE_SIZE_OPTIONS,
            onPageChange: (next) => {
              setPageTokens((prev) =>
                next < prev.length ? prev.slice(0, next) : prev,
              );
              set("page", next);
            },
            onPageSizeChange: (size) => {
              setPageTokens([""]);
              setMany({ pageSize: size, page: 1 });
            },
          }}
        />
      )}

      {isFetching && !isLoading ? (
        <p className="text-right text-xs text-slate-500">Updating...</p>
      ) : null}

      <ConfirmationModal
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete shift?"
        description={`Are you sure you want to delete ${deleting?.name ?? "this shift"}? This action cannot be undone.`}
        confirmLabel="Delete Shift"
        isLoading={deleteShift.isPending}
        onConfirm={() => {
          if (deleting) {
            deleteShift.mutate(deleting.id, {
              onSuccess: () => setDeleting(null),
            });
          }
        }}
      />
    </div>
  );
}

function formatDuration(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":");
  return `${Number(hours)}h ${String(minutes).padStart(2, "0")}m`;
}
