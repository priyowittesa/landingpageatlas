"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Circle, Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { type ProcurementAttachment, useProcurement, useProcurementAttachments, useProcurementAttachmentUrl, useProcurementDepartments, useProcurementSpareParts } from "../../use-procurements";
import { AttachmentPreviewDialog } from "../../components/attachment-preview-dialog";
import { type ProcurementApproval, useApprovalAction, useProcurementApprovals } from "../use-approval-inbox";

const title = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
function date(value: string) { if (!value) return "-"; const parsed = new Date(value); return Number.isNaN(parsed.getTime()) ? value : new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed); }

type ActionDialog = "approve" | "reject" | null;
type Feedback = { action: "approve" | "reject"; notes: string } | null;

function isPending(status: string) {
  const value = status.toLowerCase();
  return value.includes("pending") || value.includes("awaiting") || value.includes("in_progress");
}

function isApproved(status: string) {
  const value = status.toLowerCase();
  return value.includes("approved") || value.includes("complete");
}

function isRejected(status: string) {
  return status.toLowerCase().includes("reject");
}

export function ApprovalDetail({ id }: { id: string }) {
  const detail = useProcurement(id);
  const parts = useProcurementSpareParts(id);
  const attachments = useProcurementAttachments(id);
  const departments = useProcurementDepartments();
  const approvals = useProcurementApprovals(id);
  const action = useApprovalAction(id);
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const [dialog, setDialog] = useState<ActionDialog>(null);
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    setBreadcrumbs([{ title: "Procurement", href: "/app/asset-management/procurement" }, { title: "Approvals Inbox", href: "/app/asset-management/procurement/approvals-inbox" }, { title: detail.data?.number ?? "Approval Detail" }]);
    return clearBreadcrumbs;
  }, [detail.data?.number, setBreadcrumbs, clearBreadcrumbs]);

  const rows = useMemo(() => parts.data ?? [], [parts.data]);
  const total = rows.reduce((sum, part) => sum + part.total, 0);
  const currentApproval = approvals.data?.find((approval) => approval.isCurrent) ?? approvals.data?.find((approval) => isPending(approval.status));

  const submitAction = () => {
    if (!dialog || !currentApproval) return;
    const cleanNotes = notes.trim();
    if (dialog === "reject" && !cleanNotes) return;
    action.mutate({ approvalId: currentApproval.id, action: dialog, notes: cleanNotes }, {
      onSuccess: () => {
        setFeedback({ action: dialog, notes: cleanNotes });
        toast.success(dialog === "approve" ? "Purchase request approved" : "Purchase request rejected");
        setDialog(null);
        setNotes("");
      },
    });
  };

  if (detail.isLoading || parts.isLoading || approvals.isLoading) return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading approval detail...</div>;
  if (detail.isError || !detail.data) return <State text="Purchase request detail could not be loaded." />;
  const item = detail.data;
  const departmentName = departments.data?.find((department) => department.value === item.departmentId || department.value === item.department)?.label ?? item.department;
  const displayStatus = feedback?.action === "approve" ? "approved" : feedback?.action === "reject" ? "rejected" : item.status;

  return <div className="space-y-5 pb-10">
    <header>
      <div className="flex flex-wrap items-center gap-2"><Link href="/app/asset-management/procurement/approvals-inbox" className="inline-flex items-center gap-2 text-xl font-bold"><ArrowLeft className="h-4 w-4" />PR: {item.number}</Link><StatusBadge status={displayStatus} /></div>
      <p className="mt-1 pl-6 text-xs text-muted-foreground">Inspect requested quantities, workflow routes, and department limits.</p>
    </header>

    {feedback && <div className={`rounded-lg border px-4 py-3 text-sm ${feedback.action === "approve" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
      {feedback.action === "approve" ? `Requisition has been approved. ${item.requesterName} has been notified.` : <>Requisition has been rejected. Returned to draft status.{feedback.notes && <> Reason: <strong>{feedback.notes}</strong></>}</>}
    </div>}
    {approvals.isError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">Approval routing could not be loaded. Approve and reject actions are unavailable.</div>}

    <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-5">
        <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-5 text-sm font-semibold">General Summary</h2><dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2"><Summary label="Requester" value={item.requesterName} /><Summary label="Department" value={departmentName} /><Summary label="Due Date" value={date(item.requiredDeliveryAt)} /><Summary label="Priority" value={`${title(item.priority)} Priority`} accent={item.priority.toLowerCase() === "high" || item.priority.toLowerCase() === "critical"} /><div className="sm:col-span-2"><Summary label="Purpose" value={item.purpose} /></div></dl></section>

        <section className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="w-full min-w-[650px] text-xs"><thead><tr className="border-b bg-gray-50 text-left text-gray-500"><th className="p-3">Part Number</th><th className="p-3">Description</th><th className="p-3 text-right">Qty</th><th className="p-3 text-right">Unit Price</th><th className="p-3 text-right">Total</th></tr></thead><tbody>{rows.map((part) => <tr key={part.id} className="border-b last:border-0"><td className="p-3 font-semibold">{part.number}</td><td className="p-3 text-gray-600">{part.description}</td><td className="p-3 text-right font-semibold">{part.quantity}</td><td className="p-3 text-right">{money(part.price)}</td><td className="p-3 text-right font-semibold">{money(part.total)}</td></tr>)}{rows.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-muted-foreground">No spare parts attached.</td></tr>}</tbody><tfoot><tr className="border-t"><td colSpan={4} className="p-3 text-right font-medium text-muted-foreground">Estimated Total Cost:</td><td className="p-3 text-right text-base font-bold text-primary">{money(total)}</td></tr></tfoot></table></section>

        <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold">Attachments & Notes</h2><div className="mt-4"><div className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase text-muted-foreground"><span>Attachments</span><span>{attachments.data?.length ?? 0} files</span></div>{attachments.isLoading ? <p className="py-4 text-xs text-muted-foreground">Loading attachments...</p> : attachments.data?.length ? <div className="space-y-2">{attachments.data.map((attachment) => <ApprovalAttachment key={attachment.id} attachment={attachment} />)}</div> : <p className="py-3 text-xs text-muted-foreground">No attachments.</p>}</div><div className="mt-5"><p className="text-[10px] font-semibold uppercase text-muted-foreground">Notes</p><p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{item.notes || "-"}</p></div></section>
      </div>

      <aside className="rounded-xl border bg-white p-4 shadow-sm lg:sticky lg:top-5"><h2 className="text-xs font-semibold uppercase text-gray-600">PR Approval Routing</h2><div className="my-4 space-y-3"><RouteStep level={0} title="Requester Draft" subtitle={`Completed by ${item.requesterName}`} status="approved" />{approvals.data?.map((approval) => <ApprovalRouteStep key={approval.id} approval={approval} />)}{approvals.data?.length === 0 && <p className="text-xs text-muted-foreground">No approval levels found.</p>}</div>{currentApproval && !feedback && <div className="space-y-2 border-t pt-4"><Button type="button" className="w-full" onClick={() => { setNotes(""); setDialog("approve"); }}>Approve</Button><Button type="button" variant="outline" className="w-full border-red-400 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => { setNotes(""); setDialog("reject"); }}>Reject</Button></div>}</aside>
    </div>

    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open && !action.isPending) setDialog(null); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{dialog === "approve" ? "Confirm Requisition Approval" : "Reject Purchase Requisition"}</DialogTitle><DialogDescription>{dialog === "approve" ? `You are approving ${item.number} for ${money(total)}. This will advance the request to the next approval checkpoint.` : `This will return ${item.number} to draft status for ${item.requesterName} to revise.`}</DialogDescription></DialogHeader><div><label htmlFor="approval-notes" className="mb-2 block text-sm font-medium">{dialog === "approve" ? "Approval Notes (Optional)" : "Rejection Reason (Required)"}</label><Textarea id="approval-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder={dialog === "approve" ? "Add any feedback or authorization notes..." : "Explain why this request is being rejected..."} className="min-h-24 resize-none" aria-invalid={dialog === "reject" && notes.length > 0 && !notes.trim()} /></div><DialogFooter><Button type="button" variant="outline" disabled={action.isPending} onClick={() => setDialog(null)}>Cancel</Button><Button type="button" variant={dialog === "reject" ? "destructive" : "default"} disabled={action.isPending || (dialog === "reject" && !notes.trim())} onClick={submitAction}>{action.isPending && <Loader2 className="h-4 w-4 animate-spin" />}{dialog === "approve" ? "Confirm & Approve" : "Confirm Rejection"}</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

function StatusBadge({ status }: { status: string }) { const value = status.toLowerCase(); const style = value.includes("reject") ? "bg-red-50 text-red-700" : value.includes("approv") && !value.includes("pending") ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"; return <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${style}`}>{title(status)}</span>; }
function Summary({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) { return <div><dt className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</dt><dd className={`mt-1 text-sm ${accent ? "font-semibold text-red-500" : "text-gray-800"}`}>{value || "-"}</dd></div>; }
function RouteStep({ level, title: stepTitle, subtitle, status }: { level: number; title: string; subtitle: string; status: string }) { const complete = isApproved(status); const rejected = isRejected(status); const active = isPending(status); return <div className="flex gap-2"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] ${complete ? "bg-violet-500 text-white" : rejected ? "bg-red-500 text-white" : active ? "bg-primary text-primary-foreground" : "border text-gray-400"}`}>{complete ? <Check className="h-3 w-3" /> : active ? <Circle className="h-2 w-2 fill-current" /> : level + 1}</span><div><p className="text-xs font-semibold">{level + 1}. {stepTitle}</p><p className={`text-[10px] ${rejected ? "text-red-600" : "text-muted-foreground"}`}>{subtitle}</p></div></div>; }
function ApprovalRouteStep({ approval }: { approval: ProcurementApproval }) { const status = approval.status.toLowerCase(); const statusText = isApproved(status) ? `Approved by ${approval.approverName}` : isRejected(status) ? `Rejected by ${approval.approverName}` : isPending(status) ? `Pending - ${approval.approverName}` : `Waiting - ${approval.approverName}`; return <RouteStep level={approval.levelNo} title={approval.title} subtitle={statusText} status={status} />; }
function ApprovalAttachment({ attachment }: { attachment: ProcurementAttachment }) { const [open, setOpen] = useState(false); const preview = useProcurementAttachmentUrl(attachment.id, open); return <><button type="button" onClick={() => setOpen(true)} className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-50 p-3 text-left hover:bg-gray-100"><div className="flex min-w-0 items-center gap-3"><span className="rounded bg-white p-2"><FileText className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate text-xs font-medium">{attachment.name}</p>{attachment.size > 0 && <p className="text-[10px] text-muted-foreground">{(attachment.size / 1024).toFixed(1)} KB</p>}</div></div><Eye className="h-4 w-4 text-muted-foreground" /></button><AttachmentPreviewDialog open={open} onOpenChange={setOpen} name={attachment.name} url={preview.data} loading={preview.isLoading} error={preview.isError} /></>; }
function State({ text }: { text: string }) { return <div className="flex min-h-80 flex-col items-center justify-center gap-3 rounded-xl border bg-white"><p className="text-sm text-muted-foreground">{text}</p><Button asChild><Link href="/app/asset-management/procurement/approvals-inbox">Back to Approvals Inbox</Link></Button></div>; }
