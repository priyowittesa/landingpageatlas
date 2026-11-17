"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import Table from "@/components/Table";
import ConfirmationModal from "@/components/ConfirmationModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { capacityError, capacityWrite } from "@/app/app/capacity-analytic/api";
import { ApiState } from "@/app/app/capacity-analytic/components/ApiState";
import { selectClass } from "@/app/app/capacity-analytic/components/CapacityFilters";
import { useCapacityMutation, useCapacityOptions } from "@/app/app/capacity-analytic/use-capacity";
import { entityDefinitions, type EntityKind, type MasterStatus } from "../api";

export function MasterStatuses({ kind, onClose }: { kind: EntityKind; onClose: () => void }) {
  const definition = entityDefinitions[kind];
  const query = useCapacityOptions<MasterStatus>("/statuses", { entity_type: definition.entityType });
  const [editing, setEditing] = useState<MasterStatus | null>(null);
  const [deactivating, setDeactivating] = useState<MasterStatus | null>(null);
  const deactivate = useCapacityMutation((id: string) => capacityWrite(`/statuses/${encodeURIComponent(id)}/deactivate`));
  return <Dialog open onOpenChange={(open) => !open && !deactivate.isPending && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
      <DialogHeader><DialogTitle>{definition.label} Statuses</DialogTitle></DialogHeader>
      <ApiState query={query} />
      <Table<MasterStatus> data={query.data ?? []} getRowId={(row) => row.id} columns={[
        { key: "code", header: "Code" }, { key: "label", header: "Label" }, { key: "sort_order", header: "Order" },
        { key: "is_active", header: "Active", render: (row) => row.is_active ? "Yes" : "No" },
        { key: "actions", header: "Actions", render: (row) => <div className="flex gap-2">
          <Button variant="ghost" onClick={() => setEditing(row)}>Edit</Button>
          {row.is_active && <Button variant="ghost" onClick={() => setDeactivating(row)}>Deactivate</Button>}
        </div> },
      ]} />
      <StatusForm key={editing?.id ?? "new"} record={editing ?? undefined} entityType={definition.entityType} onSaved={() => setEditing(null)} />
      {editing && <Button variant="outline" onClick={() => setEditing(null)}>New Status</Button>}
      <ConfirmationModal open={!!deactivating} onOpenChange={(open) => { if (!open && !deactivate.isPending) setDeactivating(null); }}
        title="Deactivate Status?" description="This status will no longer be available for new records." confirmLabel="Deactivate" isLoading={deactivate.isPending}
        onConfirm={async () => { if (deactivating) { try { await deactivate.mutateAsync(deactivating.id); setDeactivating(null); } catch { /* Render API error. */ } } }} />
      {deactivate.error && <p role="alert" className="text-sm text-destructive">{capacityError(deactivate.error)}</p>}
    </DialogContent>
  </Dialog>;
}

function StatusForm({ record, entityType, onSaved }: { record?: MasterStatus; entityType: string; onSaved: () => void }) {
  const [draft, setDraft] = useState({ code: record?.code ?? "", label: record?.label ?? "", sort_order: record?.sort_order ?? 0, is_active: record?.is_active ?? true });
  const [saved, setSaved] = useState(false);
  const save = useCapacityMutation(() => capacityWrite(record ? `/statuses/${encodeURIComponent(record.id)}` : "/statuses", record ?
    { label: draft.label.trim(), sort_order: draft.sort_order, is_active: draft.is_active } :
    { entity_type: entityType, code: draft.code.trim(), label: draft.label.trim(), sort_order: draft.sort_order }, record ? "PUT" : "POST"));
  return <form className="space-y-3 rounded-lg border p-4" onSubmit={async (e) => {
    e.preventDefault(); setSaved(false);
    try { await save.mutateAsync(); setSaved(true); onSaved(); } catch { /* Render API error. */ }
  }}>
    <h3 className="font-medium">{record ? "Edit Status" : "New Status"}</h3>
    <fieldset disabled={save.isPending} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm">Code<input aria-label="Status Code" required disabled={!!record} className={selectClass} value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })} /></label>
      <label className="text-sm">Label<input aria-label="Status Label" required className={selectClass} value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} /></label>
      <label className="text-sm">Sort Order<input aria-label="Status Sort Order" type="number" required step="1" className={selectClass} value={draft.sort_order} onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })} /></label>
      {record && <label className="flex items-center gap-2 text-sm"><input aria-label="Status Active" type="checkbox" checked={draft.is_active} onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })} />Active</label>}
    </fieldset>
    {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
    {saved && <p role="status" className="text-sm text-emerald-700">Status saved.</p>}
    <Button disabled={save.isPending || !save.canManage || !draft.label.trim() || !draft.code.trim()}>Save Status</Button>
  </form>;
}
