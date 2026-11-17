"use client";

import { CalendarDays, LoaderCircle } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { formatDisplayValue } from "@/lib/format-display-value";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateProjectMemberDates } from "../../../master-data/projects/use-projects";

export type MemberDateTarget = {
  endDate: string;
  groupId?: string;
  id: string;
  name: string;
  startDate: string;
};

type ChangeMemberDateDialogProps = {
  member: MemberDateTarget | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  projectId: string;
};

function dateInputValue(value: string) {
  return value.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
}

export function ChangeMemberDateDialog({
  member,
  onOpenChange,
  open,
  projectId,
}: ChangeMemberDateDialogProps) {
  const updateDates = useUpdateProjectMemberDates();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open || !member) return;
    setStartDate(dateInputValue(member.startDate));
    setEndDate(dateInputValue(member.endDate));
  }, [member, open]);

  const endDateInvalid = Boolean(
    startDate && endDate && endDate < startDate,
  );
  const canSave = Boolean(
    member &&
      startDate &&
      endDate &&
      !endDateInvalid &&
      !updateDates.isPending,
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (updateDates.isPending) return;
    onOpenChange(nextOpen);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!member || !canSave) return;

    try {
      await updateDates.mutateAsync({
        end_date: endDate,
        ...(member.groupId ? { group_id: member.groupId } : {}),
        id: member.id,
        projectId,
        start_date: startDate,
      });
      onOpenChange(false);
    } catch {
      // The shared mutation handler displays the API error.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={!updateDates.isPending}
      >
        <form onSubmit={submit}>
          <DialogHeader className="border-b px-5 py-4 pr-12">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary-700">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div className="space-y-1">
                <DialogTitle className="text-sm">
                  Change Member Date
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Update the assignment period for{" "}
                  {formatDisplayValue(member?.name, "this member")}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="space-y-1.5 text-xs font-medium">
              <span className="block">
                Start Date <span className="text-red-500">*</span>
              </span>
              <DatePicker
                value={startDate}
                max={endDate || undefined}
                onChange={setStartDate}
                disabled={updateDates.isPending}
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-1.5 text-xs font-medium">
              <span className="block">
                End Date <span className="text-red-500">*</span>
              </span>
              <DatePicker
                value={endDate}
                min={startDate || undefined}
                onChange={setEndDate}
                disabled={updateDates.isPending}
                invalid={endDateInvalid}
                placeholder="Select end date"
              />
            </div>
            {endDateInvalid && (
              <p className="text-xs text-red-500 sm:col-span-2">
                End date cannot be earlier than start date.
              </p>
            )}
          </div>

          <DialogFooter className="border-t px-5 py-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={updateDates.isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={!canSave}>
              {updateDates.isPending && (
                <LoaderCircle className="animate-spin" />
              )}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
