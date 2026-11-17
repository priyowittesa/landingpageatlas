"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import { type ApprovalInboxItem, useApprovalInbox } from "./use-approval-inbox";

const PAGE_SIZES = [10, 25, 50, 100];

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function formatMoney(value: number, currency: string) {
  try { return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value); }
  catch { return `${currency} ${value.toLocaleString("en-US")}`; }
}

function StatusBadge({ value }: { value: string }) {
  const status = value.toLowerCase();
  const style = status.includes("reject") ? "bg-red-50 text-red-700" : status.includes("approv") && !status.includes("pending") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";
  return <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${style}`}>{title(value)}</span>;
}

function PriorityBadge({ value }: { value: string }) {
  const priority = value.toLowerCase();
  const style = priority === "high" || priority === "critical" ? "bg-red-50 text-red-600" : priority === "medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600";
  return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${style}`}>{title(value)}</span>;
}

export function ApprovalsInbox() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pageTokens, setPageTokens] = useState<string[]>([""]);

  useEffect(() => {
    setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "Approvals Inbox" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const query = useApprovalInbox({ search: debouncedSearch || undefined, pageSize, pageToken: pageTokens[page - 1] ?? "" });
  const allRows = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const rows = useMemo(() => status === "all" ? allRows : allRows.filter((item) => item.status.toLowerCase() === status), [allRows, status]);
  const resetPages = () => { setPageTokens([""]); setPage(1); };
  const columns = useMemo<TableColumn<ApprovalInboxItem>[]>(() => [
    { key: "number", header: "PR Number", render: (row) => <span className="font-semibold">{row.number}</span> },
    { key: "createdAt", header: "Date Created", render: (row) => formatDate(row.createdAt) },
    { key: "requester", header: "Requester" },
    { key: "workOrder", header: "Work Order", render: (row) => <span className="text-primary">{row.workOrder}</span> },
    { key: "priority", header: "Priority", render: (row) => <PriorityBadge value={row.priority} /> },
    { key: "estimatedTotal", header: "Est. Total", render: (row) => <span className="font-medium">{formatMoney(row.estimatedTotal, row.currency)}</span> },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
  ], []);

  return <div className="space-y-5 pb-8">
    <PageHeader title="Approvals Inbox" subtitle="Manage incoming purchase requests requiring your sign-off." />
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading approvals...</div>
      : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Approval inbox could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div>
        : <Table
          columns={columns}
          data={rows}
          getRowId={(row) => row.id}
          name="approval"
          onRowClick={(row) => router.push(`/app/asset-management/procurement/approvals-inbox/${encodeURIComponent(row.id)}`)}
          searchValue={search}
          onSearchChange={(value) => { setSearch(value); resetPages(); }}
          searchPlaceholder="Search by PR number, part..."
          filters={[{ key: "status", placeholder: "All Statuses", value: status, onChange: (value) => { setStatus(value); setPage(1); }, options: [{ label: "All Statuses", value: "all" }, { label: "Pending Approval", value: "pending_approval" }, { label: "Approved", value: "approved" }, { label: "Rejected", value: "rejected" }] }]}
          onResetFilters={() => { setStatus("all"); setPage(1); }}
          emptyState={{ description: search || status !== "all" ? "Try changing your search or filter." : "No purchase requests currently require your approval." }}
          pagination={{
            page,
            pageSize,
            totalEntries: status === "all" ? (query.data?.totalCount ?? 0) : rows.length,
            pageSizeOptions: PAGE_SIZES,
            canPageChange: (next) => next <= 1 || Boolean(pageTokens[next - 1]) || (next === page + 1 && Boolean(query.data?.nextPageToken)),
            onPageChange: (next) => {
              if (next === page + 1 && query.data?.nextPageToken) setPageTokens((current) => { const updated = [...current]; updated[page] = query.data!.nextPageToken; return updated; });
              else if (next > 1 && !pageTokens[next - 1]) return;
              setPage(next);
            },
            onPageSizeChange: (size) => { setPageSize(size); resetPages(); },
          }}
        />}
    {query.isFetching && !query.isLoading && <p className="text-right text-xs text-muted-foreground">Updating...</p>}
  </div>;
}
