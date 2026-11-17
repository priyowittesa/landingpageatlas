"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkOrders } from "../../work-orders/use-work-orders";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function CreatePurchaseRequestDialog({ open, onOpenChange }: Props) {
  const router = useRouter();
  const workOrders = useWorkOrders({ page_size: 100 });
  const [workOrderId, setWorkOrderId] = useState("");
  const [mode, setMode] = useState<"work_order" | "manual">("work_order");
  const orders = useMemo(
    () => (workOrders.data?.items ?? []).filter((item) => {
      const status = item.status.toLowerCase().replaceAll("_", "").replaceAll("-", "").replaceAll(" ", "");
      return status === "notyet";
    }),
    [workOrders.data?.items],
  );
  const close = () => { setWorkOrderId(""); setMode("work_order"); onOpenChange(false); };
  const continueToForm = () => {
    if (mode === "work_order" && !workOrderId) return;
    onOpenChange(false);
    router.push(mode === "manual" ? "/app/asset-management/procurement/create?source_type=manual" : `/app/asset-management/procurement/create?work_order_id=${encodeURIComponent(workOrderId)}`);
  };

  return <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}>
    <DialogContent className="sm:max-w-xl">
      <DialogHeader><DialogTitle>Create Purchase Request</DialogTitle><DialogDescription>Choose how you want to initiate this procurement cycle.</DialogDescription></DialogHeader>
      <div className="space-y-3">
        <button type="button" onClick={() => setMode("work_order")} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${mode === "work_order" ? "border-primary-300 bg-primary-50" : "hover:bg-gray-50"}`}><ClipboardList className="mt-0.5 h-5 w-5 text-primary-700" /><div><p className="font-semibold text-primary-900">Create PR from Work Order</p><p className="text-xs text-gray-500">Pull predefined spare parts and asset context from an active Work Order.</p></div></button>
        <button type="button" onClick={() => setMode("manual")} className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left ${mode === "manual" ? "border-primary-300 bg-primary-50" : "hover:bg-gray-50"}`}><FilePlus2 className="mt-0.5 h-5 w-5 text-primary-700" /><div><p className="font-semibold text-primary-900">Standalone Requisition</p><p className="text-xs text-gray-500">Manually select spare parts for general replenishment or ad-hoc operations.</p></div></button>
        {mode === "work_order" && <div className="rounded-xl border p-4"><label className="block text-xs font-medium text-gray-700">Work Order <span className="text-red-500">*</span><div className="mt-2"><Select value={workOrderId} onValueChange={setWorkOrderId} disabled={workOrders.isLoading || workOrders.isError}><SelectTrigger><SelectValue placeholder={workOrders.isLoading ? "Loading work orders..." : "Select active work order"} /></SelectTrigger><SelectContent>{orders.map((order) => <SelectItem key={order.id} value={order.id}>{order.number} - {order.title || order.assetName}</SelectItem>)}</SelectContent></Select></div></label>{workOrders.isError && <p className="mt-2 text-xs text-red-600">Work orders could not be loaded.</p>}{!workOrders.isLoading && !workOrders.isError && orders.length === 0 && <p className="mt-2 text-xs text-gray-500">No active work orders are available.</p>}</div>}
      </div>
      <DialogFooter><Button type="button" variant="outline" onClick={close}>Cancel</Button><Button type="button" disabled={mode === "work_order" && !workOrderId} onClick={continueToForm}>Continue with Selection</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
}
