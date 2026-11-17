"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { MasterRecord, Params } from "../api-types";
import { capacityError, capacityWrite, formatNumber } from "../api";
import { useCapacityAccess, useCapacityMutation, useCapacityOptions } from "../use-capacity";
import { ApiTable } from "./ApiTable";
import { ApiState } from "./ApiState";
import { currentPeriod, MasterSelect, selectClass } from "./CapacityFilters";

interface MonthlyInput {
  id: string;
  production_line_id: string;
  year: number;
  month: number;
  planned_downtime_hours?: number;
  man_hours_available?: number;
}

export function MonthlyInputs({ params }: { params?: Params }) {
  const { canManage } = useCapacityAccess();
  const [editing, setEditing] = useState<MonthlyInput | "new" | null>(null);
  return <>
    <ApiTable<MonthlyInput> title="Monthly Line Inputs" path="/line-monthly-inputs" params={params} getRowId={(row) => row.id}
      toolbarActions={canManage && <Button onClick={() => setEditing("new")}>Set Monthly Inputs</Button>}
      columns={[
        { key: "production_line_id", header: "Line ID" },
        { key: "year", header: "Year" }, { key: "month", header: "Month" },
        { key: "planned_downtime_hours", header: "Planned Downtime (h)", render: (row) => formatNumber(row.planned_downtime_hours) },
        { key: "man_hours_available", header: "Man-hours Available", render: (row) => formatNumber(row.man_hours_available) },
        { key: "actions", header: "Actions", render: (row) => canManage && <Button variant="ghost" onClick={() => setEditing(row)}>Edit</Button> },
      ]} />
    {editing && <MonthlyInputForm key={editing === "new" ? "new" : editing.id} record={editing === "new" ? undefined : editing} params={params} onClose={() => setEditing(null)} />}
  </>;
}

function MonthlyInputForm({ record, params, onClose }: { record?: MonthlyInput; params?: Params; onClose: () => void }) {
  const [draft, setDraft] = useState({
    production_line_id: record?.production_line_id ?? String(params?.production_line_id ?? ""),
    year: record?.year ?? Number(params?.year ?? currentPeriod().year),
    month: record?.month ?? Number(params?.month ?? currentPeriod().month),
    planned_downtime_hours: record?.planned_downtime_hours?.toString() ?? "",
    man_hours_available: record?.man_hours_available?.toString() ?? "",
  });
  const lines = useCapacityOptions<MasterRecord>("/production-lines");
  const save = useCapacityMutation(() => capacityWrite("/line-monthly-inputs", {
    ...draft, planned_downtime_hours: Number(draft.planned_downtime_hours), man_hours_available: Number(draft.man_hours_available),
  }, "PUT"));
  return <Dialog open onOpenChange={(open) => !open && !save.isPending && onClose()}>
    <DialogContent><DialogHeader><DialogTitle>Set Monthly Line Inputs</DialogTitle></DialogHeader>
      <form className="space-y-4" onSubmit={async (e) => {
        e.preventDefault();
        try { await save.mutateAsync(); onClose(); } catch { /* Render API error. */ }
      }}>
        <p className="text-sm text-muted-foreground">Saving replaces the downtime and man-hour values for this line and period. Enter zero explicitly when no hours apply.</p>
        <fieldset disabled={save.isPending} className="grid gap-3 sm:grid-cols-2">
          <MasterSelect label="Production Line" empty="Select a line" value={draft.production_line_id} onChange={(value) => setDraft({ ...draft, production_line_id: value })} items={lines.data ?? []} />
          <label className="text-sm">Year<input aria-label="Year" required type="number" min="1" max="9999" className={selectClass} value={draft.year} onChange={(e) => setDraft({ ...draft, year: Number(e.target.value) })} /></label>
          <label className="text-sm">Month<input aria-label="Month" required type="number" min="1" max="12" className={selectClass} value={draft.month} onChange={(e) => setDraft({ ...draft, month: Number(e.target.value) })} /></label>
          <label className="text-sm">Planned Downtime (hours)<input aria-label="Planned Downtime" required type="number" min="0" step="any" className={selectClass} value={draft.planned_downtime_hours} onChange={(e) => setDraft({ ...draft, planned_downtime_hours: e.target.value })} /></label>
          <label className="text-sm">Man-hours Available<input aria-label="Man-hours Available" required type="number" min="0" step="any" className={selectClass} value={draft.man_hours_available} onChange={(e) => setDraft({ ...draft, man_hours_available: e.target.value })} /></label>
        </fieldset>
        <ApiState query={lines} />
        {save.error && <p role="alert" className="text-sm text-destructive">{capacityError(save.error)}</p>}
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button><Button disabled={save.isPending || !save.canManage || !draft.production_line_id}>Save Monthly Inputs</Button></div>
      </form>
    </DialogContent>
  </Dialog>;
}
