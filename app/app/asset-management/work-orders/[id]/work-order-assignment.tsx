"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ConfirmationModal from "@/components/ConfirmationModal";
import { useEmployeeList } from "@/app/app/master-data/employee/use-employees";
import type { WorkOrderAssignee } from "../use-work-orders";
import { useAssignWorkOrderAssignees, useDeleteWorkOrderAssignee, useWorkOrderAssignees } from "../use-work-orders";

const MAX_ASSIGNEES = 5;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";

export function WorkOrderAssignment({ workOrderId, readOnly = false }: { workOrderId: string; readOnly?: boolean }) {
  const assignees = useWorkOrderAssignees(workOrderId); const remove = useDeleteWorkOrderAssignee(workOrderId);
  const [assignOpen, setAssignOpen] = useState(false); const [deleting, setDeleting] = useState<WorkOrderAssignee | null>(null); const [checkingRate, setCheckingRate] = useState<WorkOrderAssignee | null>(null);
  const rows = assignees.data ?? [];
  return <section className="rounded-xl border bg-white p-5 shadow-sm">
    <header className="mb-4 flex items-center justify-between"><h2 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4"/>Assignment ({rows.length}/{MAX_ASSIGNEES})</h2>{!readOnly && <Button size="sm" disabled={rows.length >= MAX_ASSIGNEES} onClick={() => setAssignOpen(true)}>Assign</Button>}</header>
    {assignees.isLoading ? <p className="py-8 text-center text-sm text-gray-400">Loading assignments...</p> : assignees.isError ? <p className="py-8 text-center text-sm text-red-500">Unable to load assignments.</p> : rows.length === 0 ? <p className="py-8 text-center text-sm text-gray-400">No employee assigned.</p> : <div className="space-y-3">{rows.map((row) => <div key={row.id} className="flex items-center gap-3"><Avatar name={row.name}/><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-gray-900">{row.name}</p><p className="truncate text-xs text-gray-400">{row.role}</p></div><button type="button" onClick={() => setCheckingRate(row)} className="text-xs font-medium text-sky-600 hover:underline">Check Rate</button>{!readOnly && <button type="button" aria-label={`Remove ${row.name}`} onClick={() => setDeleting(row)} className="rounded p-1.5 text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4"/></button>}</div>)}</div>}
    <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} workOrderId={workOrderId} current={rows}/>
    <ConfirmationModal open={Boolean(deleting)} onOpenChange={(open) => { if (!open && !remove.isPending) setDeleting(null); }} title="Remove assignee?" description={`Remove ${deleting?.name ?? "this employee"} from this work order?`} confirmLabel="Remove" isLoading={remove.isPending} onConfirm={() => { if (!deleting) return; remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) }); }}/>
    <RateCardDialog assignee={checkingRate} onOpenChange={(open) => { if (!open) setCheckingRate(null); }}/>
  </section>;
}

function AssignDialog({ open, onOpenChange, workOrderId, current }: { open: boolean; onOpenChange: (open: boolean) => void; workOrderId: string; current: WorkOrderAssignee[] }) {
  const [search, setSearch] = useState(""); const [debounced, setDebounced] = useState(""); const [selected, setSelected] = useState<string[]>([]);
  const employees = useEmployeeList({ pageSize: 100, search: debounced || undefined, status: "active" }); const assign = useAssignWorkOrderAssignees(workOrderId);
  useEffect(() => { const timeout = window.setTimeout(() => setDebounced(search.trim()), 350); return () => window.clearTimeout(timeout); }, [search]);
  const assignedIds = useMemo(() => new Set(current.map((item) => item.labourId)), [current]);
  const available = (employees.data?.items ?? []).filter((employee) => !assignedIds.has(employee.id)); const capacity = Math.max(0, MAX_ASSIGNEES - current.length);
  const toggle = (id: string) => setSelected((values) => values.includes(id) ? values.filter((value) => value !== id) : values.length < capacity ? [...values, id] : values);
  const close = () => { setSearch(""); setSelected([]); onOpenChange(false); };
  return <Dialog open={open} onOpenChange={(next) => { if (!next) close(); else onOpenChange(true); }}><DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>Assign Technician ({current.length + selected.length}/{MAX_ASSIGNEES})</DialogTitle><DialogDescription className="sr-only">Search and assign employees to this work order</DialogDescription></DialogHeader>
    <label className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search employee" className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm outline-none focus:border-primary-400"/></label>
    <div className="max-h-80 space-y-2 overflow-y-auto">{employees.isLoading ? <p className="py-10 text-center text-sm text-gray-400">Loading employees...</p> : available.length === 0 ? <p className="py-10 text-center text-sm text-gray-400">No employees found.</p> : available.map((employee) => { const checked = selected.includes(employee.id); const disabled = !checked && selected.length >= capacity; return <button key={employee.id} type="button" disabled={disabled} onClick={() => toggle(employee.id)} className="flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:bg-gray-50 disabled:opacity-50"><Checkbox checked={checked} tabIndex={-1}/><Avatar name={employee.full_name}/><span className="min-w-0"><span className="block truncate text-sm font-semibold">{employee.full_name}</span><span className="block truncate text-xs text-gray-400">{employee.position_name || employee.role_name || "-"}</span></span></button>; })}</div>
    <DialogFooter><Button variant="outline" disabled={assign.isPending} onClick={close}>Cancel</Button><Button disabled={selected.length === 0 || assign.isPending} onClick={() => assign.mutate(selected, { onSuccess: close })}>{assign.isPending ? "Assigning..." : "Assign"}</Button></DialogFooter>
  </DialogContent></Dialog>;
}

function Avatar({ name }: { name: string }) { return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600">{initials(name)}</span>; }
function RateCardDialog({ assignee, onOpenChange }: { assignee: WorkOrderAssignee | null; onOpenChange: (open: boolean) => void }) { return <Dialog open={Boolean(assignee)} onOpenChange={onOpenChange}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>Rate Card</DialogTitle><DialogDescription>{assignee?.name ?? "Employee rate card"}</DialogDescription></DialogHeader><dl className="divide-y rounded-lg border text-sm"><RateRow label="Name" value={assignee?.rateCardName}/><RateRow label="Code" value={assignee?.rateCardCode}/><RateRow label="Base Rate" value={assignee ? `${assignee.rateCardCurrency} ${assignee.rateCardBaseRate}` : undefined}/><RateRow label="Unit" value={assignee?.rateCardUnit}/></dl><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button></DialogFooter></DialogContent></Dialog>; }
function RateRow({ label, value }: { label: string; value?: string }) { return <div className="flex justify-between gap-4 px-3 py-2.5"><dt className="text-gray-500">{label}</dt><dd className="text-right font-medium">{value || "-"}</dd></div>; }
