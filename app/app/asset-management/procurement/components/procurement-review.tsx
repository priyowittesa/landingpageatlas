"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Circle, ExternalLink, Eye, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { type ProcurementAttachment, useProcurement, useProcurementAttachments, useProcurementAttachmentUrl, useProcurementDepartments, useProcurementSpareParts, useSubmitProcurement } from "../use-procurements";
import { type ProcurementApproval, useProcurementApprovals } from "../approvals-inbox/use-approval-inbox";
import { AttachmentPreviewDialog } from "./attachment-preview-dialog";

const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value: number) => new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
function date(value: string) { if (!value) return "-"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(parsed); }

export function ProcurementReview({ id }: { id: string }) {
  const detail = useProcurement(id);
  const parts = useProcurementSpareParts(id);
  const attachments = useProcurementAttachments(id);
  const departments = useProcurementDepartments();
  const approvals = useProcurementApprovals(id);
  const submitApproval = useSubmitProcurement(id);
  const [submitOpen, setSubmitOpen] = useState(false);
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  useEffect(() => { setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "Review PR" }]); return clearBreadcrumbs; }, [setBreadcrumbs, clearBreadcrumbs]);
  if (detail.isLoading || parts.isLoading) return <div className="py-24 text-center text-sm text-gray-500">Loading purchase request...</div>;
  if (detail.isError || !detail.data) return <State text="Purchase request could not be loaded." />;
  const item = detail.data;
  const rows = parts.data ?? [];
  const total = rows.reduce((sum, part) => sum + part.total, 0);
  const draft = item.status.toLowerCase() === "draft";
  const approvalRows = approvals.data ?? [];
  const activeApprovalId = approvalRows.find((approval) => approval.isCurrent)?.id ?? approvalRows.find((approval) => approval.status.includes("pending") || approval.status.includes("awaiting"))?.id;
  const departmentName = departments.data?.find((department) => department.value === item.departmentId || department.value === item.department)?.label ?? item.department;

  return <div className="space-y-5 pb-10">
    <header><Link href="/app/asset-management/procurement" className="inline-flex items-center gap-2 text-lg font-semibold"><ArrowLeft className="h-4 w-4" />Review PR: {item.number}</Link><p className="mt-1 text-xs text-gray-500">Inspect requested quantities, workflow routes, and department limits.</p></header>
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="space-y-5">
        <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-5 text-sm font-semibold">General Summary</h2><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2"><Summary label="Requester" value={`${item.requesterName}${departmentName && departmentName !== "-" ? ` (${departmentName})` : ""}`} /><div><dt className="text-[10px] font-semibold uppercase text-gray-500">Linked Work Order</dt><dd className="mt-1">{item.sourceId ? <Button asChild variant="outline" size="sm"><Link href={`/app/asset-management/work-orders/${encodeURIComponent(item.sourceId)}`}>View Work Order<ExternalLink className="h-3.5 w-3.5" /></Link></Button> : <span className="text-sm text-gray-500">Not linked</span>}</dd></div><Summary label="Due Date" value={date(item.requiredDeliveryAt)} /><Summary label="Priority" value={`${title(item.priority)} Priority`} accent /><div className="sm:col-span-2"><Summary label="Purpose" value={item.purpose} /></div></dl></section>
        <section className="overflow-hidden rounded-xl border bg-white shadow-sm"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-3">Part Number</th><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{rows.map((part) => <tr key={part.id} className="border-b last:border-0"><td className="p-3 font-semibold">{part.number}</td><td className="p-3 text-gray-600">{part.description}</td><td className="p-3 text-right">{part.quantity}</td><td className="p-3 text-right">{money(part.price)}</td><td className="p-3 text-right font-semibold">{money(part.total)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-gray-500">No spare parts attached.</td></tr>}</tbody><tfoot><tr className="border-t"><td colSpan={4} className="p-3 text-right text-gray-500">Estimated Total Cost:</td><td className="p-3 text-right text-base font-bold text-primary-700">{money(total)}</td></tr></tfoot></table></section>
        <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Attachments & Notes</h2><div className="mt-4"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase text-gray-500"><span>Attachments</span><span>{attachments.data?.length ?? 0} files</span></div>{attachments.isLoading ? <p className="py-4 text-xs text-gray-500">Loading attachments...</p> : attachments.data?.length ? <div className="space-y-2">{attachments.data.map((attachment) => <ReviewAttachment key={attachment.id} attachment={attachment} />)}</div> : <p className="py-3 text-xs text-gray-500">No attachments.</p>}</div><div className="mt-5"><p className="text-[10px] font-semibold uppercase text-gray-500">Notes</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{item.notes || "-"}</p></div></section>
      </div>
      <aside className="sticky top-5 rounded-xl border bg-white p-4 shadow-sm"><h2 className="text-xs font-semibold uppercase text-gray-600">Approval Routing</h2><div className="my-4 space-y-3"><RouteStep complete title="1. Requester Draft" subtitle={`Completed by ${item.requesterName}`} />{approvals.isLoading ? <p className="py-2 text-xs text-gray-500">Loading approval routing...</p> : approvals.isError ? <p className="py-2 text-xs text-red-600">Approval routing could not be loaded.</p> : approvalRows.length ? approvalRows.map((approval) => <ApprovalRouteStep key={approval.id} approval={approval} active={approval.id === activeApprovalId} />) : !draft ? <p className="py-2 text-xs text-gray-500">No approval levels found.</p> : null}</div>{draft && <div className="space-y-2"><Button type="button" className="w-full" disabled={submitApproval.isPending} onClick={() => setSubmitOpen(true)}>Submit for Approval</Button><Button asChild variant="outline" className="w-full"><Link href={`/app/asset-management/procurement/${encodeURIComponent(id)}/edit`}>Edit Draft</Link></Button></div>}</aside>
    </div>
    <ConfirmationModal open={submitOpen} onOpenChange={(open) => { if (!open && !submitApproval.isPending) setSubmitOpen(false); }} title="Submit purchase request?" description={`Submit ${item.number} for approval? The draft will no longer be editable.`} confirmLabel="Submit for Approval" variant="submit" isLoading={submitApproval.isPending} onConfirm={() => submitApproval.mutate(undefined, { onSuccess: () => setSubmitOpen(false) })} />
  </div>;
}

