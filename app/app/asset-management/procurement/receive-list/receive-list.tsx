"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import type { ReceiveListItem } from "./data";
import { useReceiveList } from "./use-receive-list";

const PAGE_SIZES = [10, 25, 50];

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function StatusBadge({ status }: { status: ReceiveListItem["status"] }) {
  const styles = status === "received" ? "bg-emerald-50 text-emerald-700" : status === "partial" ? "bg-amber-50 text-amber-700" : "bg-sky-50 text-sky-700";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium uppercase ${styles}`}>{status}</span>;
}

export function ReceiveList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set, setMany } = useUrlState({ page: 1, pageSize: 10, status: "all" });
  const { page, pageSize, status } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);

  useEffect(() => {
    setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "Receive List" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    page_size: pageSize,
    page_token: pageTokens[page - 1] || undefined,
  }), [debouncedSearch, status, pageSize, page, pageTokens]);
  const query = useReceiveList(filters);
  const rows = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;

  const columns = useMemo<TableColumn<ReceiveListItem>[]>(() => [
    { key: "reference", header: "Receiving ID", render: (row) => <span className="font-semibold">{row.reference}</span> },
    { key: "dateReceived", header: "Date Received", render: (row) => formatDate(row.dateReceived) },
    { key: "receiver", header: "Receiver" },
    { key: "supplier", header: "Supplier", render: (row) => <span className="text-muted-foreground">{row.supplier}</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={row.status} /> },
    { key: "totalReceived", header: "Total Received" },
    { key: "action", header: "Action", className: "w-20", render: (row) => <Button type="button" variant="ghost" size="icon" aria-label={`Open ${row.reference}`}><span className="sr-only">Open</span>{row.status === "received" ? <Eye className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</Button> },
  ], []);

  const resetPages = () => setPageTokens([""]);
  return <div className="space-y-5 pb-8">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <PageHeader title="Receive List" subtitle="View and manage the list of items scheduled to be received." />
      <Button variant="outline" onClick={() => router.push("/app/asset-management/procurement/receive-list/approval-setting")}><Settings2 className="h-4 w-4" />Approval Setting</Button>
    </div>
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading receiving records...</div>
      : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Receiving records could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div>
        : <Table
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          name="receive list item"
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); resetPages(); set("page", 1); }}
          searchPlaceholder="Search by receiving ID, receiver, or supplier..."
          filters={[{ key: "status", placeholder: "All Statuses", value: status, onChange: (value) => { resetPages(); setMany({ status: value, page: 1 }); }, options: [{ label: "All Statuses", value: "all" }, { label: "New", value: "new" }, { label: "Partial", value: "partial" }, { label: "Received", value: "received" }] }]}
          onResetFilters={() => { resetPages(); setMany({ status: "all", page: 1 }); }}
          emptyState={{ description: search.trim() || status !== "all" ? "No receiving records match the current filters." : "No receiving records found." }}
          pagination={{
            page, pageSize, totalEntries: total, pageSizeOptions: PAGE_SIZES,
            canPageChange: (next) => next <= 1 || Boolean(pageTokens[next - 1]) || (next === page + 1 && Boolean(query.data?.nextPageToken)),
            onPageChange: (next) => {
              if (next === page + 1 && query.data?.nextPageToken) setPageTokens((current) => { const updated = [...current]; updated[page] = query.data!.nextPageToken; return updated; });
              else if (next > 1 && !pageTokens[next - 1]) return;
              set("page", next);
            },
            onPageSizeChange: (size) => { resetPages(); setMany({ pageSize: size, page: 1 }); },
          }}
        />}
    {query.isFetching && !query.isLoading && <p className="text-right text-xs text-muted-foreground">Updating...</p>}
  </div>;
}
