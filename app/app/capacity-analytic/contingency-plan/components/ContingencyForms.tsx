"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { capacityError, capacityWrite } from "../../api";
import type { BridgingCase, BridgingInput, BridgingPreview, MasterRecord, Overtime } from "../../api-types";
import { useCapacityMutation, useCapacityOptions } from "../../use-capacity";
import { currentPeriod, MasterSelect, selectClass } from "../../components/CapacityFilters";
import { ApiState, CapacityValue } from "../../components/ApiState";
import SubmitBridgingModal from "./SubmitBridgingModal";

export function BridgingForm({ onClose }: { onClose: () => void }) {
  const [draft, setDraft] = useState<BridgingInput>({ source_line_id: "", target_line_id: "", part_id: "", qty: 1, ...currentPeriod(), plan: "PLAN_TYPE_PRODUCTION", note: "" });
  const [preview, setPreview] = useState<BridgingPreview | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const parts = useCapacityOptions<MasterRecord>(`/production-lines/${encodeURIComponent(draft.source_line_id)}/parts`, undefined, !!draft.source_line_id);
  const calculate = useMutation({ mutationFn: (input: BridgingInput) => capacityWrite<BridgingPreview>("/bridging-cases/preview", {
    source_line_id: input.source_line_id, target_line_id: input.target_line_id, part_id: input.part_id,
    year: input.year, month: input.month, qty: input.qty, plan: input.plan,
  }), retry: false });
  const submit = useCapacityMutation((input: BridgingInput) => capacityWrite<BridgingCase>("/bridging-cases", input));
  const update = (next: Partial<BridgingInput>) => { setDraft((old) => ({ ...old, ...next })); setPreview(null); calculate.reset(); submit.reset(); };
  const busy = calculate.isPending || submit.isPending;
  return <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>Submit Bridging</DialogTitle></DialogHeader>
      <p className="text-sm text-muted-foreground">Capacity changes only after this case is approved.</p>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        try { setPreview(await calculate.mutateAsync(draft)); } catch { /* Error is displayed below. */ }
      }}>
        <fieldset disabled={busy || confirmOpen} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MasterSelect label="Source Line" value={draft.source_line_id} onChange={(value) => update({ source_line_id: value, part_id: "" })} items={lines.data ?? []} empty="Select a line" />
          <MasterSelect label="Target Line" value={draft.target_line_id} onChange={(value) => update({ target_line_id: value })} items={(lines.data ?? []).filter((line) => line.id !== draft.source_line_id)} empty="Select a line" />
          <MasterSelect label="Part" value={draft.part_id} onChange={(value) => update({ part_id: value })} items={parts.data ?? []} empty="Select a source part" />
          <label className="text-sm">Quantity<input aria-label="Quantity" required type="number" min="1" step="1" className={selectClass} value={draft.qty} onChange={(e) => update({ qty: Number(e.target.value) })} /></label>
          <label className="text-sm">Year<input aria-label="Year" required type="number" min="1" max="9999" className={selectClass} value={draft.year} onChange={(e) => update({ year: Number(e.target.value) })} /></label>
          <label className="text-sm">Month<input aria-label="Month" required type="number" min="1" max="12" className={selectClass} value={draft.month} onChange={(e) => update({ month: Number(e.target.value) })} /></label>
          <label className="text-sm">Plan<select aria-label="Plan" className={selectClass} value={draft.plan} onChange={(e) => update({ plan: e.target.value })}><option value="PLAN_TYPE_PRODUCTION">Production Plan</option><option value="PLAN_TYPE_PROTOTYPE">Prototype Plan</option></select></label>
          <label className="text-sm">Note<input aria-label="Note" className={selectClass} value={draft.note} onChange={(e) => update({ note: e.target.value })} /></label>
        </fieldset>
        <ApiState query={lines} />
        {draft.source_line_id && <ApiState query={parts} />}
        {preview && <div className="space-y-2 rounded-lg border p-3 text-sm">
          <p>Source: <CapacityValue value={preview.source_before?.capacity_pct} status={preview.source_before?.status} /> to <CapacityValue value={preview.source_after?.capacity_pct} status={preview.source_after?.status} problem={preview.source_after?.problem} /></p>
          <p>Target: <CapacityValue value={preview.target_before?.capacity_pct} status={preview.target_before?.status} /> to <CapacityValue value={preview.target_after?.capacity_pct} status={preview.target_after?.status} problem={preview.target_after?.problem} /></p>
        </div>}
        {(calculate.error || submit.error) && <p role="alert" className="text-sm text-destructive">{capacityError(calculate.error || submit.error)}</p>}
        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="outline" disabled={busy} onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy || !draft.source_line_id || !draft.target_line_id || !draft.part_id || draft.source_line_id === draft.target_line_id}>Preview Impact</Button>
          <Button type="button" disabled={busy || !preview || !submit.canManage} onClick={() => setConfirmOpen(true)}>Submit Bridging</Button>
        </div>
      </form>
      <SubmitBridgingModal open={confirmOpen} pending={submit.isPending} error={submit.error ? capacityError(submit.error) : undefined}
        onCancel={() => setConfirmOpen(false)} onConfirm={async () => {
            if (!preview || busy || !submit.canManage) return;
            try {
              await submit.mutateAsync(draft);
              toast.success("Bridging case is now pending review.");
              onClose();
            } catch { /* Keep the form open for correction. */ }
          }} />
    </DialogContent>
  </Dialog>;
}

