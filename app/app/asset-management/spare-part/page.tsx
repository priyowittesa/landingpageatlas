"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import Table from "@/components/Table";
import MasterDataActions from "@/components/MasterDataActions";
import ConfirmationModal from "@/components/ConfirmationModal";
import QuickAddDialog from "@/components/quick-add/QuickAddDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { TableColumn } from "@/types/type";
import { useCreateSparePartCategory, useDeleteSparePart, useSaveSparePart, useSparePartCategories, useSpareParts, type SparePart, type SparePartPayload } from "./use-spare-parts";

const emptyForm: SparePartPayload = { name: "", description: "", category_id: "", unit_stock: 0, unit_price: 0 };
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export default function SparePartsPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [tokens, setTokens] = useState<string[]>([""]);
  const [editing, setEditing] = useState<SparePart | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SparePartPayload>(emptyForm);
  const [deleting, setDeleting] = useState<SparePart | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categories = useSparePartCategories();
  const save = useSaveSparePart();
  const remove = useDeleteSparePart();
  const createCategory = useCreateSparePartCategory();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  const resetPage = () => { setPage(1); setTokens([""]); };
  const list = useSpareParts({
    search: debouncedSearch || undefined,
    category_id: categoryId === "all" ? undefined : categoryId,
    page_size: pageSize,
    page_token: tokens[page - 1] || undefined,
  });

  const openForm = (part?: SparePart) => {
    setEditing(part ?? null);
    setForm(part ? { name: part.name, description: part.description ?? "", category_id: part.category_id, unit_stock: part.unit_stock, unit_price: part.unit_price } : emptyForm);
    setFormOpen(true);
  };
  const columns: TableColumn<SparePart>[] = useMemo(() => [
    { key: "name", header: "Spare Part Name", render: (row) => <span className="font-semibold">{row.name}</span> },
    { key: "category", header: "Category Spare Part", render: (row) => row.category_name || (typeof row.category === "string" ? row.category : row.category?.name) || categories.data?.find((item) => item.id === row.category_id)?.name || "-" },
    { key: "unit_stock", header: "In Stock" },
    { key: "unit_price", header: "Unit Price", render: (row) => usdFormatter.format(Number(row.unit_price) || 0) + " / unit" },
    { key: "actions", header: "Action", className: "text-right", render: (row) => <MasterDataActions name={row.name} onEdit={() => openForm(row)} onDelete={() => setDeleting(row)} disabled={remove.isPending} /> },
  ], [categories.data, remove.isPending]);

  return <div className="space-y-5 pb-8">
    <PageHeader title="Spare Part List" subtitle="View and manage all spare parts and their details." addBtnLabel="Add Spare Parts" handleAdd={() => openForm()} />
    {list.isError ? <div className="rounded-lg border bg-white p-8 text-center"><p>Spare part data could not be loaded.</p><Button variant="outline" className="mt-3" onClick={() => list.refetch()}>Try Again</Button></div> : <>
      <Table columns={columns} data={list.data?.items ?? []} getRowId={(row) => row.id} name="spare part" searchValue={search} onSearchChange={(value) => { setSearch(value); resetPage(); }} searchPlaceholder="Search by Product, Category..." filters={[{ key: "category", placeholder: "All Category", value: categoryId, onChange: (value) => { setCategoryId(value); resetPage(); }, options: [{ label: "All Category", value: "all" }, ...(categories.data ?? []).map((item) => ({ label: item.name, value: item.id }))] }]} emptyState={{ description: list.isLoading ? "Loading spare parts..." : "No spare parts found.", actionLabel: list.isLoading ? undefined : "Add Spare Part", onAction: () => openForm() }} />
      <div className="flex flex-wrap items-center justify-end gap-2 text-sm"><span className="mr-auto text-muted-foreground">Page {page}{list.data?.totalCount != null ? ` · ${list.data.totalCount} total` : ""}{list.isFetching ? " · Updating..." : ""}</span><Select value={String(pageSize)} onValueChange={(value) => { setPageSize(Number(value)); resetPage(); }}><SelectTrigger className="w-32"><SelectValue /></SelectTrigger><SelectContent>{[10, 25, 50, 100, 200].map((size) => <SelectItem key={size} value={String(size)}>{size} rows</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={page === 1 || list.isFetching} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /> Previous</Button><Button variant="outline" disabled={!list.data?.nextPageToken || list.isFetching} onClick={() => { setTokens((current) => { const next = [...current]; next[page] = list.data!.nextPageToken; return next; }); setPage(page + 1); }}>Next <ChevronRight className="h-4 w-4" /></Button></div>
    </>}
    <Dialog open={formOpen} onOpenChange={setFormOpen}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editing ? "Edit Spare Part" : "Add Spare Parts"}</DialogTitle></DialogHeader><form className="space-y-4" onSubmit={async (event) => { event.preventDefault(); await save.mutateAsync({ id: editing?.id, payload: { ...form, name: form.name.trim() } }); setFormOpen(false); }}><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-1"><label className="text-sm font-medium" htmlFor="part-name">Spare Part Name</label><Input id="part-name" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Type spare part name" /></div><div className="space-y-1"><label className="text-sm font-medium">Category Spare Part</label><div className="flex gap-2"><Select value={form.category_id} onValueChange={(value) => setForm({ ...form, category_id: value })}><SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{(categories.data ?? []).map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent></Select><Button type="button" variant="outline" size="icon" onClick={() => setCategoryOpen(true)} className="h-10 w-10 shrink-0 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700" aria-label="Add new spare part category"><Plus className="h-4 w-4" /></Button></div></div><div className="space-y-1"><label className="text-sm font-medium" htmlFor="stock">Stock</label><Input id="stock" type="number" min="0" required value={form.unit_stock} onChange={(event) => setForm({ ...form, unit_stock: Number(event.target.value) })} /></div><div className="space-y-1"><label className="text-sm font-medium" htmlFor="price">Unit Price</label><CurrencyInput id="price" value={form.unit_price} onChange={(unitPrice) => setForm({ ...form, unit_price: unitPrice })} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button><Button type="submit" disabled={save.isPending || !form.name.trim() || !form.category_id}>{save.isPending ? "Saving..." : editing ? "Save" : "Add"}</Button></DialogFooter></form></DialogContent></Dialog>
    <QuickAddDialog open={categoryOpen} onOpenChange={setCategoryOpen} title="Create Spare Part Category" description="Add a new category for spare parts." submitLabel="Create" fields={[{ name: "name", label: "Name", required: true, colSpan: 2 }, { name: "description", label: "Description", type: "textarea", colSpan: 2 }]} isLoading={createCategory.isPending} onSubmit={async (values) => { const result = await createCategory.mutateAsync({ name: String(values.name).trim(), description: String(values.description ?? "").trim() }); const category = (result?.data ?? result) as { id?: string }; if (category.id) setForm((current) => ({ ...current, category_id: category.id! })); setCategoryOpen(false); }} />
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete spare part?" description={`Are you sure you want to delete ${deleting?.name ?? "this spare part"}? This action cannot be undone.`} confirmLabel="Delete Spare Part" isLoading={remove.isPending} onConfirm={() => { if (deleting) remove.mutate(deleting.id, { onSuccess: () => { setDeleting(null); resetPage(); } }); }} />
  </div>;
}

function CurrencyInput({ id, value, onChange }: { id: string; value: number; onChange: (value: number) => void }) {
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState(value ? String(value) : "");

  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      required
      value={focused ? draft : usdFormatter.format(value || 0)}
      onFocus={(event) => {
        const input = event.currentTarget;
        setDraft(value ? String(value) : "");
        setFocused(true);
        window.requestAnimationFrame(() => input.select());
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (!/^\d*(\.\d{0,2})?$/.test(next)) return;
        setDraft(next);
        onChange(next === "" ? 0 : Number(next));
      }}
      onBlur={() => setFocused(false)}
      aria-label="Unit Price in USD"
    />
  );
}



