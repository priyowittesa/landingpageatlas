"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import Table from "@/components/Table";
import type { TableColumn } from "@/types/type";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { WorkOrder } from "./use-work-orders";
import { isWorkOrderTerminal, useWorkOrders } from "./use-work-orders";
import { WorkOrderDialog } from "./work-order-dialog";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
const badge: Record<string, string> = {
  high: "bg-orange-50 text-orange-600", critical: "bg-red-50 text-red-600",
  medium: "bg-sky-50 text-sky-600", low: "bg-gray-100 text-gray-600",
  completed: "bg-emerald-50 text-emerald-600", open: "bg-amber-50 text-amber-600",
  "in progress": "bg-red-50 text-red-600", assigned: "bg-sky-50 text-sky-600", cancelled: "bg-gray-100 text-gray-700",
};
const pretty = (value: string) => value && value !== "-" ? value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
const date = (value: string) => { if (!value) return "-"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed); };

export function WorkOrderList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clear = useBreadcrumbStore((state) => state.clear);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [priority, setPriority] = useState("all");
  const [type, setType] = useState("all");
  const [pageTokens, setPageTokens] = useState<string[]>([""]);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<WorkOrder | null>(null);

  useEffect(() => { setBreadcrumbs([{ title: "Work Orders" }]); return clear; }, [setBreadcrumbs, clear]);
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(search.trim()), 350); return () => window.clearTimeout(timeout); }, [search]);

  const filters = useMemo(() => ({
    search: debounced || undefined,
    priority: priority === "all" ? undefined : priority,
    source_type: type === "all" ? undefined : type,
    page_size: pageSize,
    page_token: pageTokens[page - 1] || undefined,
  }), [debounced, priority, type, pageSize, page, pageTokens]);
  const query = useWorkOrders(filters);
  const rows = query.data?.items ?? [];

  function changeSearch(value: string) {
    setSearch(value);
    setPageTokens([""]);
    setPage(1);
  }

  function changeFilter(key: "priority" | "type", value: string) {
    if (key === "priority") setPriority(value);
    else setType(value);
    setPageTokens([""]);
    setPage(1);
  }
  const columns: TableColumn<WorkOrder>[] = [
    { key: "number", header: "WO Number", render: (row) => <Link href={`/app/asset-management/work-orders/${row.id}`} className="font-semibold text-primary-700 hover:underline">{row.number}</Link> },
    { key: "asset", header: "Asset", render: (row) => `${row.assetCode} ${row.assetName}` },
    { key: "type", header: "Type", render: (row) => pretty(row.type) },
    { key: "priority", header: "Priority", render: (row) => <Pill value={row.priority} /> },
    { key: "status", header: "Status", render: (row) => <Pill value={row.status} /> },
    { key: "technician", header: "Technician" },
    { key: "estimatedReturnAt", header: "Target Date", render: (row) => date(row.estimatedReturnAt) },
    { key: "actions", header: "Actions", className: "text-right", render: (row) => <DropdownMenu modal={false}><DropdownMenuTrigger asChild><button type="button" aria-label={`Actions for ${row.number}`} className="rounded p-1 hover:bg-gray-100"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/app/asset-management/work-orders/${row.id}`}>View Work Order</Link></DropdownMenuItem>{!isWorkOrderTerminal(row) && <DropdownMenuItem onSelect={() => { setEditing(row); setDialogOpen(true); }}>Edit Work Order</DropdownMenuItem>}</DropdownMenuContent></DropdownMenu> },
  ];

  return <div className="space-y-5 pb-8">
    <header className="flex items-start justify-between"><div><h1 className="text-2xl font-bold">Work Orders</h1><p className="mt-1 text-sm text-gray-500">Schedule, assign, and review corrective and preventive asset maintenance logs.</p></div><Button onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" />Work Order</Button></header>
    {query.isLoading || query.isPlaceholderData ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading work orders...</div> : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Work orders could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div> : <Table
      columns={columns} data={rows} getRowId={(row) => row.id} name="work order"
      onRowClick={(row) => router.push(`/app/asset-management/work-orders/${row.id}`)}
      searchValue={search} onSearchChange={changeSearch} searchPlaceholder="Search work order or asset..."
      filters={[
        { key: "priority", placeholder: "All Priorities", value: priority, onChange: (value) => changeFilter("priority", value), options: [{ label: "All Priorities", value: "all" }, ...["low", "medium", "high", "critical"].map((value) => ({ label: pretty(value), value }))] },
        { key: "type", placeholder: "All Types", value: type, onChange: (value) => changeFilter("type", value), options: [{ label: "All Types", value: "all" }, { label: "Breakdown", value: "breakdown" }, { label: "Preventive", value: "preventive" }] },
      ]}
      emptyState={{ description: search.trim() || priority !== "all" || type !== "all" ? "Try changing your search or filters." : "No work orders found." }}
      pagination={{ page, pageSize, totalEntries: query.data?.totalCount ?? 0, pageSizeOptions: PAGE_SIZE_OPTIONS,
        canPageChange: (nextPage) => !query.isFetching && (nextPage <= 1 || Boolean(pageTokens[nextPage - 1]) || (nextPage === page + 1 && Boolean(query.data?.nextPageToken))),
        onPageChange: (nextPage) => {
          if (nextPage === page + 1) {
            const nextPageToken = query.data?.nextPageToken;
            if (!nextPageToken) return;
            setPageTokens((current) => {
              const next = current.slice(0, page);
              next[page] = nextPageToken;
              return next;
            });
          } else if (nextPage > 1 && !pageTokens[nextPage - 1]) return;
          setPage(nextPage);
        },
        onPageSizeChange: (size) => {
          setPageSize(size);
          setPageTokens([""]);
          setPage(1);
        },
      }}
    />}
    {query.isFetching && !query.isLoading ? <p className="text-right text-xs text-slate-500">Updating...</p> : null}
    <WorkOrderDialog open={dialogOpen} item={editing} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }} />
  </div>;
}

function Pill({ value }: { value: string }) { const key = value.toLowerCase().replaceAll("_", " "); return <span className={`rounded-full px-2 py-1 text-xs font-medium ${badge[key] ?? "bg-gray-100 text-gray-700"}`}>{pretty(value)}</span>; }
