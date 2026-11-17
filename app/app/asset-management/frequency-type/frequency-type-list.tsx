"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import ConfirmationModal from "@/components/ConfirmationModal";
import FormFieldLayout from "@/components/FormFieldLayout";
import FormSelectField from "@/components/FormSelectField";
import FormTextField from "@/components/FormTextField";
import MasterDataActions from "@/components/MasterDataActions";
import PageHeader from "@/components/PageHeader";
import QuickAddDialog, { type QuickAddValues } from "@/components/quick-add/QuickAddDialog";
import Table from "@/components/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useUrlState } from "@/hooks/useUrlState";
import type { TableColumn } from "@/types/type";
import { EMPTY_FREQUENCY_TYPE, frequencyTypeSchema, type FrequencyType, type FrequencyTypeOption, type FrequencyTypePayload } from "./types";
import { useCreateFrequencyType, useCreateFrequencyTypeCategory, useCreateFrequencyTypeUnit, useDeleteFrequencyType, useFrequencyTypeCategories, useFrequencyTypeList, useFrequencyTypeUnits, useUpdateFrequencyType } from "./use-frequency-types";

const PAGE_SIZES = [10, 25, 50, 100];
const formatDate = (value: string) => value ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(value)) : "-";

export function FrequencyTypeList() {
  const router = useRouter();
  const { values, set, setMany } = useUrlState({ page: 1, pageSize: 10, status: "all", category: "all", unit: "all", sortBy: "", sortDir: "asc" });
  const { page, pageSize, status, category, unit, sortBy, sortDir } = values;
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tokens, setTokens] = useState<string[]>([""]);
  const [editing, setEditing] = useState<FrequencyType | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<FrequencyType | null>(null);
  const categories = useFrequencyTypeCategories();
  const units = useFrequencyTypeUnits();
  const deleteFrequencyType = useDeleteFrequencyType();

  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350); return () => window.clearTimeout(timeout); }, [search]);

  const filters = useMemo(() => ({
    pageSize,
    pageToken: tokens[page - 1] || undefined,
    search: debouncedSearch || undefined,
    status: status === "all" ? undefined : status,
    categoryId: category === "all" ? undefined : category,
    unitId: unit === "all" ? undefined : unit,
    sortBy: sortBy || undefined,
    sortDir: sortDir === "desc" ? "desc" as const : "asc" as const,
  }), [pageSize, page, tokens, debouncedSearch, status, category, unit, sortBy, sortDir]);
  const query = useFrequencyTypeList(filters);

  useEffect(() => {
    if (!query.data?.nextPageToken) return;
    setTokens((current) => { if (current[page] === query.data?.nextPageToken) return current; const next = [...current]; next[page] = query.data?.nextPageToken ?? ""; return next; });
  }, [page, query.data?.nextPageToken]);

  const resetFilter = (key: "status" | "category" | "unit", value: string) => { setTokens([""]); setMany({ [key]: value, page: 1 }); };
  const columns: TableColumn<FrequencyType>[] = [
    { key: "code", header: "Code", sortable: true, render: (row) => <span className="font-semibold text-primary-700">{row.code || "-"}</span> },
    { key: "name", header: "Frequency Name", sortable: true, render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "category", header: "Category", render: (row) => row.category_name },
    { key: "unit", header: "Unit", render: (row) => row.unit_name },
    { key: "description", header: "Description", render: (row) => <span className="block max-w-72 truncate text-muted-foreground" title={row.description}>{row.description || "-"}</span> },
    { key: "status", header: "Status", render: (row) => <Badge variant="secondary" className={row.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}>{row.status === "active" ? "Active" : "Inactive"}</Badge> },
    { key: "updated_at", header: "Last Updated", sortable: true, render: (row) => formatDate(row.updated_at) },
    { key: "actions", header: "Actions", className: "text-right", render: (row) => <div onClick={(event) => event.stopPropagation()}><MasterDataActions name={row.name} onEdit={() => setEditing(row)} onDelete={() => setDeleting(row)} disabled={deleteFrequencyType.isPending} /></div> },
  ];

  return <div className="space-y-5 pb-8">
    <PageHeader title="Frequency Type" subtitle="List of preventive and corrective maintenance frequency configurations for assets." addBtnLabel="Add Frequency Type" handleAdd={() => setEditing(null)} />
    {query.isLoading ? <div className="flex min-h-80 items-center justify-center text-sm text-muted-foreground">Loading frequency types...</div> : query.isError ? <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-lg border bg-white"><p className="text-sm text-muted-foreground">Frequency type data could not be loaded.</p><Button variant="outline" onClick={() => query.refetch()}>Try Again</Button></div> : <Table
      columns={columns} data={query.data?.items ?? []} getRowId={(row) => row.id} name="frequency type" onRowClick={(row) => router.push(`/app/asset-management/frequency-type/${row.id}`)}
      searchValue={search} onSearchChange={(value) => { setSearch(value); setTokens([""]); if (page !== 1) set("page", 1); }} searchPlaceholder="Search Frequency Types"
      sortKey={sortBy || null} sortDir={sortDir === "desc" ? "desc" : "asc"} onSortChange={(key, direction) => { setTokens([""]); setMany({ sortBy: key ?? "", sortDir: direction, page: 1 }); }}
      filters={[
        { key: "status", placeholder: "All Status", value: status, onChange: (value) => resetFilter("status", value), options: [{ label: "All Status", value: "all" }, { label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
        { key: "category", placeholder: "All Categories", value: category, onChange: (value) => resetFilter("category", value), options: [{ label: "All Categories", value: "all" }, ...(categories.data ?? []).map((item) => ({ label: item.name, value: item.id }))] },
        { key: "unit", placeholder: "All Units", value: unit, onChange: (value) => resetFilter("unit", value), options: [{ label: "All Units", value: "all" }, ...(units.data ?? []).map((item) => ({ label: item.name, value: item.id }))] },
      ]}
      emptyState={{ description: search || status !== "all" || category !== "all" || unit !== "all" ? "Try changing your search or filters." : "Create your first frequency type to start building maintenance schedules and rules.", actionLabel: "Add First Frequency Type", onAction: () => setEditing(null) }}
      pagination={{ page, pageSize, totalEntries: query.data?.totalCount ?? 0, pageSizeOptions: PAGE_SIZES, onPageChange: (next) => { if (next > page && !query.data?.nextPageToken) return; set("page", next); }, onPageSizeChange: (size) => { setTokens([""]); setMany({ pageSize: size, page: 1 }); } }}
    />}
    {query.isFetching && !query.isLoading ? <p className="text-right text-xs text-muted-foreground">Updating...</p> : null}
    <FrequencyTypeDialog open={editing !== undefined} item={editing ?? null} onOpenChange={(open) => !open && setEditing(undefined)} categories={categories.data ?? []} units={units.data ?? []} />
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => !open && setDeleting(null)} title="Delete frequency type?" description={`Are you sure you want to delete ${deleting?.name ?? "this frequency type"}?`} confirmLabel="Delete Frequency Type" isLoading={deleteFrequencyType.isPending} onConfirm={() => { if (!deleting) return; deleteFrequencyType.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }} />
  </div>;
}

export function FrequencyTypeDialog({ open, item, onOpenChange, categories, units }: { open: boolean; item: FrequencyType | null; onOpenChange: (open: boolean) => void; categories: FrequencyTypeOption[]; units: FrequencyTypeOption[] }) {
  const [quickAdd, setQuickAdd] = useState<"category" | "unit" | null>(null);
  const create = useCreateFrequencyType();
  const update = useUpdateFrequencyType();
  const createCategory = useCreateFrequencyTypeCategory();
  const createUnit = useCreateFrequencyTypeUnit();
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<FrequencyTypePayload>({ resolver: zodResolver(frequencyTypeSchema), defaultValues: EMPTY_FREQUENCY_TYPE });
  const pending = create.isPending || update.isPending;
  const [categoryId, unitId, intervalValue, descriptionValue] = useWatch({ control, name: ["category_id", "unit_id", "interval_value", "description"] });
  const selectedCategory = categories.find((option) => option.id === categoryId);
  const selectedUnit = units.find((option) => option.id === unitId);
  const unitInternalValue = selectedUnit?.internal_value ?? 0;
  const daysPerUnit = unitInternalValue > 0 && Number.isFinite(intervalValue) ? unitInternalValue * intervalValue : 0;
  const isDateCategory = selectedCategory?.value_type?.toLowerCase() === "date";

  useEffect(() => { if (open) reset(item ? { code: item.code, name: item.name, category_id: item.category_id, description: item.description, unit_id: item.unit_id, interval_value: item.interval_value, status: item.status } : EMPTY_FREQUENCY_TYPE); }, [item, open, reset]);
  const submit = (payload: FrequencyTypePayload) => item ? update.mutate({ id: item.id, payload }, { onSuccess: () => onOpenChange(false) }) : create.mutate(payload, { onSuccess: () => onOpenChange(false) });

  const submitQuickAdd = async (values: QuickAddValues) => {
    const name = String(values.name ?? "").trim();
    const description = String(values.description ?? "").trim() || undefined;
    if (quickAdd === "category") {
      const valueType = String(values.value_type ?? "");
      const option = await createCategory.mutateAsync({ name, description: description ?? "", value_type: valueType });
      setValue("category_id", option.id, { shouldValidate: true });
    } else {
      const unitValue = String(values.unit_value ?? "").trim();
      const option = await createUnit.mutateAsync({ name, unit_value: unitValue });
      setValue("unit_id", option.id, { shouldValidate: true });
    }
    setQuickAdd(null);
  };

  return <>
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{item ? "Edit Frequency Type" : "Create Frequency Type"}</DialogTitle><DialogDescription>{item ? "Update the registered maintenance frequency type data in the system." : "Create a new frequency configuration for asset maintenance."}</DialogDescription></DialogHeader>
        <form id="frequency-type-form" onSubmit={handleSubmit(submit)} className="space-y-6">
          <section><h3 className="mb-4 text-sm font-semibold"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs text-white">1</span>Basic Information</h3><div className="grid gap-4 sm:grid-cols-2">
            <FormTextField label="Frequency Code" name="code" register={register} error={errors.code} required placeholder="e.g. FRQ-006" />
            <FormTextField label="Frequency Type Name" name="name" register={register} error={errors.name} required placeholder="e.g. Bi-Weekly" />
            <FormSelectField label="Category" name="category_id" control={control} error={errors.category_id} required search options={categories.map((option) => ({ label: option.name, value: option.id }))} placeholder="Select a frequency category..." onAddNew={() => setQuickAdd("category")} className="sm:col-span-2" />
            <FormFieldLayout label="Description" htmlFor="description" error={errors.description?.message} className="sm:col-span-2" desc={`${descriptionValue?.length ?? 0}/255`}><Textarea id="description" rows={3} placeholder="Enter a description..." maxLength={255} {...register("description")} /></FormFieldLayout>
          </div></section>
          <section className="border-t pt-5"><h3 className="mb-4 text-sm font-semibold"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs text-white">2</span>Unit Configuration</h3><div className={`grid gap-4 ${isDateCategory ? "grid-cols-12" : "sm:grid-cols-2"}`}>
            <FormTextField label="Interval Value" name="interval_value" register={register} error={errors.interval_value} required type="number" placeholder="e.g. 3" className={isDateCategory ? "col-span-3" : undefined} />
            <FormSelectField label="Unit" name="unit_id" control={control} error={errors.unit_id} required search options={units.map((option) => ({ label: option.name, value: option.id }))} placeholder="Select a unit..." onAddNew={() => setQuickAdd("unit")} className={isDateCategory ? "col-span-6" : undefined} />
            {isDateCategory ? <FormFieldLayout label="Days per Unit" htmlFor="days-per-unit" desc={daysPerUnit > 0 ? `${intervalValue} ${selectedUnit?.name ?? "unit"} = ${daysPerUnit} days` : undefined} className="col-span-3"><Input id="days-per-unit" type="number" value={daysPerUnit} disabled className="h-10 rounded-sm bg-blue-50" /></FormFieldLayout> : null}
          </div><div className="mt-4 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">The unit and interval value combination determines how often maintenance is performed.</div></section>
          <section className="border-t pt-5"><h3 className="mb-4 text-sm font-semibold"><span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-700 text-xs text-white">3</span>Active Status</h3><Controller name="status" control={control} render={({ field }) => <div className="flex items-start gap-3"><Switch checked={field.value === "active"} onCheckedChange={(checked) => field.onChange(checked ? "active" : "inactive")} /><div><p className="text-sm font-medium">Active</p><p className="text-xs text-muted-foreground">Frequency type is active and available to use</p></div></div>} /></section>
        </form>
        <DialogFooter className="border-t pt-4"><Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>Cancel</Button><Button type="submit" form="frequency-type-form" disabled={pending}>{pending ? "Saving..." : item ? "Save" : "Create"}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
    <QuickAddDialog open={quickAdd !== null} onOpenChange={(next) => !next && setQuickAdd(null)} title={quickAdd === "category" ? "Create Frequency Category" : "Create Frequency Unit"} description={`Add a new ${quickAdd ?? "option"} for frequency types.`} submitLabel="Create" fields={quickAdd === "category" ? [{ name: "name", label: "Name", required: true, colSpan: 2 }, { name: "description", label: "Description", type: "textarea", colSpan: 2 }, { name: "value_type", label: "Value Type", type: "select", required: true, placeholder: "Select value type...", colSpan: 2, options: [{ label: "Date", value: "date" }, { label: "Int", value: "int" }, { label: "Text", value: "text" }] }] : [{ name: "name", label: "Name", required: true, colSpan: 2 }, { name: "unit_value", label: "Unit Value", required: true, placeholder: "Enter unit value...", colSpan: 2 }]} isLoading={createCategory.isPending || createUnit.isPending} onSubmit={submitQuickAdd} />
  </>;
}
