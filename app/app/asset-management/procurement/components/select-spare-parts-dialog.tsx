"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, PackageSearch, Plus, Trash2 } from "lucide-react";
import LazySelect from "@/components/LazySelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useInfiniteSpareParts, type SparePart } from "../../spare-part/use-spare-parts";

export type PurchaseRequestPartDraft = {
  procurementSparePartId?: string;
  sparePartId: string;
  number: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
};

type Props = {
  value: PurchaseRequestPartDraft[];
  onConfirm: (parts: PurchaseRequestPartDraft[]) => void;
  onCancel: () => void;
  lockedPartIds?: string[];
};

const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

export function SelectSpareParts({ value, onConfirm, onCancel, lockedPartIds = [] }: Props) {
  const [draft, setDraft] = useState<PurchaseRequestPartDraft[]>(value);
  const [addOpen, setAddOpen] = useState(false);
  const total = draft.reduce((sum, part) => sum + part.quantity * part.price, 0);
  const addPart = (part: PurchaseRequestPartDraft) => setDraft((current) => {
    const existing = current.find((item) => item.sparePartId === part.sparePartId);
    return existing
      ? current.map((item) => item.sparePartId === part.sparePartId ? { ...item, quantity: item.quantity + part.quantity, price: part.price } : item)
      : [...current, part];
  });
  const updatePart = (index: number, key: "quantity" | "price", value: string) => setDraft((current) => current.map((part, partIndex) =>
    partIndex === index ? { ...part, [key]: Math.max(key === "quantity" ? 1 : 0, Number(value) || 0) } : part));

  return <div className="space-y-5 pb-10">
    <header><button type="button" onClick={onCancel} className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-700"><ArrowLeft className="h-3.5 w-3.5" />Create Purchase Request</button><h1 className="text-2xl font-bold text-gray-950">Select Spare Parts</h1><p className="mt-1 text-sm text-gray-500">Add and allocate maintenance stock to this Purchase Request.</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <section className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Selected Spare Parts</h2><Button type="button" size="sm" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" />Add Spare Part</Button></div>
        {draft.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50/60 px-4 text-center"><PackageSearch className="mb-3 h-9 w-9 text-gray-400" /><p className="text-sm font-semibold">No spare parts added yet</p><p className="mt-1 text-xs text-gray-500">Click Add Spare Part to select inventory from master data.</p></div> : <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-3">Part Number</th><th className="p-3">Description</th><th className="w-28 p-3 text-right">Qty</th><th className="w-36 p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th><th className="w-12 p-3" /></tr></thead><tbody>{draft.map((part, index) => <tr key={`${part.sparePartId}-${index}`} className="border-b last:border-0"><td className="p-3 font-semibold">{part.number}</td><td className="p-3 text-gray-600">{part.description}</td><td className="p-2"><Input type="number" min="1" step="1" value={part.quantity} onChange={(event) => updatePart(index, "quantity", event.target.value)} /></td><td className="p-2"><Input type="number" min="0" step="any" value={part.price} onChange={(event) => updatePart(index, "price", event.target.value)} /></td><td className="p-3 text-right font-semibold">{money(part.quantity * part.price)}</td><td className="p-2">{!lockedPartIds.includes(part.sparePartId) && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${part.name}`} className="text-red-500 hover:bg-red-50 hover:text-red-700" onClick={() => setDraft((current) => current.filter((_, partIndex) => partIndex !== index))}><Trash2 className="h-4 w-4" /></Button>}</td></tr>)}</tbody></table></div>}
      </section>
      <aside className="sticky top-5 rounded-xl border bg-white p-4 shadow-sm"><h3 className="text-xs font-semibold uppercase text-gray-600">Selected Parts ({draft.length})</h3><div className="my-4 space-y-2">{draft.length === 0 ? <p className="text-xs text-gray-500">No spare parts selected.</p> : draft.map((part, index) => <div key={`${part.sparePartId}-${index}`} className="flex justify-between gap-3 text-xs"><span className="min-w-0 truncate">{part.number !== "-" ? part.number : part.name} x{part.quantity}</span><strong>{money(part.quantity * part.price)}</strong></div>)}</div><div className="flex items-center justify-between border-y py-4 text-sm"><span className="text-gray-500">Subtotal Estimate</span><strong className="text-lg text-primary-700">{money(total)}</strong></div><div className="mt-4 space-y-2"><Button type="button" className="w-full" onClick={() => onConfirm(draft)}>Add to Request Form</Button><Button type="button" variant="outline" className="w-full" onClick={onCancel}>Cancel</Button></div></aside>
    </div>
    <AddSparePartDialog open={addOpen} onOpenChange={setAddOpen} selected={draft} lockedPartIds={lockedPartIds} onAdd={addPart} />
  </div>;
}

function AddSparePartDialog({ open, onOpenChange, selected, lockedPartIds, onAdd }: { open: boolean; onOpenChange: (open: boolean) => void; selected: PurchaseRequestPartDraft[]; lockedPartIds: string[]; onAdd: (part: PurchaseRequestPartDraft) => void }) {
  const [sparePartId, setSparePartId] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [price, setPrice] = useState("");
  const [chosenPart, setChosenPart] = useState<SparePart | null>(null);
  const spareParts = useInfiniteSpareParts(debouncedSearch, open);
  useEffect(() => { const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300); return () => window.clearTimeout(timeout); }, [search]);
  const loaded = useMemo(() => spareParts.data?.pages.flatMap((page) => page.items) ?? [], [spareParts.data?.pages]);
  const selectedPart = chosenPart;
  const existingQuantity = selected.find((part) => part.sparePartId === sparePartId)?.quantity ?? 0;
  const options = useMemo(() => {
    const result = loaded.map((part) => ({ value: part.id, label: `${part.name} · Stock: ${part.unit_stock}`, disabled: lockedPartIds.includes(part.id), disabledLabel: lockedPartIds.includes(part.id) ? "Already attached" : undefined }));
    if (sparePartId && selectedLabel && !result.some((option) => option.value === sparePartId)) result.unshift({ value: sparePartId, label: selectedLabel, disabled: false, disabledLabel: undefined });
    return result;
  }, [loaded, selectedLabel, sparePartId]);
  const requestedQuantity = Number(quantity);
  const invalid = !selectedPart || !Number.isFinite(requestedQuantity) || requestedQuantity <= 0 || existingQuantity + requestedQuantity > selectedPart.unit_stock || !Number.isFinite(Number(price)) || Number(price) < 0;
  const close = () => { setSparePartId(""); setSelectedLabel(""); setSearch(""); setDebouncedSearch(""); setQuantity("1"); setPrice(""); setChosenPart(null); onOpenChange(false); };
  const submit = () => {
    if (!selectedPart || invalid) return;
    onAdd({ sparePartId: selectedPart.id, number: selectedPart.part_number ?? selectedPart.code ?? "-", name: selectedPart.name, description: selectedPart.description || selectedPart.name, quantity: requestedQuantity, price: Number(price) });
    close();
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Add Spare Part</DialogTitle><DialogDescription>Select a spare part from master data for this purchase request.</DialogDescription></DialogHeader><div className="space-y-4"><LazySelect label="Spare Part" name="procurement_spare_part_id" required value={sparePartId} onChange={(value) => { const part = loaded.find((item) => item.id === value) ?? null; setSparePartId(value); setChosenPart(part); setSelectedLabel(part ? `${part.name} · Stock: ${part.unit_stock}` : ""); if (part) setPrice(String(part.unit_price || 0)); setSearch(""); setDebouncedSearch(""); }} options={options} totalLoaded={loaded.length} isLoading={spareParts.isLoading} isFetchingNextPage={spareParts.isFetchingNextPage} hasMore={Boolean(spareParts.hasNextPage)} onLoadMore={() => void spareParts.fetchNextPage()} search={search} onSearchChange={setSearch} placeholder="Select spare part" searchPlaceholder="Search spare part..." emptyMessage="No spare part found." /><div className="grid grid-cols-2 gap-4"><Field label="Quantity"><Input type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field><Field label="Unit Cost"><Input type="number" min="0" step="any" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="0" /></Field></div>{selectedPart && <p className={`text-xs ${existingQuantity + requestedQuantity > selectedPart.unit_stock ? "text-red-600" : "text-gray-500"}`}>Available stock: {selectedPart.unit_stock}. Already selected: {existingQuantity}.</p>}<div className="flex justify-between rounded-lg bg-gray-50 p-3 text-sm"><span className="text-gray-500">Total</span><strong>{money((requestedQuantity || 0) * (Number(price) || 0))}</strong></div></div><DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="button" disabled={invalid} onClick={submit}>Add</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-700">{label}<span className="text-red-500"> *</span><div className="mt-2">{children}</div></label>; }
