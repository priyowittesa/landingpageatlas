"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ApiState } from "@/app/app/capacity-analytic/components/ApiState";
import { MasterSelect, selectClass } from "@/app/app/capacity-analytic/components/CapacityFilters";
import { capacityError } from "@/app/app/capacity-analytic/api";
import { useCapacityMutation, useCapacityOptions } from "@/app/app/capacity-analytic/use-capacity";
import { entityDefinitions, masterDraft, saveMaster, type EntityKind, type MasterEntity, type MasterStatus } from "../api";

export function MasterEntityForm({ kind, parentId, record, onClose }: {
  kind: EntityKind; parentId?: string; record?: MasterEntity; onClose: () => void;
}) {
  const definition = entityDefinitions[kind];
  const [draft, setDraft] = useState(() => masterDraft(kind, record));
  const statuses = useCapacityOptions<MasterStatus>("/statuses", { entity_type: definition.entityType });
  const components = useCapacityOptions<MasterEntity>("/parts", undefined, kind === "assembly" && !record);
  const save = useCapacityMutation(() => saveMaster(kind, draft, parentId, record?.id));
  const update = (field: string, value: string) => setDraft((old) => ({ ...old, [field]: value }));
  return <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{record ? "Edit" : "Add"} {definition.label}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (event) => {
        event.preventDefault();
        try { await save.mutateAsync(); onClose(); } catch { /* Keep the entered values on failure. */ }
      }}>
        <fieldset disabled={save.isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {kind === "assembly" && !record && <MasterSelect label="Component Part" empty="Select a component" value={draft.component_part_id}
            onChange={(value) => update("component_part_id", value)}
            items={(components.data ?? []).filter((part) => part.id !== parentId).map((part) => ({ id: part.id, part_number: String(part.part_number ?? ""), part_name: String(part.part_name ?? "") }))} />}
          {definition.fields.map((field) => <label key={field.key} className="space-y-1 text-sm">
            <span>{field.label}{field.optional ? " (optional)" : ""}</span>
            <input aria-label={field.label} type={field.numeric ? "number" : "text"} className={selectClass}
              required={!field.optional} min={field.min} max={field.max} step={field.integer ? "1" : "any"}
              value={draft[field.key]} onChange={(e) => update(field.key, e.target.value)} />
          </label>)}
          <label className="space-y-1 text-sm"><span>Status</span>
            <select aria-label="Master Status" required className={selectClass} value={draft.status_id} onChange={(e) => update("status_id", e.target.value)}>
              <option value="">Select a status</option>
              {(statuses.data ?? []).filter((status) => status.is_active || status.id === record?.status_id).map((status) => <option key={status.id} value={status.id}>{status.label}{!status.is_active ? " (inactive)" : ""}</option>)}
            </select>
          </label>
        </fieldset>
        {record && (kind === "line" || kind === "part") && <p className="text-xs text-muted-foreground">
          Blank optional numeric fields keep their stored values. For standard labor time, enter 0 explicitly to clear it.
        </p>}
        <ApiState query={statuses} />
        {kind === "assembly" && !record && <ApiState query={components} />}
        {!statuses.isPending && !statuses.error && !statuses.data?.some((status) => status.is_active || status.id === record?.status_id) && <p role="alert" className="text-sm text-destructive">No available statuses for this entity. Add a status with Manage Statuses first.</p>}
        {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button>
          <Button disabled={save.isPending || !save.canManage || !draft.status_id || (kind === "assembly" && !record && !draft.component_part_id)}>Save {definition.label}</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
