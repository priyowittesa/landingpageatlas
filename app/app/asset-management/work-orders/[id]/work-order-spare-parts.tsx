"use client";

import { useEffect, useMemo, useState } from "react";
import { Package, Plus, Trash2 } from "lucide-react";
import { LazySelect } from "@/components/LazySelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { WorkOrderSparePart } from "../use-work-orders";
import { useAddWorkOrderSparePart, useDeleteWorkOrderSparePart, useWorkOrderSpareParts } from "../use-work-orders";
import { useInfiniteSpareParts } from "../../spare-part/use-spare-parts";

const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value);

export function WorkOrderSpareParts({ workOrderId, readOnly = false }: { workOrderId: string; readOnly?: boolean }) {
  const query = useWorkOrderSpareParts(workOrderId); const remove = useDeleteWorkOrderSparePart(workOrderId);
  const [addOpen, setAddOpen] = useState(false); const [deleting, setDeleting] = useState<WorkOrderSparePart | null>(null); const rows = query.data ?? [];
  return <section className="rounded-xl border bg-white p-5 shadow-sm"><header className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4"/>Spare Parts Used</h2>{!readOnly && <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4"/>Add Part</Button>}</header>
    <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[600px] text-left text-xs"><thead className="border-b bg-gray-50 text-gray-500"><tr><th className="p-3 font-medium">Part Name</th><th className="p-3 font-medium">Quantity</th><th className="p-3 font-medium">Unit Cost</th><th className="p-3 font-medium">Total</th>{!readOnly && <th className="w-12 p-3"/>}</tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-b last:border-0"><td className="p-3">{row.name}</td><td className="p-3">{row.quantity}</td><td className="p-3">{money(row.unitCost)}</td><td className="p-3">{money(row.total)}</td>{!readOnly && <td className="p-3"><button type="button" aria-label={`Delete ${row.name}`} onClick={() => setDeleting(row)} className="rounded p-1 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button></td>}</tr>)}</tbody></table>{query.isLoading && <State text="Loading spare parts..."/>}{query.isError && <State text="Unable to load spare parts."/>}{!query.isLoading && !query.isError && rows.length === 0 && <State text="No spare parts used."/>}</div>
    <AddSparePartDialog open={addOpen} onOpenChange={setAddOpen} workOrderId={workOrderId}/>
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }} title="Delete spare part?" description={`Delete ${deleting?.name ?? "this spare part"} from this work order?`} confirmLabel="Delete" isLoading={remove.isPending} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }}/>
  </section>;
}

function AddSparePartDialog({ open, onOpenChange, workOrderId }: { open: boolean; onOpenChange: (open: boolean) => void; workOrderId: string }) {
  const add = useAddWorkOrderSparePart(workOrderId);
  const [sparePartId, setSparePartId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitCost, setUnitCost] = useState("");
  const spareParts = useInfiniteSpareParts(debouncedSearch, open);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadedParts = useMemo(
    () => spareParts.data?.pages.flatMap((page) => page.items) ?? [],
    [spareParts.data?.pages],
  );
  const options = useMemo(() => {
    const loaded = loadedParts.map((part) => ({
      value: part.id,
      label: `${part.name} · Stock: ${part.unit_stock}`,
    }));
    if (sparePartId && selectedLabel && !loaded.some((option) => option.value === sparePartId)) {
      loaded.unshift({ value: sparePartId, label: selectedLabel });
    }
    return loaded;
  }, [loadedParts, selectedLabel, sparePartId]);

  const invalid = !sparePartId || !Number.isFinite(Number(quantity)) || Number(quantity) <= 0 || !Number.isFinite(Number(unitCost)) || Number(unitCost) < 0;
  const close = () => {
    setSparePartId("");
    setSelectedLabel("");
    setSearch("");
    setDebouncedSearch("");
    setQuantity("1");
    setUnitCost("");
    onOpenChange(false);
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Add Spare Part</DialogTitle><DialogDescription>Select a spare part from master data for this work order.</DialogDescription></DialogHeader><div className="space-y-4"><LazySelect label="Spare Part" name="spare_part_id" required value={sparePartId} onChange={(value) => { const part = loadedParts.find((item) => item.id === value); setSparePartId(value); setSelectedLabel(part ? `${part.name} · Stock: ${part.unit_stock}` : ""); if (part) setUnitCost(String(part.unit_price || 0)); setSearch(""); setDebouncedSearch(""); }} options={options} totalLoaded={loadedParts.length} isLoading={spareParts.isLoading} isFetchingNextPage={spareParts.isFetchingNextPage} hasMore={Boolean(spareParts.hasNextPage)} onLoadMore={() => void spareParts.fetchNextPage()} search={search} onSearchChange={setSearch} placeholder="Select spare part" searchPlaceholder="Search spare part..." emptyMessage="No spare part found."/><div className="grid grid-cols-2 gap-4"><Field label="Quantity"><input type="number" min="0.01" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} className="h-10 w-full rounded-lg border px-3 text-sm"/></Field><Field label="Unit Cost"><input type="number" min="0" step="any" value={unitCost} onChange={(event) => setUnitCost(event.target.value)} placeholder="0" className="h-10 w-full rounded-lg border px-3 text-sm"/></Field></div><div className="flex justify-between rounded-lg bg-gray-50 p-3 text-sm"><span className="text-gray-500">Total</span><strong>{money((Number(quantity) || 0) * (Number(unitCost) || 0))}</strong></div></div><DialogFooter><Button variant="outline" disabled={add.isPending} onClick={close}>Cancel</Button><Button disabled={invalid || add.isPending} onClick={() => add.mutate({ spare_part_id: sparePartId, quantity: Number(quantity), unit_cost: Number(unitCost) }, { onSuccess: close })}>{add.isPending ? "Adding..." : "Add Part"}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium">{label}<span className="text-red-500"> *</span><div className="mt-2">{children}</div></label>; }
function State({ text }: { text: string }) { return <div className="py-10 text-center text-sm text-gray-400">{text}</div>; }
