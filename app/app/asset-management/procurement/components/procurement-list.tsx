"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Button } from "@/components/ui/button";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import { type Procurement, useDeleteProcurement, useProcurements } from "../use-procurements";
import { CreatePurchaseRequestDialog } from "./create-purchase-request-dialog";

const PAGE_SIZES = [10, 25, 50, 100];
const STATUS_OPTIONS = ["draft", "pending_approval", "approved", "rejected", "partially_received", "received"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "critical"];
const SOURCE_OPTIONS = ["manual", "work_order"];

function title(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatCost(value: number, currency: string) {
  if (!Number.isFinite(value)) return "-";
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-US")}`;
  }
}

function canDeleteProcurement(procurement: Procurement) {
  return procurement.status.trim().toLowerCase() === "draft";
}

function StatusBadge({ value }: { value: string }) {
  const color = value.toLowerCase();
  const style = color === "approved" || color === "received" ? "bg-emerald-50 text-emerald-700"
    : color === "rejected" ? "bg-red-50 text-red-700"
      : color === "pending_approval" ? "bg-amber-50 text-amber-700"
        : "bg-gray-100 text-gray-700";
  return <span className={`rounded-full px-2 py-1 text-xs ${style}`}>{title(value)}</span>;
}

export function ProcurementList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set, setMany } = useUrlState({ page: 1, pageSize: 10, status: "all", priority: "all", sourceType: "all" });
  const { page, pageSize, status, priority, sourceType } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState<Procurement | null>(null);
  const deleteProcurement = useDeleteProcurement();

  useEffect(() => { setBreadcrumbs([{ title: "Procurement" }]); return clearBreadcrumbs; }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    priority: priority === "all" ? undefined : priority,
    source_type: sourceType === "all" ? undefined : sourceType,
    page_size: pageSize,
    page_token: pageTokens[page - 1] ?? "",
  }), [debouncedSearch, status, priority, sourceType, pageSize, page, pageTokens]);
  const query = useProcurements(filters);
  const rows = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;
  const hasFilters = Boolean(search.trim() || status !== "all" || priority !== "all" || sourceType !== "all");
  const resetPages = () => setPageTokens([""]);
  const columns = useMemo<TableColumn<Procurement>[]>(() => [
    { key: "number", header: "PR Number", render: (row) => <span className="font-semibold text-primary-700">{row.number}</span> },
    { key: "sparePartCount", header: "Total Spare Parts", render: (row) => row.sparePartCount },
    { key: "requester", header: "Requester", render: (row) => row.requester || "-" },
    { key: "source", header: "Source", render: (row) => title(row.source) },
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "priority", header: "Priority", render: (row) => <StatusBadge value={row.priority} /> },
    { key: "totalCost", header: "Total Cost", render: (row) => formatCost(row.totalCost, row.currency) },
    { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
    { key: "actions", header: "", className: "w-12", render: (row) => canDeleteProcurement(row) ? <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${row.number}`} className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDeleting(row)}><Trash2 className="h-4 w-4" /></Button> : null },
  ], []);

  return <div className="space-y-5 pb-8">
    <PageHeader title="Purchase Requests" subtitle="Purchase requests across all asset management projects." addBtnLabel="New Purchase Request" handleAdd={() => setCreateOpen(true)} />
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading purchase requests...</div>
      : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Purchase requests could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div>
        : <Table
          columns={columns} data={rows} getRowId={(row) => row.id} name="purchase request"
          onRowClick={(row) => router.push(`/app/asset-management/procurement/${encodeURIComponent(row.id)}`)}
          searchValue={search} onSearchChange={(value) => { setSearch(value); resetPages(); set("page", 1); }}
          searchPlaceholder="Search PR number or part..."
          filters={[
            { key: "status", placeholder: "All Statuses", value: status, onChange: (value) => { resetPages(); setMany({ status: value, page: 1 }); }, options: [{ label: "All Statuses", value: "all" }, ...STATUS_OPTIONS.map((value) => ({ label: title(value), value }))] },
            { key: "priority", placeholder: "All Priorities", value: priority, onChange: (value) => { resetPages(); setMany({ priority: value, page: 1 }); }, options: [{ label: "All Priorities", value: "all" }, ...PRIORITY_OPTIONS.map((value) => ({ label: title(value), value }))] },
            { key: "sourceType", placeholder: "All Sources", value: sourceType, onChange: (value) => { resetPages(); setMany({ sourceType: value, page: 1 }); }, options: [{ label: "All Sources", value: "all" }, ...SOURCE_OPTIONS.map((value) => ({ label: title(value), value }))] },
          ]}
          onResetFilters={() => { resetPages(); setMany({ status: "all", priority: "all", sourceType: "all", page: 1 }); }}
          emptyState={{ description: hasFilters ? "Try changing your search or filters." : "No purchase requests found." }}
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
    <CreatePurchaseRequestDialog open={createOpen} onOpenChange={setCreateOpen} />
    <ConfirmationModal
      open={Boolean(deleting)}
      onOpenChange={(open) => { if (!open && !deleteProcurement.isPending) setDeleting(null); }}
      title="Delete purchase request?"
      description={`Delete ${deleting?.number ?? "this purchase request"}? This action cannot be undone.`}
      confirmLabel="Delete"
      variant="delete"
      isLoading={deleteProcurement.isPending}
      onConfirm={() => {
        if (!deleting || !canDeleteProcurement(deleting)) return;
        deleteProcurement.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
      }}
    />
  </div>;
}
