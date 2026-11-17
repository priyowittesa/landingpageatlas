"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Eye, FileText, Package, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { type ProcurementAttachment, useProcurement, useProcurementAttachments, useProcurementAttachmentUrl, useProcurementDepartments, useProcurementSpareParts, useUpdateProcurement } from "../use-procurements";
import { SelectSpareParts, type PurchaseRequestPartDraft } from "./select-spare-parts-dialog";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

const inputClass = "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary-100";
const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
function localDate() { const value = new Date(); return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`; }
function toRfc3339(date: string) { const value = new Date(`${date}T00:00:00`); const offset = -value.getTimezoneOffset(); const sign = offset >= 0 ? "+" : "-"; return `${date}T00:00:00${sign}${String(Math.floor(Math.abs(offset) / 60)).padStart(2, "0")}:${String(Math.abs(offset) % 60).padStart(2, "0")}`; }
function toLocalInputDate(value: string) { const date = new Date(value); if (Number.isNaN(date.getTime())) return value.slice(0, 10); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export function ProcurementEditForm({ id }: { id: string }) {
  const router = useRouter();
  const detail = useProcurement(id);
  const spareParts = useProcurementSpareParts(id);
  const existingAttachments = useProcurementAttachments(id);
  const departments = useProcurementDepartments();
  const update = useUpdateProcurement(id);
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [requester, setRequester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [selectedParts, setSelectedParts] = useState<PurchaseRequestPartDraft[]>([]);
  const [partsHydrated, setPartsHydrated] = useState(false);
  const [selectPartsOpen, setSelectPartsOpen] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  useEffect(() => { setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "Review PR", href: `/app/asset-management/procurement/${id}` }, { title: "Edit Draft" }]); return clearBreadcrumbs; }, [id, setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => {
    if (!detail.data || !departments.data || hydrated) return;
    const item = detail.data;
    setRequester(item.requesterName);
    setDeliveryDate(toLocalInputDate(item.requiredDeliveryAt));
    setPriority(item.priority.toLowerCase());
    setPurpose(item.purpose);
    setNotes(item.notes);
    setHydrated(true);
  }, [departments.data, detail.data, hydrated]);
  useEffect(() => {
    if (departmentId || !detail.data || !departments.data?.length) return;
    const currentId = detail.data.departmentId.trim().toLowerCase();
    const currentValue = detail.data.department.trim().toLowerCase();
    const match = departments.data.find((department) =>
      department.value.trim().toLowerCase() === currentId
      || department.value.trim().toLowerCase() === currentValue
      || department.label.trim().toLowerCase() === currentValue);
    if (match) setDepartmentId(match.value);
  }, [departmentId, departments.data, detail.data]);
  useEffect(() => {
    if (!spareParts.data || partsHydrated) return;
    setSelectedParts(spareParts.data.map((part) => ({ procurementSparePartId: part.id, sparePartId: part.sparePartId, number: part.number, name: part.name, description: part.description, quantity: part.quantity, price: part.price })));
    setPartsHydrated(true);
  }, [partsHydrated, spareParts.data]);

  const selectedDepartment = departments.data?.find((item) => item.value === departmentId);
  const total = useMemo(() => selectedParts.reduce((sum, part) => sum + part.quantity * part.price, 0), [selectedParts]);
  const invalid = !requester.trim() || !selectedDepartment || !deliveryDate || !priority || !purpose.trim();
  const addAttachments = (files: FileList | File[]) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    const incoming = Array.from(files);
    if (incoming.some((file) => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024)) { setAttachmentError("Only PDF, PNG, or JPG files up to 10 MB are allowed."); return; }
    setAttachmentError("");
    setAttachments((current) => [...current, ...incoming.filter((file) => !current.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified))]);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!detail.data || !selectedDepartment || invalid) return;
    const originalParts = spareParts.data ?? [];
    const newParts = selectedParts.filter((part) => !part.procurementSparePartId);
    const updatedParts = selectedParts.flatMap((part) => {
      if (!part.procurementSparePartId) return [];
      const original = originalParts.find((item) => item.id === part.procurementSparePartId);
      if (!original || (original.sparePartId === part.sparePartId && original.quantity === part.quantity && original.price === part.price)) return [];
      return [{ id: part.procurementSparePartId, spare_part_id: part.sparePartId, quantity: part.quantity, price: part.price, use_catalog_price: false }];
    });
    const deletedPartIds = originalParts.filter((original) => !selectedParts.some((part) => part.procurementSparePartId === original.id)).map((part) => part.id);
    update.mutate({ payload: { department: selectedDepartment.value, notes: notes.trim(), priority, purpose: purpose.trim(), requester_name: requester.trim(), required_delivery_at: toRfc3339(deliveryDate), source_id: detail.data.sourceId || undefined, source_type: detail.data.sourceType.toLowerCase() === "manual" ? "manual" : "work_order" }, newParts: newParts.map((part) => ({ spare_part_id: part.sparePartId, quantity: part.quantity, price: part.price })), updatedParts, deletedPartIds, attachments }, { onSuccess: () => router.push(`/app/asset-management/procurement/${encodeURIComponent(id)}`) });
  };

  if (detail.isLoading || spareParts.isLoading || departments.isLoading) return <div className="py-24 text-center text-sm text-gray-500">Loading draft...</div>;
  if (detail.isError || !detail.data) return <State text="Purchase request could not be loaded." id={id} />;
  if (detail.data.status.toLowerCase() !== "draft") return <State text="Only draft purchase requests can be edited." id={id} />;
  if (selectPartsOpen) return <SelectSpareParts value={selectedParts} onCancel={() => setSelectPartsOpen(false)} onConfirm={(parts) => { setSelectedParts(parts); setSelectPartsOpen(false); }} />;

  return <form onSubmit={submit} className="space-y-5 pb-10">
    <header><Link href={`/app/asset-management/procurement/${encodeURIComponent(id)}`} className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-700"><ArrowLeft className="h-3.5 w-3.5" />Review PR</Link><h1 className="text-2xl font-bold text-gray-950">Edit Draft: {detail.data.number}</h1><p className="mt-1 text-sm text-gray-500">Update procurement details before submitting the request.</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5"><section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">1. Procurement Context & Details</h2><div className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm"><span className="text-xs font-semibold uppercase text-primary-700">Linked Work Order</span>{detail.data.sourceId ? <Button asChild type="button" variant="outline" size="sm"><Link href={`/app/asset-management/work-orders/${encodeURIComponent(detail.data.sourceId)}`}>View Work Order<ExternalLink className="h-3.5 w-3.5" /></Link></Button> : <span className="text-xs text-gray-500">Not linked</span>}</div><div className="grid gap-4 sm:grid-cols-2"><Field label="Requester Name" required><Input value={requester} onChange={(event) => setRequester(event.target.value)} /></Field><Field label="Department" required><Select value={departmentId} onValueChange={setDepartmentId}><SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger><SelectContent>{departments.data?.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></Field><Field label="Required Delivery Date" required><DatePicker className="h-10 text-sm" min={localDate()} value={deliveryDate} onChange={setDeliveryDate} /></Field><Field label="Priority" required><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field></div><Field label="Purpose of Procurement" required><Input value={purpose} onChange={(event) => setPurpose(event.target.value)} /></Field></section>
        <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" />2. Selected Spare Parts</h2><Button type="button" size="sm" onClick={() => setSelectPartsOpen(true)}>+ Add Spare Part</Button></div><div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-3">Part Number</th><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{selectedParts.map((part, index) => <tr key={`${part.sparePartId}-${index}`} className="border-b last:border-0"><td className="p-3 font-semibold">{part.number}</td><td className="p-3 text-gray-600">{part.description}</td><td className="p-3 text-right">{part.quantity}</td><td className="p-3 text-right">{money(part.price)}</td><td className="p-3 text-right font-semibold">{money(part.quantity * part.price)}</td></tr>)}{selectedParts.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">No spare parts attached.</td></tr>}</tbody></table></div></section>
        <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">3. Attachments & Notes</h2><div><p className="mb-2 text-xs font-medium">Existing Attachments</p>{existingAttachments.isLoading ? <p className="py-3 text-xs text-gray-500">Loading attachments...</p> : existingAttachments.data?.length ? <div className="space-y-2">{existingAttachments.data.map((attachment) => <ExistingAttachment key={attachment.id} attachment={attachment} />)}</div> : <p className="py-3 text-xs text-gray-500">No existing attachments.</p>}</div><Field label="Upload New Document/Receipt"><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addAttachments(event.dataTransfer.files); }} className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50/60 text-center"><Upload className="mb-2 h-5 w-5 text-gray-500" /><span className="text-xs font-medium">Click to upload or drag & drop</span><span className="mt-1 text-[10px] text-gray-400">PDF, PNG, JPG up to 10 MB</span><input type="file" multiple accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => { if (event.target.files) addAttachments(event.target.files); event.target.value = ""; }} /></label>{attachmentError && <p className="mt-1 text-xs text-red-600">{attachmentError}</p>}{attachments.length > 0 && <div className="mt-3 space-y-2">{attachments.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3"><button type="button" onClick={() => setPreviewFile(file)} className="flex min-w-0 items-center gap-2 text-left"><FileText className="h-4 w-4 shrink-0" /><div className="min-w-0"><p className="truncate text-xs font-medium hover:text-primary-700 hover:underline">{file.name}</p><p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div></button><div className="flex"><Button type="button" variant="ghost" size="icon" onClick={() => setPreviewFile(file)}><Eye className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X className="h-4 w-4" /></Button></div></div>)}</div>}</Field><Field label="Notes"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add internal notes, vendor instructions, or delivery requirements..." /></Field></section></div>
      <aside className="sticky top-5 rounded-xl border bg-white p-4 shadow-sm"><h2 className="text-xs font-semibold uppercase text-gray-600">PR Metrics Summary</h2><div className="my-4 flex items-center justify-between border-y py-4 text-sm"><span className="text-gray-500">Subtotal Estimate</span><strong className="text-lg text-primary-700">{money(total)}</strong></div><div className="space-y-2"><Button type="submit" className="w-full" disabled={invalid || update.isPending}>{update.isPending ? "Saving..." : "Save Draft"}</Button><Button type="button" variant="outline" className="w-full" disabled={update.isPending} onClick={() => router.push(`/app/asset-management/procurement/${encodeURIComponent(id)}`)}>Cancel</Button></div></aside>
    </div>
    <AttachmentPreviewDialog open={Boolean(previewFile)} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} file={previewFile} name={previewFile?.name ?? "Attachment preview"} />
  </form>;
}

function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-700">{label}{required && <span className="text-red-500"> *</span>}<div className="mt-2">{children}</div></label>; }
function ExistingAttachment({ attachment }: { attachment: ProcurementAttachment }) { const [open, setOpen] = useState(false); const preview = useProcurementAttachmentUrl(attachment.id, open); return <><button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3 text-left hover:bg-gray-100"><div className="flex min-w-0 items-center gap-2"><FileText className="h-4 w-4" /><div className="min-w-0"><p className="truncate text-xs font-medium">{attachment.name}</p>{attachment.size > 0 && <p className="text-[10px] text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>}</div></div><Eye className="h-4 w-4 text-gray-500" /></button><AttachmentPreviewDialog open={open} onOpenChange={setOpen} name={attachment.name} url={preview.data} loading={preview.isLoading} error={preview.isError} /></>; }
function State({ text, id }: { text: string; id: string }) { return <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border bg-white"><p className="text-sm text-gray-500">{text}</p><Button asChild><Link href={`/app/asset-management/procurement/${encodeURIComponent(id)}`}>Back to Review</Link></Button></div>; }