export function OvertimeForm({ record, onClose }: { record?: Overtime; onClose: () => void }) {
  const [draft, setDraft] = useState({
    production_line_id: record?.production_line_id ?? record?.line?.line_id ?? "",
    work_date: record?.work_date ?? "", shift_type: record?.shift_type ?? "",
    hours: record?.hours ?? 1, workers: record?.workers ?? 1, reason: record?.reason ?? "",
  });
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const submit = useCapacityMutation((input: typeof draft) => {
    const { production_line_id, ...editable } = input;
    return capacityWrite<Overtime>(record ? `/overtime-logs/${encodeURIComponent(record.id)}` : "/overtime-logs", record ? editable : { ...editable, production_line_id }, record ? "PUT" : "POST");
  });
  return <Dialog open onOpenChange={(open) => !open && !submit.isPending && onClose()}>
    <DialogContent>
      <DialogHeader><DialogTitle>{record ? "Edit Overtime" : "Add Overtime"}</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        try { await submit.mutateAsync(draft); onClose(); } catch { /* Error is displayed below. */ }
      }}>
        <fieldset disabled={submit.isPending} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MasterSelect label="Production Line" value={draft.production_line_id} disabled={!!record} onChange={(value) => setDraft({ ...draft, production_line_id: value })} items={lines.data ?? []} empty="Select a line" />
          <label className="text-sm">Work Date<input aria-label="Work Date" required type="date" className={selectClass} value={draft.work_date} onChange={(e) => setDraft({ ...draft, work_date: e.target.value })} /></label>
          <label className="text-sm">Shift Type<input aria-label="Shift Type" required className={selectClass} value={draft.shift_type} onChange={(e) => setDraft({ ...draft, shift_type: e.target.value })} /></label>
          <label className="text-sm">Hours<input aria-label="Hours" required type="number" min="0.01" max="24" step="0.01" className={selectClass} value={draft.hours} onChange={(e) => setDraft({ ...draft, hours: Number(e.target.value) })} /></label>
          <label className="text-sm">Workers<input aria-label="Workers" required type="number" min="1" step="1" className={selectClass} value={draft.workers} onChange={(e) => setDraft({ ...draft, workers: Number(e.target.value) })} /></label>
          <label className="text-sm">Reason<input aria-label="Reason" required className={selectClass} value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} /></label>
        </fieldset>
        <ApiState query={lines} />
        {submit.error && <p role="alert" className="text-sm text-destructive">{capacityError(submit.error)}</p>}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={submit.isPending}>Cancel</Button>
          <Button disabled={!draft.production_line_id || submit.isPending || !submit.canManage}>Save Overtime</Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>;
}
