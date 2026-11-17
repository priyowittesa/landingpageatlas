"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, Clock3, ExternalLink, ReceiptText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import { getWorkOrderSourceHref, useWorkOrder, useWorkOrderSpareParts } from "../../work-orders/use-work-orders";
import { WorkOrderAssignment } from "../../work-orders/[id]/work-order-assignment";
import { WorkOrderSpareParts } from "../../work-orders/[id]/work-order-spare-parts";
import { useWorkOrderCost, useWorkOrderCostAudits, type WorkOrderCostAuditLog } from "../use-work-order-costs";

const date = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(parsed);
};
const auditDate = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startDate = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
  const days = Math.round((startToday.getTime() - startDate.getTime()) / 86_400_000);
  const time = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(parsed);
  if (days === 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: parsed.getFullYear() === now.getFullYear() ? undefined : "numeric", hour: "numeric", minute: "2-digit" }).format(parsed);
};
const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
const money = (value: number, currency = "USD") => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(value || 0);

export function WorkOrderCostDetailPage({ id }: { id: string }) {
  const [auditOpen, setAuditOpen] = useState(false);
  const cost = useWorkOrderCost(id);
  const audits = useWorkOrderCostAudits(id);
  const workOrderId = cost.data?.workOrderId ?? "";
  const workOrder = useWorkOrder(workOrderId);
  const spareParts = useWorkOrderSpareParts(workOrderId);
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const number = cost.data?.workOrderNumber;

  useEffect(() => {
    setBreadcrumbs([
      { title: "Work Order Costs", href: "/app/asset-management/work-order-costs" },
      { title: number || "Cost Detail" },
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs, number]);

  if (cost.isLoading) return <div className="py-20 text-center text-sm text-muted-foreground">Loading work order cost...</div>;
  if (cost.isError || !cost.data) return <div className="py-20 text-center text-sm text-red-600">Unable to load work order cost.</div>;

  const item = cost.data;
  const order = workOrder.data;
  const parts = spareParts.data ?? [];
  const partsSubtotal = item.partsSubtotal || parts.reduce((sum, part) => sum + part.total, 0);

  return <div className="space-y-5 pb-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <Link href="/app/asset-management/work-order-costs" className="flex items-center gap-2 text-xl font-bold hover:text-primary-700">
        <ArrowLeft className="h-5 w-5" />{item.workOrderNumber}
      </Link>
      <Button variant="outline" size="sm" onClick={() => { setAuditOpen(true); void audits.refetch(); }}><Clock3 className="h-4 w-4" />Audit Log</Button>
    </header>

    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Work Order Info">
        {workOrder.isLoading ? <State text="Loading work order info..." /> : <dl className="divide-y text-xs">
          <Row label="Type" value={titleCase(order?.type || item.type)} />
          <Row label="Asset" value={order ? `${order.assetCode} - ${order.assetName}` : item.asset} />
          <Row label="Priority" value={titleCase(order?.priority || "-")} />
          <Row label="Status" value={titleCase(order?.status || "-")} />
          <Row label="Created By" value={order?.createdBy || item.createdBy} />
          <Row label="Created Date" value={date(order?.createdAt || item.createdAt)} />
          <Row label="Target Date" value={date(order?.estimatedReturnAt || "")} />
          <SourceDocumentRow type={order?.sourceType || item.type} id={order?.sourceId || ""} />
        </dl>}
      </Card>
      {workOrderId ? <WorkOrderAssignment workOrderId={workOrderId} /> : <Card title="Assignment"><State text="Work order is not available." /></Card>}
    </div>

    {workOrderId ? <WorkOrderSpareParts workOrderId={workOrderId} /> : null}

    <CostLedgerSummary
      totalItems={parts.length}
      partsSubtotal={partsSubtotal}
      laborServiceFee={item.totalCost}
      currency={item.currency}
    />

    <AuditLogDrawer
      open={auditOpen}
      onClose={() => setAuditOpen(false)}
      logs={audits.data ?? []}
      isLoading={audits.isLoading}
      isError={audits.isError}
      onRetry={() => audits.refetch()}
    />
  </div>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="rounded-xl border bg-white p-5 shadow-sm"><h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><ClipboardList className="h-4 w-4" />{title}</h2>{children}</section>;
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4 py-3"><dt className="text-gray-500">{label}</dt><dd className="text-right font-semibold">{value || "-"}</dd></div>;
}

function SourceDocumentRow({ type, id }: { type: string; id: string }) {
  const href = getWorkOrderSourceHref(type, id);
  const label = type && type !== "-" ? titleCase(type) : "-";
  return <div className="flex items-center justify-between gap-4 py-3"><dt className="text-gray-500">Source Document</dt><dd className="text-right">{href ? <Button asChild variant="outline" size="sm"><Link href={href}>View {label}<ExternalLink className="h-3.5 w-3.5" /></Link></Button> : <span className="font-semibold">{label}</span>}</dd></div>;
}

function State({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-muted-foreground">{text}</p>;
}

function CostLedgerSummary({ totalItems, partsSubtotal, laborServiceFee, currency }: { totalItems: number; partsSubtotal: number; laborServiceFee: number; currency: string }) {
  const grandTotal = partsSubtotal + laborServiceFee;
  return <section className="rounded-xl border bg-white p-5 shadow-sm">
    <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold"><ReceiptText className="h-4 w-4" />Cost Ledger Summary</h2>
    <dl className="text-xs">
      <SummaryRow label="Total Items" value={`${totalItems} ${totalItems === 1 ? "item" : "items"}`} />
      <SummaryRow label="Parts Subtotal (Qty × Unit Cost)" value={money(partsSubtotal, currency)} />
      <SummaryRow label="Labor & Service Fee" value={money(laborServiceFee, currency)} divider />
      <SummaryRow label="Grand Total Work Order Cost" value={money(grandTotal, currency)} strong />
    </dl>
  </section>;
}

function SummaryRow({ label, value, divider = false, strong = false }: { label: string; value: string; divider?: boolean; strong?: boolean }) {
  return <div className={`flex justify-between gap-4 py-2.5 ${divider ? "border-b" : ""} ${strong ? "mt-1 text-sm font-bold" : ""}`}><dt className={strong ? "" : "text-gray-500"}>{label}</dt><dd>{value}</dd></div>;
}

function AuditLogDrawer({ open, onClose, logs, isLoading, isError, onRetry }: { open: boolean; onClose: () => void; logs: WorkOrderCostAuditLog[]; isLoading: boolean; isError: boolean; onRetry: () => void }) {
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  if (!open) return null;
  return <div className="fixed inset-0 z-50 flex justify-end bg-black/35" onMouseDown={onClose}>
    <aside className="h-full w-full max-w-md overflow-y-auto bg-white shadow-2xl" onMouseDown={(event) => event.stopPropagation()} aria-label="Audit Log">
      <header className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4"><h2 className="flex items-center gap-2 text-sm font-semibold"><Clock3 className="h-4 w-4" />Audit Log</h2><button type="button" onClick={onClose} className="rounded-md p-1.5 hover:bg-gray-100" aria-label="Close audit log"><X className="h-4 w-4" /></button></header>
      <div className="p-5">{isLoading ? <State text="Loading audit log..." /> : isError ? <div className="py-8 text-center"><p className="text-sm text-red-600">Unable to load audit log.</p><Button className="mt-3" variant="outline" size="sm" onClick={onRetry}>Try Again</Button></div> : logs.length === 0 ? <State text="No audit log available." /> : <div className="space-y-4">{logs.map((log) => <article key={log.id} className="relative border-l border-gray-200 pb-1 pl-5"><span className={`absolute -left-2.5 top-0 h-5 w-5 rounded-full ring-4 ring-white ${log.removed ? "bg-red-500" : log.updated ? "bg-gray-950" : "bg-emerald-500"}`} /><h3 className="text-sm font-semibold text-gray-900">{log.title}</h3><p className="mt-1 text-sm text-gray-500">{log.verb} <strong className="font-semibold text-gray-900">&quot;{log.itemName}&quot;</strong></p>{log.details.length ? <div className="mt-2 rounded-md bg-gray-50 px-2.5 py-2 text-xs text-gray-500">{log.details.map((detail) => <p key={detail}>{detail}</p>)}</div> : null}{log.actor ? <p className="mt-2 text-xs text-gray-800">{log.actor}</p> : null}<time className="mt-1 block text-xs text-gray-400">{auditDate(log.createdAt)}</time></article>)}</div>}</div>
    </aside>
  </div>;
}
