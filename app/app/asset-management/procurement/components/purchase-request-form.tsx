"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ExternalLink, Eye, FileText, Package, PackageSearch, Upload, X } from "lucide-react";
import { useAuthMe } from "@/hooks/useAuthMe";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkOrder, useWorkOrderSpareParts } from "../../work-orders/use-work-orders";
import { useCreateProcurement, useProcurementDepartments } from "../use-procurements";
import { SelectSpareParts, type PurchaseRequestPartDraft } from "./select-spare-parts-dialog";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

type Props = { workOrderId: string; standalone?: boolean };
const inputClass = "h-10 w-full rounded-lg border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-primary-100";
const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

function localDate(daysFromToday = 0) {
  const value = new Date();
  value.setDate(value.getDate() + daysFromToday);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function toRfc3339(date: string) {
  const localMidnight = new Date(`${date}T00:00:00`);
  const offsetMinutes = -localMidnight.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const hours = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, "0");
  const minutes = String(Math.abs(offsetMinutes) % 60).padStart(2, "0");
  return `${date}T00:00:00${sign}${hours}:${minutes}`;
}

export function PurchaseRequestForm({ workOrderId, standalone = false }: Props) {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const me = useAuthMe();
  const workOrder = useWorkOrder(workOrderId);
  const spareParts = useWorkOrderSpareParts(workOrderId);
  const departments = useProcurementDepartments();
  const create = useCreateProcurement();
  const [requester, setRequester] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(() => localDate(1));
  const [priority, setPriority] = useState("medium");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [parts, setParts] = useState<PurchaseRequestPartDraft[]>([]);
  const [selectPartsOpen, setSelectPartsOpen] = useState(false);
  const [submitAction, setSubmitAction] = useState<"draft" | "submit" | null>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "New Request" }]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);
  useEffect(() => setRequester(me.data?.labour?.full_name ?? me.data?.name ?? ""), [me.data]);
  useEffect(() => {
    if (departmentId || !departments.data?.length) return;
    const profileId = me.data?.labour?.department_id;
    const profileName = me.data?.labour?.department_name;
    const match = departments.data.find((item) => item.value === profileId || item.label === profileName);
    if (match) setDepartmentId(match.value);
  }, [departmentId, departments.data, me.data]);
  useEffect(() => {
    if (!workOrder.data) return;
    setPriority(workOrder.data.priority && workOrder.data.priority !== "-" ? workOrder.data.priority.toLowerCase() : "medium");
    setPurpose(workOrder.data.title || workOrder.data.problemDescription || `Spare parts for ${workOrder.data.number}`);
  }, [workOrder.data]);
  useEffect(() => {
    if (!spareParts.data) return;
    setParts(spareParts.data.map((part) => ({ sparePartId: part.sparePartId, number: part.number, name: part.name, description: part.description, quantity: part.quantity, price: part.unitCost })));
  }, [spareParts.data]);

  const selectedDepartment = departments.data?.find((item) => item.value === departmentId);
  const total = useMemo(() => parts.reduce((sum, part) => sum + part.quantity * part.price, 0), [parts]);
  const loading = Boolean(workOrderId) && (workOrder.isLoading || spareParts.isLoading);
  const invalid = (!standalone && !workOrderId) || !requester.trim() || !selectedDepartment || !deliveryDate || !priority || !purpose.trim()
    || parts.some((part) => !part.sparePartId || part.quantity <= 0 || part.price < 0);
  const addAttachments = (files: FileList | File[]) => {
    const allowed = ["application/pdf", "image/png", "image/jpeg"];
    const incoming = Array.from(files);
    const invalidFile = incoming.find((file) => !allowed.includes(file.type) || file.size > 10 * 1024 * 1024);
    if (invalidFile) { setAttachmentError("Only PDF, PNG, or JPG files up to 10 MB are allowed."); return; }
    setAttachmentError("");
    setAttachments((current) => [...current, ...incoming.filter((file) => !current.some((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified))]);
  };
  const createRequest = (status: "draft" | "submit") => {
    if (invalid || !selectedDepartment) return;
    setSubmitAction(status);
    create.mutate({
      payload: { department: selectedDepartment.value, notes: notes.trim(), priority, purpose: purpose.trim(), requester_name: requester.trim(), required_delivery_at: toRfc3339(deliveryDate), source_id: standalone ? undefined : workOrderId, source_type: standalone ? "manual" : "work_order", status },
      parts: parts.map((part) => ({ spare_part_id: part.sparePartId, quantity: part.quantity, price: part.price })),
      attachments,
    }, { onSuccess: () => router.push("/app/asset-management/procurement"), onSettled: () => setSubmitAction(null) });
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createRequest("submit");
  };

  if (!standalone && !workOrderId) return <EmptyState title="Work Order is required" description="Start from the Purchase Requests page and select a Work Order first." />;
  if (loading) return <div className="py-24 text-center text-sm text-gray-500">Loading purchase request form...</div>;
  if (workOrder.isError) return <EmptyState title="Work Order could not be loaded" description="The selected Work Order may no longer be available." />;
  if (selectPartsOpen) return <SelectSpareParts value={parts} onCancel={() => setSelectPartsOpen(false)} onConfirm={(selected) => { setParts(selected); setSelectPartsOpen(false); }} />;

  return <form onSubmit={submit} className="space-y-5 pb-10">
    <header><Link href="/app/asset-management/procurement" className="mb-2 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary-700"><ArrowLeft className="h-3.5 w-3.5" />Purchase Requests</Link><h1 className="text-2xl font-bold text-gray-950">{standalone ? "Create Standalone Purchase Requisition" : "Create Purchase Request"}</h1><p className="mt-1 text-sm text-gray-500">{standalone ? "Manually request warehouse replenishment or ad-hoc spare parts procurement." : "Create a procurement request from an active Work Order."}</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold">1. {standalone ? "Requisition Details" : "Procurement Context & Details"}</h2>
          {standalone ? <div className="rounded-lg border border-blue-300 bg-blue-50 p-3 text-xs text-blue-800">This purchase request is standalone. It will be routed based on the department and estimated total cost.</div> : <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3 text-sm"><div><span className="text-xs font-semibold uppercase text-primary-700">Linked Work Order</span><p className="mt-1 text-xs text-gray-600">{workOrder.data?.title || workOrder.data?.problemDescription}</p></div><Button asChild type="button" variant="outline" size="sm"><Link href={`/app/asset-management/work-orders/${encodeURIComponent(workOrderId)}`}>View Work Order<ExternalLink className="h-3.5 w-3.5" /></Link></Button></div>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Requester Name" required><Input value={requester} onChange={(event) => setRequester(event.target.value)} /></Field>
            <Field label="Department" required><Select value={departmentId} onValueChange={setDepartmentId} disabled={departments.isLoading || departments.isError}><SelectTrigger><SelectValue placeholder={departments.isLoading ? "Loading departments..." : "Select department"} /></SelectTrigger><SelectContent>{departments.data?.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>{departments.isError && <p className="mt-1 text-xs text-red-600">Departments could not be loaded.</p>}</Field>
            <Field label="Required Delivery Date" required><DatePicker className="h-10 text-sm" min={localDate()} value={deliveryDate} onChange={setDeliveryDate} /></Field>
            <Field label="Priority" required><select className={inputClass} value={priority} onChange={(event) => setPriority(event.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></Field>
          </div>
          <Field label={standalone ? "Procurement Purpose & Scope" : "Purpose of Procurement"} required>{standalone ? <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} placeholder="Detail the procurement justification or target equipment line items..." /> : <Input value={purpose} onChange={(event) => setPurpose(event.target.value)} />}</Field>
        </section>
        <PartsTable parts={parts} isError={spareParts.isError} onSelect={() => setSelectPartsOpen(true)} />
        {standalone && <section className="space-y-4 rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">3. Attachments & Notes</h2><Field label="Upload Document/Receipt"><label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); addAttachments(event.dataTransfer.files); }} className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50/60 text-center"><Upload className="mb-2 h-5 w-5 text-gray-500" /><span className="text-xs font-medium">Click to upload or drag & drop</span><span className="mt-1 text-[10px] text-gray-400">PDF, PNG, JPG up to 10 MB</span><input type="file" multiple accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(event) => { if (event.target.files) addAttachments(event.target.files); event.target.value = ""; }} /></label>{attachmentError && <p className="mt-1 text-xs text-red-600">{attachmentError}</p>}{attachments.length > 0 && <div className="mt-3 space-y-2">{attachments.map((file, index) => <div key={`${file.name}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border bg-gray-50 p-3"><button type="button" onClick={() => setPreviewFile(file)} className="flex min-w-0 items-center gap-2 text-left"><FileText className="h-4 w-4 shrink-0" /><div className="min-w-0"><p className="truncate text-xs font-medium hover:text-primary-700 hover:underline">{file.name}</p><p className="text-[10px] text-gray-500">{(file.size / 1024).toFixed(1)} KB</p></div></button><div className="flex shrink-0"><Button type="button" variant="ghost" size="icon" aria-label={`Preview ${file.name}`} onClick={() => setPreviewFile(file)}><Eye className="h-4 w-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Remove ${file.name}`} onClick={() => setAttachments((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X className="h-4 w-4" /></Button></div></div>)}</div>}</Field><Field label="Notes"><Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Add internal notes, vendor instructions, or delivery requirements..." /></Field></section>}
      </div>
      <aside className="sticky top-5 rounded-xl border bg-white p-4 shadow-sm"><h2 className="text-xs font-semibold uppercase text-gray-600">PR Metrics Summary</h2><div className="mt-4 space-y-2">{parts.map((part, index) => <div key={`${part.sparePartId}-${index}`} className="flex justify-between gap-3 text-xs"><span className="min-w-0 truncate">{part.number !== "-" ? part.number : part.name} x{part.quantity}</span><strong>{money(part.quantity * part.price)}</strong></div>)}</div><div className="my-4 flex items-center justify-between border-y py-4 text-sm"><span className="text-gray-500">Subtotal Estimate</span><strong className="text-lg text-primary-700">{money(total)}</strong></div><div className="space-y-2"><Button type="submit" className="w-full" disabled={invalid || departments.isLoading || departments.isError || spareParts.isError || create.isPending}>{submitAction === "submit" ? "Submitting..." : "Submit Request"}</Button><Button type="button" variant="outline" className="w-full" disabled={invalid || departments.isLoading || departments.isError || spareParts.isError || create.isPending} onClick={() => createRequest("draft")}>{submitAction === "draft" ? "Saving..." : "Save as Draft"}</Button><Button type="button" variant="outline" className="w-full" disabled={create.isPending} onClick={() => router.push("/app/asset-management/procurement")}>Cancel</Button></div></aside>
    </div>
    <AttachmentPreviewDialog open={Boolean(previewFile)} onOpenChange={(open) => { if (!open) setPreviewFile(null); }} file={previewFile} name={previewFile?.name ?? "Attachment preview"} />
  </form>;
}

