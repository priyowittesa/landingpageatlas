"use client";

import { MoreVertical, UserRound } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDisplayValue } from "@/lib/format-display-value";
import type { Employee } from "@/types/type-employee";

export function EmployeeDetailsPopover({
  employee,
  memberRoleName,
  onAssignEmployee,
  onChangeDate,
  onDelete,
}: {
  employee: Employee;
  memberRoleName?: string;
  onAssignEmployee: () => void;
  onChangeDate: () => void;
  onDelete: () => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const details: [string, string, boolean][] = [
    ["Name", employee.full_name, true],
    ["Role", memberRoleName || employee.role_name, true],
    ["Employee Code", employee.code, false],
    ["Employee ID", employee.id, false],
    ["Department", employee.department_name, true],
    ["Position", employee.position_name, true],
    ["Email", employee.email, false],
    ["Phone Number", employee.phone_number, false],
  ];

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-slate-100 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary-400"
            aria-label={`Actions for ${formatDisplayValue(employee.full_name)}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={6}
          className="w-52"
        >
          <DropdownMenuItem onSelect={() => setDetailsOpen(true)}>
            View Detail
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onChangeDate}>
            Start &amp; End Date
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onAssignEmployee}>
            Assign Employee
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-red-600 focus:bg-red-50 focus:text-red-600"
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-sm">
                  Employee Details
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Member information for this roster row.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <dl className="space-y-2 px-5 py-5 text-xs">
            {details.map(([label, value, formatValue]) => (
              <div
                key={label}
                className="grid grid-cols-[6.5rem_0.5rem_minmax(0,1fr)] items-start"
              >
                <dt className="text-muted-foreground">{label}</dt>
                <span aria-hidden="true">:</span>
                <dd className="break-words font-medium">
                  {formatValue
                    ? formatDisplayValue(value)
                    : value?.trim() || "-"}
                </dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </>
  );
}
