"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import ConfirmationModal from "@/components/ConfirmationModal";
import LazySelect from "@/components/LazySelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useUrlState } from "@/hooks/useUrlState";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { TableColumn } from "@/types/type";
import { useCostWorkOrders, useCreateWorkOrderCost, useDeleteWorkOrderCost, useWorkOrderCosts, type WorkOrderCost } from "./use-work-order-costs";

const PAGE_SIZES = [10, 25, 50, 100];
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const unique = (values: string[]) => [...new Set(values.filter((value) => value && value !== "-"))];

export function WorkOrderCostList() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const { values, set, setMany } = useUrlState({ page: 1, pageSize: 10, status: "all", category: "all", vendor: "all" });
  const { page, pageSize, status, category, vendor } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tokens, setTokens] = useState<string[]>([""]);
  const [addOpen, setAddOpen] = useState(false);
  const [deleting, setDeleting] = useState<WorkOrderCost | null>(null);
  const deleteCost = useDeleteWorkOrderCost();

  useEffect(() => { setBreadcrumbs([{ title: "Work Order Costs" }]); return clearBreadcrumbs; }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => window.clearTimeout(timeout); }, [search]);

  const filters = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    category: category === "all" ? undefined : category,
    vendor: vendor === "all" ? undefined : vendor,
    page_size: pageSize,
    page_token: tokens[page - 1] || undefined,
  }), [debouncedSearch, status, category, vendor, pageSize, page, tokens]);
  const query = useWorkOrderCosts(filters);
  const rows = query.data?.items ?? [];

  const resetFilter = (key: "status" | "category" | "vendor", value: string) => { setTokens([""]); setMany({ [key]: value, page: 1 }); };
  const statusOptions = unique([...(query.data?.statuses ?? []), ...rows.map((row) => row.status)]);
  const categoryOptions = unique([...(query.data?.categories ?? []), ...rows.map((row) => row.category)]);
  const vendorOptions = unique([...(query.data?.vendors ?? []), ...rows.map((row) => row.vendor)]);

  const columns: TableColumn<WorkOrderCost>[] = [
    { key: "workOrderNumber", header: "Work Order", render: (row) => <Link href={`/app/asset-management/work-order-costs/${row.workOrderId}`} className="font-medium text-primary-700 hover:underline">{row.workOrderNumber}</Link> },
    { key: "asset", header: "Asset" },
    { key: "type", header: "Type", render: (row) => titleCase(row.type) },
    { key: "totalCost", header: "Total Cost", render: (row) => new Intl.NumberFormat("en-US", { style: "currency", currency: row.currency || "USD", maximumFractionDigits: 2 }).format(row.totalCost) },
    { key: "actions", header: "", className: "w-12 text-right", render: (row) => <DropdownMenu modal={false}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={`Actions for ${row.workOrderNumber}`}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem asChild><Link href={`/app/asset-management/work-order-costs/${row.workOrderId}`}>View Detail</Link></DropdownMenuItem><DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={() => setDeleting(row)}>Delete Cost</DropdownMenuItem></DropdownMenuContent></DropdownMenu> },
  ];

  return <div className="space-y-5 pb-8">
    <PageHeader title="Work Order Costs" subtitle="Schedule, assign, and review corrective and preventive Asset maintenance logs." addBtnLabel="Add Cost" handleAdd={() => setAddOpen(true)} />
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading work order costs...</div> : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Work order cost data could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div> : <Table columns={columns} data={rows} getRowId={(row) => row.id} onRowClick={(row) => router.push(`/app/asset-management/work-order-costs/${row.workOrderId}`)} name="work order cost" searchValue={search} onSearchChange={(value) => { setSearch(value); setTokens([""]); if (page !== 1) set("page", 1); }} searchPlaceholder="Search work order, asset, vendor, or description..." filters={[
      { key: "status", placeholder: "All Status", value: status, onChange: (value) => resetFilter("status", value), searchable: true, options: [{ label: "All Status", value: "all" }, ...statusOptions.map((value) => ({ label: titleCase(value), value }))] },
      { key: "category", placeholder: "All Categories", value: category, onChange: (value) => resetFilter("category", value), searchable: true, options: [{ label: "All Categories", value: "all" }, ...categoryOptions.map((value) => ({ label: titleCase(value), value }))] },
      { key: "vendor", placeholder: "All Vendors", value: vendor, onChange: (value) => resetFilter("vendor", value), searchable: true, options: [{ label: "All Vendors", value: "all" }, ...vendorOptions.map((value) => ({ label: value, value }))] },
    ]} emptyState={{ description: search.trim() || status !== "all" || category !== "all" || vendor !== "all" ? "Try changing your search or filters." : "No work order costs have been added yet.", actionLabel: "Add Cost", onAction: () => setAddOpen(true) }} pagination={{ page, pageSize, totalEntries: query.data?.totalCount ?? 0, pageSizeOptions: PAGE_SIZES, onPageChange: (nextPage) => { if (nextPage > page) { const token = query.data?.nextPageToken; if (!token) return; setTokens((current) => { const next = [...current]; next[page] = token; return next; }); } else if (nextPage > 1 && !tokens[nextPage - 1]) return; set("page", nextPage); }, onPageSizeChange: (size) => { setTokens([""]); setMany({ pageSize: size, page: 1 }); } }} />}
    {query.isFetching && !query.isLoading ? <p className="text-right text-xs text-muted-foreground">Updating...</p> : null}
    <AddCostDialog open={addOpen} onOpenChange={setAddOpen} />
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Are you sure you want to delete this cost?" description="This action cannot be undone." confirmLabel="Delete" isLoading={deleteCost.isPending} onConfirm={() => { if (deleting) deleteCost.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
  </div>;
}

function AddCostDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const workOrders = useCostWorkOrders(debounced, open);
  const createCost = useCreateWorkOrderCost();
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(search.trim()), 300); return () => window.clearTimeout(timeout); }, [search]);
  const handleOpenChange = (nextOpen: boolean) => { if (!nextOpen) { setSelected(""); setSearch(""); setDebounced(""); } onOpenChange(nextOpen); };
  const options = (workOrders.data ?? []).map((row) => ({
    value: row.id,
    label: `${row.number} - ${row.assetCode} - ${row.assetName}`,
    disabled: row.isAlreadyExist,
    disabledLabel: row.isAlreadyExist ? "Already Exist" : undefined,
  }));
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="min-w-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Cost</DialogTitle>
        </DialogHeader>

        <LazySelect
          className="min-w-0"
          label="Select Work Order"
          name="work_order_id"
          required
          value={selected}
          onChange={setSelected}
          options={options}
          totalLoaded={options.length}
          isLoading={workOrders.isLoading}
          isFetchingNextPage={false}
          hasMore={false}
          onLoadMore={() => undefined}
          onSearchChange={setSearch}
          search={search}
          placeholder="Select work order"
          searchPlaceholder="Search work order..."
          emptyMessage="No available work order found."
        />

        <DialogFooter className="mt-1 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={createCost.isPending}
          >
            Cancel
          </Button>
          <Button
            disabled={!selected || createCost.isPending}
            onClick={() =>
              createCost.mutate(selected, {
                onSuccess: () => handleOpenChange(false),
              })
            }
          >
            {createCost.isPending ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
