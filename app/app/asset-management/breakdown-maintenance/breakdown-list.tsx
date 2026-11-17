"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, MoreHorizontal, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import type { Breakdown } from "./use-breakdowns";
import { useBreakdowns } from "./use-breakdowns";
import { ApprovalDialog, CreateBreakdownWorkOrderDialog, EditBreakdownDialog } from "./breakdown-dialogs";

const severityStyle: Record<string, string> = { low: "bg-gray-100 text-gray-700", medium: "bg-sky-50 text-sky-600", high: "bg-amber-50 text-amber-600", critical: "bg-red-50 text-red-600" };
const statusStyle: Record<string, string> = { pending: "bg-amber-50 text-amber-600", requested: "bg-amber-50 text-amber-600", rejected: "bg-red-50 text-red-600", declined: "bg-red-50 text-red-600", active: "bg-emerald-50 text-emerald-600", approved: "bg-emerald-50 text-emerald-600" };
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function prettyDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date);
}
function Badge({ value, styles }: { value: string; styles: Record<string, string> }) {
  const key = value.toLowerCase();
  return <span className={`rounded-full px-2 py-1 text-[10px] capitalize ${styles[key] ?? "bg-gray-100 text-gray-600"}`}>{value}</span>;
}

export function BreakdownList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set, setMany } = useUrlState({ page: 1, pageSize: 10, severity: "all", status: "all" });
  const { page, pageSize, severity, status } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [edit, setEdit] = useState<Breakdown | null>(null);
  const [approvalItems, setApprovalItems] = useState<Breakdown[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [workOrderOpen, setWorkOrderOpen] = useState(false);

  useEffect(() => { setBreadcrumbs([{ title: "Breakdown Maintenance" }]); return clearBreadcrumbs; }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    severity: severity === "all" ? undefined : severity,
    approval_status: status === "all" ? undefined : status,
    page_size: pageSize,
    page_token: pageTokens[page - 1] ?? "",
  }), [debouncedSearch, severity, status, pageSize, page, pageTokens]);
  const query = useBreakdowns(filters);
  const rows = query.data?.items ?? [];
  const total = query.data?.totalCount ?? 0;
  const pendingRows = rows.filter((row) => row.status.toLowerCase() === "pending");
  const visibleIds = pendingRows.map((row) => row.id);
  const selectedVisible = selected.filter((id) => visibleIds.includes(id));
  const hasActiveFilters = Boolean(search.trim() || severity !== "all" || status !== "all");
  const resetPage = () => { setPageTokens([""]); setSelected([]); set("page", 1); };

  const columns: TableColumn<Breakdown>[] = [
    { key: "select", header: <Checkbox aria-label="Select all pending breakdowns on this page" checked={pendingRows.length > 0 && selectedVisible.length === pendingRows.length} disabled={pendingRows.length === 0} onCheckedChange={(checked) => setSelected(checked ? visibleIds : [])} />, render: (row) => <Checkbox aria-label={`Select breakdown ${row.code}`} checked={selectedVisible.includes(row.id)} disabled={row.status.toLowerCase() !== "pending"} onCheckedChange={(checked) => setSelected((current) => checked ? [...current.filter((id) => id !== row.id), row.id] : current.filter((id) => id !== row.id))} /> },
    { key: "code", header: "Breakdown Code", render: (row) => <Link href={`/app/asset-management/breakdown-maintenance/${row.id}`} className="font-semibold text-primary-700 hover:underline">{row.code}</Link> },
    { key: "asset", header: "Asset Code - Name", render: (row) => `${row.assetCode} - ${row.assetName}` },
    { key: "description", header: "Problem Description", render: (row) => <span className="block max-w-64 truncate" title={row.description}>{row.description || "-"}</span> },
    { key: "occurredAt", header: "Occurred At", render: (row) => prettyDate(row.occurredAt) },
    { key: "severity", header: "Severity", render: (row) => <Badge value={row.severity} styles={severityStyle} /> },
    { key: "status", header: "Status", render: (row) => <Badge value={row.status} styles={statusStyle} /> },
    { key: "reportedBy", header: "Reported By" },
    { key: "actions", header: "Actions", className: "text-right", render: (row) => <div className="flex items-center justify-end gap-2">{row.status.toLowerCase() === "pending" && <Button size="sm" onClick={() => setApprovalItems([row])}>Approval</Button>}<DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button size="icon" variant="ghost" aria-label={`Actions for ${row.code}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/app/asset-management/breakdown-maintenance/${row.id}`}>View Breakdown Detail</Link></DropdownMenuItem>{row.status.toLowerCase() !== "approved" && <DropdownMenuItem onSelect={() => setEdit(row)}>Edit Breakdown</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu></div> },
  ];

  return <div className="space-y-5 pb-8">
    <PageHeader title="Breakdown Maintenance" subtitle="Review asset alerts, authorize repair work orders, and process diagnostic submissions." addBtnLabel="Report Breakdown" handleAdd={() => router.push("/app/asset-management/asset-list")} />
    <div className="flex justify-end gap-2"><Button variant="outline" disabled={selectedVisible.length === 0} onClick={() => setApprovalItems(pendingRows.filter((row) => selectedVisible.includes(row.id)))}><CheckCircle2 className="h-4 w-4" />Approval{selectedVisible.length > 0 ? ` (${selectedVisible.length})` : ""}</Button><Button disabled={rows.length === 0} onClick={() => setWorkOrderOpen(true)}><Plus className="h-4 w-4" />Work Order</Button></div>
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading breakdowns...</div> : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Breakdown data could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div> : <Table
      columns={columns} data={rows} getRowId={(row) => row.id} name="breakdown"
      onRowClick={(row) => router.push(`/app/asset-management/breakdown-maintenance/${row.id}`)}
      searchValue={search} onSearchChange={(value) => { setSearch(value); resetPage(); }} searchPlaceholder="Search asset code or name..."
      onResetFilters={() => { setPageTokens([""]); setSelected([]); setMany({ severity: "all", status: "all", page: 1 }); }}
      filters={[
        { key: "severity", placeholder: "All Severities", value: severity, onChange: (value) => { setPageTokens([""]); setSelected([]); setMany({ severity: value, page: 1 }); }, options: [{ label: "All Severities", value: "all" }, ...["low", "medium", "high", "critical"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }))] },
        { key: "status", placeholder: "All Statuses", value: status, onChange: (value) => { setPageTokens([""]); setSelected([]); setMany({ status: value, page: 1 }); }, options: [{ label: "All Statuses", value: "all" }, ...["pending", "approved", "declined"].map((value) => ({ label: value[0].toUpperCase() + value.slice(1), value }))] },
      ]}
      emptyState={{ description: hasActiveFilters ? "Try changing your search or filters." : "No breakdowns found. Report a breakdown from the asset list.", actionLabel: hasActiveFilters ? undefined : "Report Breakdown", onAction: () => router.push("/app/asset-management/asset-list") }}
      pagination={{ page, pageSize, totalEntries: total, pageSizeOptions: PAGE_SIZE_OPTIONS, canPageChange: (next) => next <= 1 || Boolean(pageTokens[next - 1]) || (next === page + 1 && Boolean(query.data?.nextPageToken)), onPageChange: (next) => { if (next === page + 1 && query.data?.nextPageToken) setPageTokens((current) => { const copy = [...current]; copy[page] = query.data!.nextPageToken; return copy; }); else if (next > 1 && !pageTokens[next - 1]) return; setSelected([]); set("page", next); }, onPageSizeChange: (size) => { setPageTokens([""]); setSelected([]); setMany({ pageSize: size, page: 1 }); } }}
    />}
    {query.isFetching && !query.isLoading && <p className="text-right text-xs text-slate-500">Updating...</p>}
    <EditBreakdownDialog item={edit} open={Boolean(edit)} onOpenChange={(open) => !open && setEdit(null)} />
    <ApprovalDialog item={approvalItems[0] ?? null} items={approvalItems} open={approvalItems.length > 0} onOpenChange={(open) => !open && setApprovalItems([])} onCompleted={(ids) => setSelected((current) => current.filter((id) => !ids.includes(id)))} />
    <CreateBreakdownWorkOrderDialog open={workOrderOpen} onOpenChange={setWorkOrderOpen} items={rows} initialId={selectedVisible.length === 1 ? selectedVisible[0] : undefined} />
  </div>;
}