function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div><dt className="text-[10px] font-semibold uppercase text-gray-500">{label}</dt><dd className={`mt-1 text-sm ${accent ? "font-semibold text-red-500" : "text-gray-800"}`}>{value || "-"}</dd></div>; }
function ApprovalRouteStep({ approval, active }: { approval: ProcurementApproval; active: boolean }) { const status = approval.status.toLowerCase(); const complete = status.includes("approved") || status.includes("complete"); const rejected = status.includes("reject"); const subtitle = complete ? `Completed by ${approval.approverName}` : rejected ? `Rejected by ${approval.approverName}` : active ? `Pending - ${approval.approverName}` : "Waiting Step"; return <RouteStep complete={complete} active={active || rejected} title={`${approval.levelNo + 1}. ${approval.title}`} subtitle={subtitle} />; }
function RouteStep({ title, subtitle, complete = false, active = false }: { title: string; subtitle: string; complete?: boolean; active?: boolean }) { return <div className="flex gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${complete || active ? "bg-primary-700 text-white" : "border text-gray-400"}`}>{complete ? <Check className="h-3 w-3" /> : active ? <Circle className="h-2 w-2 fill-current" /> : <span className="text-[9px]">•</span>}</span><div><p className="text-xs font-semibold">{title}</p><p className="text-[10px] text-gray-500">{subtitle}</p></div></div>; }
function ReviewAttachment({ attachment }: { attachment: ProcurementAttachment }) { const [open, setOpen] = useState(false); const preview = useProcurementAttachmentUrl(attachment.id, open); return <><button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100"><div className="flex min-w-0 items-center gap-3"><FileText className="h-4 w-4 shrink-0" /><div className="min-w-0"><p className="truncate text-xs font-medium">{attachment.name}</p>{attachment.size > 0 && <p className="text-[10px] text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>}</div></div><Eye className="h-4 w-4 shrink-0 text-gray-500" /></button><AttachmentPreviewDialog open={open} onOpenChange={setOpen} name={attachment.name} url={preview.data} loading={preview.isLoading} error={preview.isError} /></>; }
function State({ text }: { text: string }) { return <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border bg-white"><p className="text-sm text-gray-500">{text}</p><Button asChild><Link href="/app/asset-management/procurement">Back to Purchase Requests</Link></Button></div>; }
