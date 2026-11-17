"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import type { ActivityPlan, MasterRecord } from "../api-types";
import { capacityError, capacityGet, capacityWrite } from "../api";
import { useCapacityAccess, useCapacityMutation, useCapacityOptions } from "../use-capacity";
import { ApiTable } from "./ApiTable";
import { ApiState, StatusBadge } from "./ApiState";
import { MasterSelect, selectClass } from "./CapacityFilters";

const statuses = [
  { label: "Pending", value: "ACTIVITY_PLAN_STATUS_PENDING" },
  { label: "In Progress", value: "ACTIVITY_PLAN_STATUS_IN_PROGRESS" },
  { label: "Completed", value: "ACTIVITY_PLAN_STATUS_COMPLETED" },
];

export function ActivityPlans() {
  const { canManage } = useCapacityAccess();
  const [editing, setEditing] = useState<ActivityPlan | "new" | null>(null);
  const [deleting, setDeleting] = useState<ActivityPlan | null>(null);
  const [loadError, setLoadError] = useState("");
  const [loadingId, setLoadingId] = useState("");
  const remove = useCapacityMutation((id: string) => capacityWrite(`/activity-plans/${encodeURIComponent(id)}`, undefined, "DELETE"));
  return <>
    <ApiTable<ActivityPlan>
      title="Activity Plan & Line Audits" path="/activity-plans" getRowId={(row) => row.id}
      statusOptions={statuses} defaultPageSize={5}
      toolbarActions={canManage && <Button onClick={() => setEditing("new")}>Add Activity</Button>}
      columns={[
        { key: "activity", header: "Planned Activity" },
        { key: "line", header: "Target Line", render: (row) => row.line_code || row.line?.line_code || row.production_line_id || "-" },
        { key: "pic", header: "PIC" },
        { key: "due_date", header: "Due Date", render: (row) => row.due_date ? new Date(row.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "-" },
        { key: "status", header: "Status", render: (row) => <StatusBadge value={row.status} /> },
        { key: "actions", header: "Actions", render: (row) => canManage && <div className="flex gap-2">
          <Button variant="ghost" disabled={!!loadingId} onClick={async () => {
            setLoadError(""); setLoadingId(row.id);
            try { setEditing(await capacityGet<ActivityPlan>(`/activity-plans/${encodeURIComponent(row.id)}`)); }
            catch (error) { setLoadError(capacityError(error)); }
            finally { setLoadingId(""); }
          }}>Edit</Button>
          <Button variant="ghost" onClick={() => setDeleting(row)}>Delete</Button>
        </div> },
      ]}
    />
    {loadError && <p role="alert" className="text-sm text-destructive">{loadError}</p>}
    {editing && <ActivityForm key={editing === "new" ? "new" : editing.id} record={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    <ConfirmationModal open={!!deleting} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }}
      title="Delete Activity?" description="This permanently deletes the selected activity plan." confirmLabel="Delete" isLoading={remove.isPending}
      onConfirm={async () => { if (deleting) { try { await remove.mutateAsync(deleting.id); setDeleting(null); } catch { /* Keep confirmation open. */ } } }} />
    {remove.error && <p role="alert" className="text-sm text-destructive">{capacityError(remove.error)}</p>}
  </>;
}

function ActivityForm({ record, onClose }: { record?: ActivityPlan; onClose: () => void }) {
  const [draft, setDraft] = useState({
    activity: record?.activity ?? "", production_line_id: record?.production_line_id ?? record?.line?.line_id ?? "",
    pic: record?.pic ?? "", due_date: record?.due_date ?? "", status: record?.status ?? statuses[0].value,
  });
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const save = useCapacityMutation(() => capacityWrite(record ? `/activity-plans/${encodeURIComponent(record.id)}` : "/activity-plans", {
    ...draft, activity: draft.activity.trim(),
  }, record ? "PUT" : "POST"));
  return <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
    <DialogContent><DialogHeader><DialogTitle>{record ? "Edit Activity" : "Add Activity"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        try { await save.mutateAsync(); onClose(); } catch { /* Render API error. */ }
      }}>
        <fieldset disabled={save.isPending} className="space-y-3">
          <label className="block text-sm">Activity<input aria-label="Activity" required className={selectClass} value={draft.activity} onChange={(e) => setDraft({ ...draft, activity: e.target.value })} /></label>
          <MasterSelect label="Target Line" empty="No line" value={draft.production_line_id} onChange={(value) => setDraft({ ...draft, production_line_id: value })} items={lines.data ?? []} />
          <label className="block text-sm">PIC<input aria-label="PIC" className={selectClass} value={draft.pic} onChange={(e) => setDraft({ ...draft, pic: e.target.value })} /></label>
          <label className="block text-sm">Due Date<input aria-label="Due Date" type="date" className={selectClass} value={draft.due_date} onChange={(e) => setDraft({ ...draft, due_date: e.target.value })} /></label>
          <label className="block text-sm">Status<select aria-label="Activity Status" className={selectClass} value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>{statuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
        </fieldset>
        <ApiState query={lines} />
        {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button disabled={save.isPending || !save.canManage || !draft.activity.trim()}>Save Activity</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
