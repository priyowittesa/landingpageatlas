"use client";

import { useState } from "react";
import type { TableColumn } from "@/types/type";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import Table from "@/components/Table";
import type { BridgingCase, Overtime, Params } from "../api-types";
import { capacityError, capacityGet, capacityWrite, formatNumber } from "../api";
import { ApiTable } from "./ApiTable";
import { ApiState, CapacityValue, StatusBadge } from "./ApiState";
import { useCapacityAccess, useCapacityMutation, useCapacityQuery } from "../use-capacity";
import { OvertimeForm } from "../contingency-plan/components/ContingencyForms";
import { selectClass } from "./CapacityFilters";

export const bridgingStatuses = [
  { label: "Pending Review", value: "pending_review" }, { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" }, { label: "Cancelled", value: "cancelled" },
];
export const bridgingColumns: TableColumn<BridgingCase>[] = [
  { key: "code", header: "Bridging ID" },
  { key: "source_line_code", header: "Source Line" },
  { key: "target_line_code", header: "Target Line" },
  { key: "part_number", header: "Part Number" },
  { key: "qty", header: "Qty Moved", render: (row) => formatNumber(row.qty, " pcs") },
  { key: "before_cap_pct", header: "Before Cap %", render: (row) => <CapacityValue value={row.before_cap_pct} status={row.before_status} /> },
  { key: "after_cap_pct", header: "After Cap %", render: (row) => <CapacityValue value={row.after_cap_pct} status={row.after_status} /> },
  { key: "created_at", header: "Created Date", render: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : "-" },
  { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
];
export const overtimeColumns: TableColumn<Overtime>[] = [
  { key: "code", header: "Overtime ID" },
  { key: "line", header: "Line", render: (row) => row.line_code || row.line?.line_code || row.production_line_id },
  { key: "shift_type", header: "Shift Type" },
  { key: "work_date", header: "Date" },
  { key: "hours", header: "Hours" },
  { key: "workers", header: "Workers" },
  { key: "reason", header: "Reason" },
];
export function ManagementTables({ params }: { params?: Params }) {
  return <>
    <AdditionalWorkingDaysTable params={params} />
    <OvertimeTable params={{ year: params?.year, month: params?.month, production_line_id: params?.["filter.line_id"] }} />
    <BridgingTable params={{ year: params?.year, month: params?.month, line_id: params?.["filter.line_id"] }} />
  </>;
}

type AdditionalDays = { line: { line_id: string; line_code: string }; add_days?: number; activities?: string[]; overtime_hours?: number; absorbed_loading_pct?: number };
export function AdditionalWorkingDaysTable({ params }: { params?: Params }) {
  const query = useCapacityQuery<{ items?: AdditionalDays[] }>("/overtime-logs/additional-working-days", params);
  return <section className="space-y-3 rounded-xl border bg-background p-5">
    <h2 className="text-lg font-semibold">Additional Working Days</h2>
    <ApiState query={query} />
    <Table<AdditionalDays> data={query.data?.items ?? []} getRowId={(row) => row.line.line_id} columns={[
        { key: "line", header: "Line", render: (row) => row.line.line_code },
        { key: "add_days", header: "Add. Days", render: (row) => row.add_days == null ? "-" : `+${formatNumber(row.add_days)} Days` },
        { key: "activities", header: "Temp Activity", render: (row) => row.activities?.join(", ") || "-" },
        { key: "overtime_hours", header: "Overtime Hours", render: (row) => formatNumber(row.overtime_hours) },
        { key: "absorbed_loading_pct", header: "Absorbed Loading", render: (row) => formatNumber(row.absorbed_loading_pct, "%") },
    ]} emptyState={{ description: query.isPending ? "Loading..." : query.error ? "Unable to load working days." : "No additional working days for this period." }} />
  </section>;
}

export function OvertimeTable({ params }: { params?: Params }) {
  const { canManage } = useCapacityAccess();
  const [editing, setEditing] = useState<Overtime | "new" | null>(null);
  const [deleting, setDeleting] = useState<Overtime | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const remove = useCapacityMutation((id: string) => capacityWrite(`/overtime-logs/${encodeURIComponent(id)}`, undefined, "DELETE"));
  return <>
    <ApiTable<Overtime> title="Overtime Management" path="/overtime-logs" params={params} getRowId={(row) => row.id}
      toolbarActions={canManage && <Button onClick={() => setEditing("new")}>Add Overtime</Button>}
      columns={[...overtimeColumns, { key: "actions", header: "Actions", render: (row) => canManage && <div className="flex gap-2">
        <Button variant="ghost" disabled={loading} onClick={async () => {
          setLoading(true); setLoadError("");
          try { setEditing(await capacityGet<Overtime>(`/overtime-logs/${encodeURIComponent(row.id)}`)); }
          catch (error) { setLoadError(capacityError(error)); }
          finally { setLoading(false); }
        }}>Edit</Button>
        <Button variant="ghost" onClick={() => setDeleting(row)}>Delete</Button>
      </div> }]} />
    {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
    {editing && <OvertimeForm key={editing === "new" ? "new" : editing.id} record={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    <ConfirmationModal open={!!deleting} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}
      title="Delete Overtime?" description="This permanently removes the overtime log and recalculates the affected capacity." confirmLabel="Delete" isLoading={remove.isPending}
      onConfirm={async () => { if (deleting) { try { await remove.mutateAsync(deleting.id); setDeleting(null); } catch { /* Keep confirmation open. */ } } }} />
    {remove.error && <p role="alert" className="text-sm text-destructive">{capacityError(remove.error)}</p>}
  </>;
}

export function BridgingTable({ params, title = "Bridging History (Line Workload Reallocation)" }: { params?: Params; title?: string }) {
  const { canManage } = useCapacityAccess();
  const [selected, setSelected] = useState<{ record: BridgingCase; action: "approve" | "reject" | "cancel" } | null>(null);
  return <>
    <ApiTable<BridgingCase> title={title} path="/bridging-cases" params={params} getRowId={(row) => row.id} statusOptions={bridgingStatuses}
      columns={[...bridgingColumns, { key: "actions", header: "Actions", render: (row) => canManage && <div className="flex gap-2">
        {row.status === "BRIDGING_STATUS_PENDING_REVIEW" && <>
          <Button variant="ghost" onClick={() => setSelected({ record: row, action: "approve" })}>Approve</Button>
          <Button variant="ghost" onClick={() => setSelected({ record: row, action: "reject" })}>Reject</Button>
        </>}
        {["BRIDGING_STATUS_PENDING_REVIEW", "BRIDGING_STATUS_APPROVED"].includes(row.status) && <Button variant="ghost" onClick={() => setSelected({ record: row, action: "cancel" })}>Cancel</Button>}
      </div> }]} />
    {selected && <BridgingDecision key={`${selected.record.id}:${selected.action}`} {...selected} onClose={() => setSelected(null)} />}
  </>;
}

function BridgingDecision({ record, action, onClose }: { record: BridgingCase; action: "approve" | "reject" | "cancel"; onClose: () => void }) {
  const [note, setNote] = useState("");
  const label = action === "approve" ? "Approve" : action === "reject" ? "Reject" : "Cancel";
  const save = useCapacityMutation(() => capacityWrite(`/bridging-cases/${encodeURIComponent(record.id)}/${action === "cancel" ? "cancel" : "review"}`,
    action === "cancel" ? undefined : { approve: action === "approve", note }));
  return <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
    <DialogContent><DialogHeader><DialogTitle>{label} Bridging {record.code}?</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">{action === "approve" ? "Approval applies this workload transfer to capacity calculations." : action === "cancel" ? "Cancellation removes this transfer from capacity calculations." : "Reject this pending workload transfer."}</p>
      {action !== "cancel" && <label className="text-sm">Review Note<textarea aria-label="Review Note" className={`${selectClass} h-24 py-2`} value={note} disabled={save.isPending} onChange={(e) => setNote(e.target.value)} /></label>}
      {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
      <div className="flex justify-end gap-3">
        <Button variant="outline" disabled={save.isPending} onClick={onClose}>Back</Button>
        <Button disabled={save.isPending || !save.canManage} onClick={async () => { try { await save.mutateAsync(); onClose(); } catch { /* Render API error. */ } }}>Confirm {label}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
