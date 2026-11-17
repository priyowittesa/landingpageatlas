"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, CirclePlus, GripVertical, Loader2, Search, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useEmployeeList } from "@/app/app/master-data/employee/use-employees";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBreadcrumbStore } from "@/stores/breadcrumb-store";
import type { Employee } from "@/types/type-employee";
import { type ApprovalLevel, useReceiveApprovalWorkflow, useSaveReceiveApprovalWorkflow } from "./use-receive-approval";

const description = (index: number) => `The ${index === 0 ? "first" : index === 1 ? "second" : index === 2 ? "third" : `${index + 1}th`} stage of approval. The assigned approver reviews the request before it moves to the next level.`;

function blankLevel(index: number): ApprovalLevel {
  return { approverId: "", description: description(index), levelNo: index + 1, title: `Level ${index + 1}` };
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function normalizeLevels(levels: ApprovalLevel[]) {
  return levels.map((level, index) => ({ ...level, levelNo: index + 1, title: `Level ${index + 1}`, description: description(index) }));
}

function ApproverCard({ employee, removable = false, onRemove }: { employee: Employee; removable?: boolean; onRemove?: () => void }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-lg border bg-white p-3">
    <Avatar className="h-9 w-9"><AvatarImage src={employee.avatar_url} alt="" /><AvatarFallback>{initials(employee.full_name)}</AvatarFallback></Avatar>
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{employee.full_name}</p><p className="truncate text-xs text-muted-foreground">{employee.position_name || employee.role_name || "Employee"}</p></div>
    {removable && <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${employee.full_name}`} className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={onRemove}><Trash2 className="h-4 w-4" /></Button>}
  </div>;
}

export function ReceiveApprovalSetting() {
  const router = useRouter();
  const setBreadcrumbs = useBreadcrumbStore((state) => state.setItems);
  const clearBreadcrumbs = useBreadcrumbStore((state) => state.clear);
  const workflowQuery = useReceiveApprovalWorkflow();
  const employeesQuery = useEmployeeList({ pageSize: 1000, status: "active" });
  const saveWorkflow = useSaveReceiveApprovalWorkflow();
  const [levels, setLevels] = useState<ApprovalLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [search, setSearch] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    setBreadcrumbs([
      { title: "Procurement", href: "/app/asset-management/procurement" },
      { title: "Receive List", href: "/app/asset-management/procurement/receive-list" },
      { title: "Approval Setting" },
    ]);
    return clearBreadcrumbs;
  }, [setBreadcrumbs, clearBreadcrumbs]);

  useEffect(() => {
    if (workflowQuery.isLoading || hydrated.current) return;
    setLevels(workflowQuery.data?.levels.length ? normalizeLevels(workflowQuery.data.levels) : [blankLevel(0), blankLevel(1)]);
    hydrated.current = true;
  }, [workflowQuery.data, workflowQuery.isLoading]);

  const employees = useMemo(() => employeesQuery.data?.items ?? [], [employeesQuery.data?.items]);
  const employeeById = useMemo(() => new Map(employees.map((employee) => [employee.id, employee])), [employees]);
  const availableEmployees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return employees.filter((employee) => !levels.some((level, index) => level.approverId === employee.id && index !== selectedLevel) && (!term || [employee.full_name, employee.position_name, employee.role_name].some((value) => value.toLowerCase().includes(term))));
  }, [employees, levels, search, selectedLevel]);

  const persist = (next: ApprovalLevel[]) => {
    const normalized = normalizeLevels(next);
    setLevels(normalized);
    if (!normalized.some((level) => level.approverId)) return;
    saveWorkflow.mutate({ workflow: workflowQuery.data ?? null, levels: normalized }, {
      onError: () => toast.error("Approval setting could not be saved. Your changes are still shown on this page."),
    });
  };

  const openApprovers = (index: number) => {
    setSelectedLevel(index);
    setSelectedApprover(levels[index]?.approverId ?? "");
    setSearch("");
  };

  const assignApprover = () => {
    if (selectedLevel === null || !selectedApprover) return;
    const next = levels.map((level, index) => index === selectedLevel ? { ...level, approverId: selectedApprover } : level);
    persist(next);
    setSelectedLevel(null);
    setSelectedApprover("");
  };

  const dropAt = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return setDraggedIndex(null);
    const next = [...levels];
    const [moved] = next.splice(draggedIndex, 1);
    next.splice(targetIndex, 0, moved);
    persist(next);
    setDraggedIndex(null);
  };

  if (workflowQuery.isLoading) return <div className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading approval setting...</div>;

  return <div className="pb-8">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-start gap-2">
        <Button type="button" variant="ghost" size="icon" className="mt-[-5px]" aria-label="Back to receive list" onClick={() => router.push("/app/asset-management/procurement/receive-list")}><ArrowLeft className="h-4 w-4" /></Button>
        <div><h1 className="text-xl font-bold text-gray-950">Receive List Approval Setting</h1><p className="mt-1 text-sm text-muted-foreground">Configure approvers for receive list</p></div>
      </div>
      <div className="flex h-8 items-center text-xs text-muted-foreground">{saveWorkflow.isPending ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving changes...</> : levels.some((level) => level.approverId) ? <><Check className="mr-2 h-3.5 w-3.5 text-emerald-600" />Changes saved automatically</> : null}</div>
    </div>

    {workflowQuery.isError && <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">Existing workflow could not be loaded. Assigning the first approver will create a new workflow.</div>}

    <div className={cn("grid gap-5", selectedLevel !== null && "lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]")}>
      <div className="min-w-0 space-y-3">
        {levels.map((level, index) => {
          const approver = employeeById.get(level.approverId);
          return <div key={`${level.approverId || "empty"}-${level.levelNo}`} className="grid grid-cols-[32px_minmax(0,1fr)] gap-3" onDragOver={(event) => event.preventDefault()} onDrop={() => dropAt(index)}>
            <div className="flex flex-col items-center"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{index + 1}</span>{index < levels.length - 1 && <span className="mt-2 w-px flex-1 bg-primary" />}</div>
            <section draggable onDragStart={() => setDraggedIndex(index)} onDragEnd={() => setDraggedIndex(null)} className={cn("group relative min-h-36 cursor-grab rounded-xl border bg-white p-4 shadow-sm active:cursor-grabbing", draggedIndex === index && "opacity-50", selectedLevel === index && "border-primary") }>
              <GripVertical className="absolute right-3 top-3 h-4 w-4 text-gray-300 opacity-0 transition-opacity group-hover:opacity-100" />
              <h2 className="font-semibold">Level {index + 1}</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-muted-foreground">{description(index)}</p>
              <div className="mt-3">
                {approver ? <ApproverCard employee={approver} removable onRemove={() => persist(levels.map((item, itemIndex) => itemIndex === index ? { ...item, approverId: "" } : item))} /> : <button type="button" onClick={() => openApprovers(index)} className="flex min-h-16 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary bg-primary/5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"><CirclePlus className="h-4 w-4" />Assign Approver</button>}
              </div>
            </section>
          </div>;
        })}
        <div className="pl-11"><Button type="button" className="w-full" onClick={() => setLevels((current) => normalizeLevels([...current, blankLevel(current.length)]))}><CirclePlus className="h-4 w-4" />Add Approval Level</Button></div>
      </div>

      {selectedLevel !== null && <aside className="h-fit rounded-xl border border-primary bg-white shadow-sm lg:sticky lg:top-4">
        <div className="flex items-center justify-between border-b px-5 py-4"><h2 className="font-semibold">Select Approver</h2><Button type="button" variant="ghost" size="icon" aria-label="Close approver list" onClick={() => setSelectedLevel(null)}><X className="h-4 w-4" /></Button></div>
        <div className="space-y-4 p-5">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name" className="pl-9" /></div>
          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {employeesQuery.isLoading ? <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading employees...</div>
              : employeesQuery.isError ? <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">Employees could not be loaded.</div>
                : availableEmployees.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">No approver found.</p>
                  : availableEmployees.map((employee) => <button type="button" key={employee.id} onClick={() => setSelectedApprover(employee.id)} className={cn("flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:border-primary/60", selectedApprover === employee.id && "border-primary ring-1 ring-primary")}>
                    <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-full border", selectedApprover === employee.id && "border-primary")}><span className={cn("h-2 w-2 rounded-full bg-primary", selectedApprover !== employee.id && "hidden")} /></span>
                    <Avatar className="h-9 w-9"><AvatarImage src={employee.avatar_url} alt="" /><AvatarFallback>{initials(employee.full_name)}</AvatarFallback></Avatar>
                    <span className="min-w-0"><span className="block truncate text-sm font-semibold">{employee.full_name}</span><span className="block truncate text-xs text-muted-foreground">{employee.position_name || employee.role_name || "Employee"}</span></span>
                  </button>)}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4"><Button type="button" variant="outline" onClick={() => setSelectedLevel(null)}>Cancel</Button><Button type="button" disabled={!selectedApprover || saveWorkflow.isPending} onClick={assignApprover}>Assign</Button></div>
        </div>
      </aside>}
    </div>
  </div>;
}
