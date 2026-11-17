"use client";

import {
  CalendarDays,
  LoaderCircle,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatDisplayValue } from "@/lib/format-display-value";
import type { Employee } from "@/types/type-employee";
import { useAddProjectMembers } from "../../../master-data/projects/use-projects";
import type { Project } from "../../../master-data/projects/types";

type AssignmentDates = {
  endDate: string;
  startDate: string;
};

type EmployeeAssignmentPayload = {
  department_id?: string;
  end_date: string;
  group_id?: string;
  labour_id: string;
  project_id: string;
  responsibility: string;
  role_in_project: string;
  start_date: string;
};

type AssignEmployeeDialogProps = {
  assignedEmployeeIds: string[];
  employees: Employee[];
  groupId?: string;
  groupName?: string;
  onAssigned: (employeeIds: string[]) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  project: Project;
};

function employeeInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function emptyDates(): AssignmentDates {
  return { startDate: "", endDate: "" };
}

export function AssignEmployeeDialog({
  assignedEmployeeIds,
  employees,
  groupId,
  groupName,
  onAssigned,
  onOpenChange,
  open,
  project,
}: AssignEmployeeDialogProps) {
  const router = useRouter();
  const addProjectMembers = useAddProjectMembers();
  const [step, setStep] = useState<"employees" | "dates">("employees");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [oneDateForAll, setOneDateForAll] = useState(true);
  const [sharedDates, setSharedDates] = useState<AssignmentDates>(emptyDates);
  const [employeeDates, setEmployeeDates] = useState<
    Record<string, AssignmentDates>
  >({});

  const availableEmployees = useMemo(() => {
    const assigned = new Set(assignedEmployeeIds);
    return employees.filter((employee) => !assigned.has(employee.id));
  }, [assignedEmployeeIds, employees]);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return availableEmployees;

    return availableEmployees.filter((employee) =>
      [
        employee.full_name,
        employee.code,
        employee.role_name,
        employee.department_name,
        employee.type,
      ].some((value) => value.toLowerCase().includes(query)),
    );
  }, [availableEmployees, search]);

  const selectedEmployees = useMemo(() => {
    const selected = new Set(selectedIds);
    return employees.filter((employee) => selected.has(employee.id));
  }, [employees, selectedIds]);

  const reset = () => {
    setStep("employees");
    setSearch("");
    setSelectedIds([]);
    setOneDateForAll(true);
    setSharedDates(emptyDates());
    setEmployeeDates({});
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (addProjectMembers.isPending) return;
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedIds((current) =>
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId],
    );
  };

  const goToDates = () => {
    setEmployeeDates((current) => {
      const next = { ...current };
      selectedIds.forEach((employeeId) => {
        next[employeeId] ??= { ...sharedDates };
      });
      return next;
    });
    setStep("dates");
  };

  const dateIsValid = (dates: AssignmentDates) =>
    Boolean(
      dates.startDate &&
        dates.endDate &&
        dates.endDate >= dates.startDate,
    );

  const allDatesValid = oneDateForAll
    ? dateIsValid(sharedDates)
    : selectedIds.every((employeeId) =>
        dateIsValid(employeeDates[employeeId] ?? emptyDates()),
      );

  const saveAssignments = async () => {
    if (!selectedEmployees.length || !allDatesValid) return;

    const payloads: EmployeeAssignmentPayload[] = selectedEmployees.map(
      (employee) => {
        const dates = oneDateForAll
          ? sharedDates
          : employeeDates[employee.id] ?? emptyDates();

        return {
          end_date: dates.endDate,
          labour_id: employee.id,
          project_id: project.id,
          responsibility: "",
          role_in_project: employee.role_id,
          start_date: dates.startDate,
          ...(employee.department_id
            ? { department_id: employee.department_id }
            : {}),
          ...(groupId || project.group_id
            ? { group_id: groupId || project.group_id }
            : {}),
        };
      },
    );

    try {
      await addProjectMembers.mutateAsync(payloads);
      onAssigned(selectedIds);
      reset();
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error. Keep the form open
      // so the user can correct the assignment and retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] gap-0 overflow-hidden p-0 sm:max-w-3xl"
        showCloseButton={!addProjectMembers.isPending}
      >
        {step === "employees" ? (
          <>
            <DialogHeader className="border-b px-5 py-4 pr-12">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <DialogTitle className="text-sm">
                    {groupName
                      ? `Assign Employee to ${formatDisplayValue(groupName)}`
                      : "Assign Employee"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    Select employees to assign to this project.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="border-b px-5 py-3">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search employee..."
                  className="h-9 w-full bg-slate-50 pl-9 text-xs"
                />
              </div>
            </div>

            <div className="h-[55vh] min-h-80 overflow-y-auto px-5 py-3">
              {filteredEmployees.length ? (
                <div className="space-y-1.5">
                  {filteredEmployees.map((employee) => {
                    const selected = selectedIds.includes(employee.id);
                    const setupComplete = Boolean(employee.role_id);

                    return (
                      <div
                        key={employee.id}
                        onClick={() =>
                          setupComplete && toggleEmployee(employee.id)
                        }
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                          selected
                            ? "border-primary-200 bg-primary-50"
                            : "border-slate-100 hover:bg-slate-50",
                          !setupComplete && "cursor-not-allowed opacity-55",
                        )}
                      >
                        <Checkbox
                          checked={selected}
                          disabled={!setupComplete}
                          onCheckedChange={() => toggleEmployee(employee.id)}
                          onClick={(event) => event.stopPropagation()}
                          aria-label={`Select ${formatDisplayValue(employee.full_name)}`}
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={employee.avatar_url}
                            alt={formatDisplayValue(employee.full_name)}
                          />
                          <AvatarFallback className="bg-primary-600 text-[10px] text-white">
                            {employeeInitials(employee.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-xs">
                            {formatDisplayValue(employee.full_name)}
                          </strong>
                          <span className="block truncate text-[10px] text-muted-foreground">
                            {setupComplete
                              ? formatDisplayValue(
                                  employee.role_name ||
                                    employee.position_name,
                                )
                              : "Role in project is required"}
                          </span>
                        </span>
                        {employee.type && (
                          <span className="rounded bg-primary-50 px-2 py-1 text-[9px] capitalize text-primary-700">
                            {employee.type}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                    <UsersRound className="h-5 w-5" />
                  </span>
                  <strong className="text-xs">No Employee Found</strong>
                  <p className="mt-1 max-w-xs text-[10px] text-muted-foreground">
                    Set up an employee in master data before assigning them to
                    this project.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-primary-600 hover:bg-primary-700"
                    onClick={() => router.push("/app/master-data/employee/add")}
                  >
                    Setup Employee First
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="border-t px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={!selectedIds.length}
                onClick={goToDates}
                className="bg-primary-600 hover:bg-primary-700"
              >
                Save
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="border-b px-5 py-4 pr-12">
              <div className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <div className="space-y-1">
                  <DialogTitle className="text-sm">Selected Date</DialogTitle>
                  <DialogDescription className="text-xs">
                    Choose the assignment period for the selected employees.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Checkbox
                  id="one-date-for-all"
                  checked={oneDateForAll}
                  onCheckedChange={(checked) =>
                    setOneDateForAll(checked === true)
                  }
                />
                <label htmlFor="one-date-for-all">One Date for All</label>
              </div>

              <p className="mb-3 mt-5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {selectedEmployees.length} employee selected
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="rounded-lg border bg-slate-50 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={employee.avatar_url}
                          alt={formatDisplayValue(employee.full_name)}
                        />
                        <AvatarFallback className="bg-primary-600 text-[10px] text-white">
                          {employeeInitials(employee.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="min-w-0">
                        <strong className="block truncate text-xs">
                          {formatDisplayValue(employee.full_name)}
                        </strong>
                        <span className="block truncate text-[10px] text-muted-foreground">
                          {formatDisplayValue(
                            employee.role_name || employee.position_name,
                          )}
                        </span>
                      </span>
                    </div>

                    {!oneDateForAll && (
                      <DateFields
                        className="mt-3"
                        dates={employeeDates[employee.id] ?? emptyDates()}
                        onChange={(dates) =>
                          setEmployeeDates((current) => ({
                            ...current,
                            [employee.id]: dates,
                          }))
                        }
                      />
                    )}
                  </div>
                ))}
              </div>

              {oneDateForAll && (
                <DateFields
                  className="mt-5"
                  dates={sharedDates}
                  onChange={setSharedDates}
                />
              )}
            </div>

            <DialogFooter className="border-t px-5 py-3">
              <Button
                variant="outline"
                size="sm"
                disabled={addProjectMembers.isPending}
                onClick={() => setStep("employees")}
              >
                Back
              </Button>
              <Button
                size="sm"
                disabled={!allDatesValid || addProjectMembers.isPending}
                onClick={saveAssignments}
                className="bg-primary-600 hover:bg-primary-700"
              >
                {addProjectMembers.isPending && (
                  <LoaderCircle className="animate-spin" />
                )}
                Add
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DateFields({
  className,
  dates,
  onChange,
}: {
  className?: string;
  dates: AssignmentDates;
  onChange: (dates: AssignmentDates) => void;
}) {
  const endDateInvalid = Boolean(
    dates.startDate &&
      dates.endDate &&
      dates.endDate < dates.startDate,
  );

  return (
    <div className={cn("grid gap-3 sm:grid-cols-2", className)}>
      <div className="space-y-1.5 text-xs font-medium">
        <span className="block">
          Start Date <span className="text-red-500">*</span>
        </span>
        <DatePicker
          value={dates.startDate}
          onChange={(value) =>
            onChange({ ...dates, startDate: value })
          }
          placeholder="Select start date"
        />
      </div>
      <div className="space-y-1.5 text-xs font-medium">
        <span className="block">
          End Date <span className="text-red-500">*</span>
        </span>
        <DatePicker
          value={dates.endDate}
          min={dates.startDate || undefined}
          onChange={(value) =>
            onChange({ ...dates, endDate: value })
          }
          invalid={endDateInvalid}
          placeholder="Select end date"
        />
        {endDateInvalid && (
          <span className="block text-[10px] font-normal text-red-600">
            End date cannot be earlier than start date.
          </span>
        )}
      </div>
    </div>
  );
}
