"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { WorkOrder, WorkOrderPayload } from "../use-work-orders";
import { useEditWorkOrder } from "../use-work-orders";

const inputClass = "h-10 w-full rounded-lg border px-3 text-sm outline-none focus:ring-2 focus:ring-primary-200";
const localDate = (value: string) => { if (!value) return ""; const date = new Date(value); if (Number.isNaN(date.getTime())) return ""; return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16); };
const apiDate = (value: string) => value ? new Date(value).toISOString().replace(".000Z", "Z") : undefined;
const validExecutionTime = (value: string) => !value || (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/.test(value) && Number.isFinite(new Date(value).getTime()));

export function ExecutionRecordDialog({ item, open, onOpenChange }: { item: WorkOrder; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <ExecutionRecordDialogForm key={`${item.id}-${open}`} item={item} open={open} onOpenChange={onOpenChange}/>;
}

function ExecutionRecordDialogForm({ item, open, onOpenChange }: { item: WorkOrder; open: boolean; onOpenChange: (open: boolean) => void }) {
  const edit = useEditWorkOrder();
  const [form, setForm] = useState({ problemFound: item.problemFound, rootCause: item.rootCause, actionTaken: item.actionTaken, recommendation: item.recommendation, result: item.result, startedAt: localDate(item.executionStartedAt), endedAt: localDate(item.executionEndedAt) });
  const set = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const invalidTime = !validExecutionTime(form.startedAt) || !validExecutionTime(form.endedAt);
  const invalidOrder = Boolean(form.startedAt && form.endedAt && !invalidTime && new Date(form.endedAt) < new Date(form.startedAt));
  const invalid = !form.problemFound.trim() || !form.rootCause.trim() || !form.actionTaken.trim() || !form.recommendation.trim() || !form.result.trim() || invalidTime || invalidOrder;
  async function submit() {
    if (invalid) return;
    const payload: WorkOrderPayload = {
      asset_id: item.assetId || undefined, title: item.title || undefined,
      problem_description: item.problemDescription || undefined, priority: item.priority === "-" ? undefined : item.priority.toLowerCase(),
      source_id: item.sourceId || undefined, source_type: item.sourceType || undefined,
      occurred_at: item.occurredAt || undefined, estimated_return_at: item.estimatedReturnAt || undefined,
      problem_found: form.problemFound.trim(), root_cause: form.rootCause.trim(), action_taken: form.actionTaken.trim(),
      recommendation: form.recommendation.trim(), result: form.result.trim(),
      execution_started_at: apiDate(form.startedAt), execution_ended_at: apiDate(form.endedAt),
    };
    await edit.mutateAsync({ id: item.id, payload }); onOpenChange(false);
  }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>Edit Execution Record</DialogTitle><DialogDescription>Update the execution result for this work order.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><Field label="Problem Found" required><input value={form.problemFound} onChange={(e) => set("problemFound", e.target.value)} placeholder="Enter problem" className={inputClass}/></Field><Field label="Root Cause" required><input value={form.rootCause} onChange={(e) => set("rootCause", e.target.value)} placeholder="Enter root cause" className={inputClass}/></Field><Field label="Action Taken" required><input value={form.actionTaken} onChange={(e) => set("actionTaken", e.target.value)} placeholder="Enter action taken" className={inputClass}/></Field><Field label="Recommendation" required><input value={form.recommendation} onChange={(e) => set("recommendation", e.target.value)} placeholder="Enter recommendation" className={inputClass}/></Field><Field label="Start Time"><input type="datetime-local" min="0001-01-01T00:00" max="9999-12-31T23:59" value={form.startedAt} onChange={(e) => set("startedAt", e.target.value)} aria-invalid={!validExecutionTime(form.startedAt)} className={inputClass}/></Field><Field label="End Time"><input type="datetime-local" min="0001-01-01T00:00" max="9999-12-31T23:59" value={form.endedAt} onChange={(e) => set("endedAt", e.target.value)} aria-invalid={!validExecutionTime(form.endedAt) || invalidOrder} className={inputClass}/></Field>{(invalidTime || invalidOrder) && <p role="alert" className="text-xs text-red-600 sm:col-span-2">{invalidTime ? "Use a valid date with a four-digit year." : "End Time must be after Start Time."}</p>}<div className="sm:col-span-2"><Field label="Result" required><textarea value={form.result} onChange={(e) => set("result", e.target.value)} placeholder="Enter operational recommendations for the operator..." className="min-h-24 w-full rounded-lg border p-3 text-sm"/></Field></div></div><DialogFooter><Button variant="outline" disabled={edit.isPending} onClick={() => onOpenChange(false)}>Cancel</Button><Button disabled={invalid || edit.isPending} onClick={submit}>{edit.isPending ? "Saving..." : "Save"}</Button></DialogFooter></DialogContent></Dialog>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) { return <label className="block text-xs font-medium text-gray-600">{label}{required && <span className="text-red-500"> *</span>}<div className="mt-2">{children}</div></label>; }