function PartsTable({ parts, isError, onSelect }: { parts: PurchaseRequestPartDraft[]; isError: boolean; onSelect: () => void }) {
  return <section className="rounded-xl border bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-semibold"><Package className="h-4 w-4" />2. Selected Spare Parts</h2><Button type="button" size="sm" onClick={onSelect}>+ Select Spare Parts</Button></div>{isError ? <p className="py-8 text-center text-sm text-red-600">Spare parts could not be loaded.</p> : parts.length === 0 ? <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50/60 px-4 text-center"><PackageSearch className="mb-3 h-8 w-8 text-gray-400" /><p className="text-sm font-semibold">No spare parts added yet</p><p className="mt-1 text-xs text-gray-500">Click the button above to search and add spare parts.</p></div> : <div className="overflow-x-auto rounded-lg border"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-3">Part Number</th><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{parts.map((part, index) => <tr key={`${part.sparePartId}-${index}`} className="border-b last:border-0"><td className="p-3 font-semibold">{part.number}</td><td className="p-3 text-gray-600">{part.description !== "-" ? part.description : part.name}</td><td className="p-3 text-right">{part.quantity}</td><td className="p-3 text-right">{money(part.price)}</td><td className="p-3 text-right font-semibold">{money(part.quantity * part.price)}</td></tr>)}</tbody><tfoot><tr className="border-t"><td colSpan={4} className="p-3 text-right text-gray-500">Estimated Total Cost:</td><td className="p-3 text-right text-base font-bold text-primary-700">{money(parts.reduce((sum, part) => sum + part.quantity * part.price, 0))}</td></tr></tfoot></table></div>}</section>;
}
function Field({ label, required = false, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-700">{label}{required && <span className="text-red-500"> *</span>}<div className="mt-2">{children}</div></label>; }
function EmptyState({ title, description }: { title: string; description: string }) { return <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border bg-white text-center"><h1 className="font-semibold">{title}</h1><p className="text-sm text-gray-500">{description}</p><Button asChild><Link href="/app/asset-management/procurement">Back to Purchase Requests</Link></Button></div>; }
