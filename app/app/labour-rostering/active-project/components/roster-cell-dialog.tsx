"use client";

import { format, parseISO } from "date-fns";
import { Trash2, UserRoundCheck } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { formatDisplayValue } from "@/lib/format-display-value";
import type { Employee } from "@/types/type-employee";
import { SHIFT_COLORS } from "./shift-palette";
import type { Assignment, ShiftMap } from "./rostering-types";

type RosterCellDialogProps = {
  assignments: Assignment[];
  date: string;
  employee: Employee | null;
  onOpenChange: (open: boolean) => void;
  onRemoveAssignment: (
    employeeId: string,
    date: string,
    shiftId: string,
  ) => void;
  open: boolean;
  shiftMap: ShiftMap;
};

export function RosterCellDialog({
  assignments,
  date,
  employee,
  onOpenChange,
  onRemoveAssignment,
  open,
  shiftMap,
}: RosterCellDialogProps) {
  const formattedDate = date
    ? format(parseISO(date), "EEE, dd MMMM yyyy")
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b px-6 py-5 pr-14 text-left">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
              <UserRoundCheck className="h-6 w-6" />
            </span>
            <div className="min-w-0 space-y-1">
              <DialogTitle className="truncate text-xl">
                {formatDisplayValue(employee?.full_name, "Employee")}
              </DialogTitle>
              <DialogDescription>
                {employee?.role_name && (
                  <span className="mr-2">
                    {formatDisplayValue(employee.role_name)} ·
                  </span>
                )}
                {formattedDate}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          <h3 className="mb-3 text-sm font-semibold">Status</h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {assignments.map((assignment) => {
              const shiftData = shiftMap.get(assignment.shiftId);
              if (!shiftData) return null;
              const colors =
                SHIFT_COLORS[shiftData.index % SHIFT_COLORS.length];
              const displayShiftName = formatDisplayValue(
                shiftData.shift.name,
              );

              return (
                <div
                  key={assignment.shiftId}
                  tabIndex={0}
                  className={cn(
                    "group relative flex min-h-24 items-center justify-center rounded-xl border px-3 py-5 text-center text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2",
                    colors.card,
                  )}
                  onKeyDown={(event) => {
                    if (
                      event.repeat ||
                      (event.key !== "Delete" &&
                        event.key !== "Backspace")
                    ) {
                      return;
                    }
                    event.preventDefault();
                    event.stopPropagation();
                    onRemoveAssignment(
                      assignment.employeeId,
                      assignment.date,
                      assignment.shiftId,
                    );
                  }}
                  aria-label={`${displayShiftName}. Press Delete or Backspace to remove`}
                  title={`${shiftData.shift.start_time} - ${shiftData.shift.end_time}. Press Delete or Backspace to remove`}
                >
                  <span className="break-words">{displayShiftName}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveAssignment(
                        assignment.employeeId,
                        assignment.date,
                        assignment.shiftId,
                      )
                    }
                    className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-red-500 shadow-sm transition-colors hover:bg-red-200"
                    aria-label={`Remove ${displayShiftName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {!assignments.length && (
            <div className="flex min-h-28 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
              No shift assigned.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
