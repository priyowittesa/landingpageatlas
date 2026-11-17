"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import ConfirmationModal from "@/components/ConfirmationModal";
import {
  getWorkOrderSourceHref,
  isWorkOrderTerminal,
  useChangeWorkOrderStatus,
  useWorkOrder
} from "../use-work-orders";
import { WorkOrderAssignment } from "./work-order-assignment";
import { WorkOrderSpareParts } from "./work-order-spare-parts";
import { ExecutionRecordDialog } from "./execution-record-dialog";
import { WorkOrderAttachments } from "./work-order-attachments";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";

const date = (value: string) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(parsed);
};
const duration = (start: string, end: string) => {
  const from = new Date(start).getTime(),
    to = new Date(end).getTime();
  if (!start || !end || Number.isNaN(from) || Number.isNaN(to) || to < from)
    return "-";
  const minutes = Math.floor((to - from) / 60_000);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};
const statusLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
export function WorkOrderDetail({ id }: { id: string }) {
  const query = useWorkOrder(id);
  const changeStatus = useChangeWorkOrderStatus(id);
  const [statusAction, setStatusAction] = useState<
    "cancelled" | "completed" | null
  >(null);
  const [editExecution, setEditExecution] = useState(false);
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const workOrderNumber = query.data?.number;
  useEffect(() => {
    setBreadcrumbs([
      { title: "Work Orders", href: "/app/asset-management/work-orders" },
      { title: workOrderNumber || "Work Order Detail" }
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs, workOrderNumber]);
  if (query.isLoading)
    return (
      <div className="py-20 text-center text-sm text-gray-500">
        Loading work order...
      </div>
    );
  if (query.isError || !query.data)
    return (
      <div className="py-20 text-center text-sm text-red-600">
        Unable to load work order.
      </div>
    );
  const item = query.data;
  const terminal = isWorkOrderTerminal(item);
  return (
    <div className="space-y-5 pb-8">
      <header className="flex items-start justify-between">
        <div>
          <Link
            href="/app/asset-management/work-orders"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <ArrowLeft className="h-5 w-5" />
            {item.number}
          </Link>
          <p className="mt-1 text-xs text-gray-500">{item.title}</p>
        </div>
        {!terminal && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={changeStatus.isPending}
              onClick={() => setStatusAction("cancelled")}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Cancel Order
            </Button>
            <Button
              disabled={changeStatus.isPending}
              onClick={() => setStatusAction("completed")}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Complete Work
            </Button>
          </div>
        )}
      </header>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Work Order Info">
          <dl className="divide-y text-xs">
            <Row label="Type" value={item.type} />
            <Row label="Asset" value={`${item.assetCode} ${item.assetName}`} />
            <Row label="Priority" value={item.priority} />
            <Row label="Status" value={statusLabel(item.status)} />
            <Row label="Created By" value={item.createdBy} />
            <Row label="Created Date" value={date(item.createdAt)} />
            <Row label="Target Date" value={date(item.estimatedReturnAt)} />
            <SourceDocumentRow type={item.sourceType} id={item.sourceId} />
          </dl>
        </Card>
        <WorkOrderAssignment workOrderId={id} readOnly={terminal} />
      </div>
      <Card title="Execution Record">
        <div className="grid gap-5 sm:grid-cols-2">
          <Read label="Problem Found" value={item.problemFound} />
          <Read label="Root Cause" value={item.rootCause} />
          <Read label="Action Taken" value={item.actionTaken} />
          <Read label="Recommendation" value={item.recommendation} />
          <Read label="Start Time" value={date(item.executionStartedAt)} />
          <Read label="End Time" value={date(item.executionEndedAt)} />
          <Read
            label="Duration (Computed)"
            value={duration(item.executionStartedAt, item.executionEndedAt)}
          />
        </div>
        <div className="mt-5">
          <Read label="Result" value={item.result} />
        </div>
        {!terminal && (
          <div className="mt-5 flex justify-end">
            <Button onClick={() => setEditExecution(true)}>Edit</Button>
          </div>
        )}
      </Card>
      <WorkOrderSpareParts workOrderId={id} readOnly={terminal} />
      <WorkOrderAttachments
        workOrderId={id}
        attachments={item.attachments}
        readOnly={terminal}
      />
      <ExecutionRecordDialog
        open={editExecution}
        item={item}
        onOpenChange={setEditExecution}
      />
      <ConfirmationModal
        open={Boolean(statusAction)}
        onOpenChange={(open) => {
          if (!open && !changeStatus.isPending) setStatusAction(null);
        }}
        variant={statusAction === "completed" ? "submit" : "delete"}
        title={
          statusAction === "completed"
            ? "Complete work order?"
            : "Cancel work order?"
        }
        description={
          statusAction === "completed"
            ? "Mark this work order as completed?"
            : "Mark this work order as cancelled? This action cannot be undone."
        }
        confirmLabel={
          statusAction === "completed" ? "Complete Work" : "Cancel Order"
        }
        isLoading={changeStatus.isPending}
        onConfirm={() => {
          if (!statusAction) return;
          changeStatus.mutate(statusAction, {
            onSuccess: () => setStatusAction(null)
          });
        }}
      />
    </div>
  );
}

function Card({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <ClipboardList className="h-4 w-4" />
        {title}
      </h2>
      {children}
    </section>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold capitalize">{value || "-"}</dd>
    </div>
  );
}
function SourceDocumentRow({ type, id }: { type: string; id: string }) {
  const href = getWorkOrderSourceHref(type, id);
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-gray-500">Source Document</dt>
      <dd className="text-right">
        {href ? (
          <Button asChild variant="outline" size="sm">
            <Link target="_blank" href={href}>
              <span className="capitalize">
                View {type.replaceAll("_", " ")}
              </span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        ) : (
          <span className="font-semibold capitalize">
            {type && type !== "-" ? type.replaceAll("_", " ") : "-"}
          </span>
        )}
      </dd>
    </div>
  );
}
function Read({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 whitespace-pre-wrap rounded-lg border bg-gray-50 p-3 text-sm">
        {value || "-"}
      </p>
    </div>
  );
}
