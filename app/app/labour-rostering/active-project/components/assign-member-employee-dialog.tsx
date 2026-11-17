"use client";

import { LoaderCircle, Search, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDisplayValue } from "@/lib/format-display-value";
import { cn } from "@/lib/utils";
import type { Employee } from "@/types/type-employee";
import {
  useUpdateProjectMembers,
  type LabourMemberPayload,
  type LabourRosterMember,
} from "../../../master-data/projects/use-projects";

type AssignMemberEmployeeDialogProps = {
  assignedEmployeeIds: string[];
  employees: Employee[];
  member: LabourRosterMember | null;
  onAssigned: (employeeId: string) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

function initials(name: string) {
  return name
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AssignMemberEmployeeDialog({
  assignedEmployeeIds,
  employees,
  member,
  onAssigned,
  onOpenChange,
  open,
  projectId,
}: AssignMemberEmployeeDialogProps) {
  const updateMember = useUpdateProjectMembers();
  const [search, setSearch] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  const availableEmployees = useMemo(() => {
    const assigned = new Set(assignedEmployeeIds);
    if (member?.labour_id) assigned.delete(member.labour_id);
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      if (assigned.has(employee.id)) return false;
      if (!query) return true;
      return [
        employee.full_name,
        employee.code,
        employee.role_name,
        employee.department_name,
      ].some((value) =>
        formatDisplayValue(value, "").toLowerCase().includes(query),
      );
    });
  }, [assignedEmployeeIds, employees, member?.labour_id, search]);

  const selectedEmployee = employees.find(
    (employee) => employee.id === selectedEmployeeId,
  );

  const reset = () => {
    setSearch("");
    setSelectedEmployeeId("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (updateMember.isPending) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const save = async () => {
    if (!member || !selectedEmployee || updateMember.isPending) return;
    const roleId =
      member.member_role_id ||
      member.role_in_project ||
      selectedEmployee.role_id;
    if (!roleId) return;

    const payload: LabourMemberPayload = {
      labour_id: selectedEmployee.id,
      project_id: projectId,
      responsibility: member.responsibility,
      role_in_project: roleId,
      ...(member.department_id || selectedEmployee.department_id
        ? {
            department_id:
              member.department_id || selectedEmployee.department_id,
          }
        : {}),
      ...(member.end_date ? { end_date: member.end_date } : {}),
      ...(member.group_id ? { group_id: member.group_id } : {}),
      ...(member.start_date ? { start_date: member.start_date } : {}),
    };

    try {
      await updateMember.mutateAsync([{ id: member.id, payload }]);
      onAssigned(selectedEmployee.id);
      reset();
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
        showCloseButton={!updateMember.isPending}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
              <UserPlus className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-sm">Assign Employee</DialogTitle>
              <DialogDescription className="text-xs">
                Select an employee for{" "}
                {formatDisplayValue(
                  member?.member_role_name || member?.labour_name,
                  "this member",
                )}
                .
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="border-b px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search employee..."
              className="h-9 pl-9 text-xs"
              disabled={updateMember.isPending}
            />
          </div>
        </div>

        <div className="max-h-[55vh] min-h-64 space-y-1.5 overflow-y-auto px-5 py-3">
          {availableEmployees.map((employee) => {
            const selected = employee.id === selectedEmployeeId;
            return (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelectedEmployeeId(employee.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
                  selected
                    ? "border-primary-300 bg-primary-50"
                    : "border-slate-100 hover:bg-slate-50",
                )}
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={employee.avatar_url}
                    alt={formatDisplayValue(employee.full_name)}
                  />
                  <AvatarFallback className="bg-primary-600 text-[10px] text-white">
                    {initials(employee.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-xs">
                    {formatDisplayValue(employee.full_name)}
                  </strong>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {formatDisplayValue(
                      employee.role_name || employee.position_name,
                    )}
                  </span>
                </span>
              </button>
            );
          })}

          {!availableEmployees.length && (
            <div className="flex min-h-56 items-center justify-center text-xs text-muted-foreground">
              No available employees found.
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-5 py-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={updateMember.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!selectedEmployee || updateMember.isPending}
            onClick={save}
          >
            {updateMember.isPending && (
              <LoaderCircle className="animate-spin" />
            )}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
