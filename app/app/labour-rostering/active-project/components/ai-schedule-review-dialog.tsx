"use client";

import { format, parseISO } from "date-fns";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LabourRosterMember } from "../../../master-data/projects/use-projects";
import type { Employee } from "@/types/type-employee";
import type { LabourSchedulePreviewSuggestion } from "../use-labour-schedules";
import type { ShiftMap } from "./rostering-types";

type AiScheduleReviewDialogProps = {
  employeeMap: Map<string, Employee>;
  isAssigning: boolean;
  memberByRosterId: Map<string, LabourRosterMember>;
  onAdjustPreferences: () => void;
  onAssign: (
    selected: LabourSchedulePreviewSuggestion[],
    options: { endDate: string; startDate: string },
  ) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  rosterIdByMemberId: Map<string, string>;
  shiftMap: ShiftMap;
  suggestions: LabourSchedulePreviewSuggestion[];
};

const suggestionDates = (suggestion: LabourSchedulePreviewSuggestion) => {
  const startDate = suggestion.start_date ?? suggestion.from_date;
  const endDate = suggestion.end_date ?? suggestion.to_date;
  const rangeDates: string[] = [];

  if (startDate && endDate && startDate <= endDate) {
    const cursor = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    while (cursor <= end) {
      rangeDates.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  }

  return Array.from(
    new Set(
      (rangeDates.length
        ? rangeDates
        : suggestion.dates?.length
          ? suggestion.dates
          : [suggestion.date ?? startDate ?? ""]
      ).filter(Boolean),
    ),
  ).sort();
};

const suggestionKey = (suggestion: LabourSchedulePreviewSuggestion) =>
  `${suggestion.employee_id}:${suggestion.shift_id}:${suggestionDates(suggestion).join(",")}`;

function matchScore(score: number | undefined, reasonsCount: number) {
  const percentage = Math.min(100, Math.max(0, Math.round(score ?? 0)));

  if (score !== undefined) {
    if (percentage >= 90) {
      return {
        label: "Best Match",
        percentage: `${percentage}%`,
        variant: "green" as const,
      };
    }
    if (percentage >= 80) {
      return {
        label: "Good Match",
        percentage: `${percentage}%`,
        variant: "yellow" as const,
      };
    }
    return {
      label: "Alternate",
      percentage: `${percentage}%`,
      variant: "secondary" as const,
    };
  }

  if (reasonsCount >= 3) {
    return { label: "Best Match", percentage: "95%", variant: "green" as const };
  }
  if (reasonsCount === 2) {
    return { label: "Good Match", percentage: "81%", variant: "yellow" as const };
  }
  return { label: "Alternate", percentage: "75%", variant: "secondary" as const };
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AiScheduleReviewDialog({
  employeeMap,
  isAssigning,
  memberByRosterId,
  onAdjustPreferences,
  onAssign,
  onOpenChange,
  open,
  rosterIdByMemberId,
  shiftMap,
  suggestions,
}: AiScheduleReviewDialogProps) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelectedKeys(new Set(suggestions.map(suggestionKey)));
    if (suggestions.length) {
      const sortedDates = suggestions.flatMap(suggestionDates).sort();
      setStartDate(sortedDates[0] ?? "");
      setEndDate(sortedDates[sortedDates.length - 1] ?? "");
    } else {
      setStartDate("");
      setEndDate("");
    }
  }, [open, suggestions]);

  const filteredSuggestions = useMemo(
    () =>
      suggestions.filter((suggestion) =>
        suggestionDates(suggestion).some((date) => {
          if (startDate && date < startDate) return false;
          if (endDate && date > endDate) return false;
          return true;
        }),
      ),
    [endDate, startDate, suggestions],
  );

  const visibleKeys = useMemo(
    () => filteredSuggestions.map(suggestionKey),
    [filteredSuggestions],
  );

  const allSelected =
    visibleKeys.length > 0 &&
    visibleKeys.every((key) => selectedKeys.has(key));

  const toggleAll = () => {
    setSelectedKeys((current) => {
      if (visibleKeys.every((key) => current.has(key))) {
        return new Set();
      }
      return new Set(visibleKeys);
    });
  };

  const toggleRow = (key: string) => {
    setSelectedKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleAssign = () => {
    if (!selectedKeys.size) return;
    const selected = suggestions.filter((suggestion) =>
      selectedKeys.has(suggestionKey(suggestion)),
    );
    onAssign(selected, { startDate, endDate });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[94dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={!isAssigning}
      >
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <Sparkles className="size-4.5" />
            </span>
            <div className="space-y-1">
              <DialogTitle className="text-sm">
                AI Generate Schedule
              </DialogTitle>
              <DialogDescription className="text-[11px]">
                AI has analyzed your requirements and generated the best matches
                for unfilled shifts.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
            <CheckCircle2 className="size-4 shrink-0" />
            <p className="text-xs font-medium">
              AI analysis complete! Found {suggestions.length} best match
              {suggestions.length === 1 ? "" : "es"} for {suggestions.length}{" "}
              unfilled shift{suggestions.length === 1 ? "" : "s"}.
            </p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto h-7 text-xs"
              disabled={isAssigning}
              onClick={onAdjustPreferences}
            >
              Adjust Preferences
            </Button>
          </div>

          <div className="mb-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-slate-700">
                Start Date
              </label>
              <DatePicker
                className="mt-1"
                value={startDate}
                max={endDate || undefined}
                onChange={setStartDate}
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-700">
                End Date
              </label>
              <DatePicker
                className="mt-1"
                value={endDate}
                min={startDate || undefined}
                onChange={setEndDate}
              />
            </div>
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="flex min-h-40 flex-col items-center justify-center text-center text-sm text-muted-foreground">
              {suggestions.length === 0
                ? "No suggestions returned. Try adjusting your preferences."
                : "No suggestions in the selected date range."}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs">Unfilled Shift</TableHead>
                    <TableHead className="text-xs">Recommended Employee</TableHead>
                    <TableHead className="text-xs">Match Score</TableHead>
                    <TableHead className="text-xs">Reason</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuggestions.map((suggestion, index) => {
                    const key = suggestionKey(suggestion);
                    const isSelected = selectedKeys.has(key);
                    const shift = shiftMap.get(suggestion.shift_id)?.shift;
                    const shiftName =
                      suggestion.shift_name ||
                      shift?.name ||
                      `Shift ${suggestion.shift_id}`;
                    const reasonCount = suggestion.reasons?.length ?? 0;
                    const score = matchScore(suggestion.match_score, reasonCount);
                    const availableDates = suggestionDates(suggestion);
                    const fromDate =
                      suggestion.start_date ??
                      suggestion.from_date ??
                      availableDates[0];
                    const toDate =
                      suggestion.end_date ??
                      suggestion.to_date ??
                      availableDates[availableDates.length - 1];
                    const rosterId = rosterIdByMemberId.get(
                      suggestion.employee_id,
                    );
                    const member = rosterId
                      ? memberByRosterId.get(rosterId)
                      : undefined;
                    const employee = rosterId
                      ? employeeMap.get(rosterId)
                      : undefined;
                    const fullName =
                      suggestion.employee_name ||
                      employee?.full_name ||
                      member?.labour_name ||
                      member?.member_role_name ||
                      member?.labour_role_name ||
                      "Unassigned";
                    const roleName =
                      suggestion.role_name ||
                      employee?.role_name ||
                      member?.member_role_name ||
                      member?.labour_role_name ||
                      "—";
                    const positionName =
                      suggestion.position_name ||
                      employee?.position_name ||
                      "";
                    const employeeCode =
                      employee?.code ||
                      member?.id ||
                      suggestion.employee_id;
                    const prevSuggestion =
                      index > 0 ? filteredSuggestions[index - 1] : undefined;
                    const sameEmployee =
                      prevSuggestion?.employee_id === suggestion.employee_id;
                    return (
                      <TableRow
                        key={key}
                        className={cn(
                          sameEmployee
                            ? "border-t border-slate-100"
                            : "border-t-2 border-primary-200",
                        )}
                      >
                        <TableCell className="align-top">
                          <div className="flex flex-col gap-0.5 py-1.5">
                            <span className="text-xs font-semibold text-slate-900">
                              {fromDate && toDate
                                ? fromDate === toDate
                                  ? format(parseISO(fromDate), "EEE, dd MMM yyyy")
                                  : `${format(parseISO(fromDate), "dd MMM yyyy")} - ${format(parseISO(toDate), "dd MMM yyyy")}`
                                : "Date unavailable"}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {shiftName}
                              {shift
                                ? ` · ${shift.start_time} - ${shift.end_time}`
                                : ""}
                            </span>
                            {availableDates.length > 0 && (
                              <span className="text-[10px] text-slate-400">
                                Available: {availableDates.map((date) => format(parseISO(date), "dd MMM")).join(", ")}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-start gap-2.5 py-1.5">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary-50 text-xs font-semibold text-primary-700">
                                {initials(fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 space-y-0.5">
                              <p className="truncate text-xs font-semibold text-slate-900">
                                {fullName}
                              </p>
                              <p className="truncate text-[11px] text-slate-500">
                                {roleName}
                                {positionName
                                  ? ` · ${positionName}`
                                  : ""}
                              </p>
                              <p className="truncate text-[11px] text-slate-400">
                                EMP#: {employeeCode}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-col items-center gap-1 py-1.5">
                            <span className="text-sm font-bold tabular-nums text-slate-900">
                              {score.percentage}
                            </span>
                            <Badge variant={score.variant} className="capitalize">
                              {score.label}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="space-y-1 py-1.5">
                            {suggestion.reasons && suggestion.reasons.length ? (
                              suggestion.reasons.map((reason, idx) => (
                                <div
                                  key={`${key}-reason-${idx}`}
                                  className="flex items-start gap-2 text-[11px] text-slate-600"
                                >
                                  <span className="mt-1.5 inline-block size-1 shrink-0 rounded-full bg-slate-400" />
                                  <span className="flex-1">{reason}</span>
                                </div>
                              ))
                            ) : (
                              <span className="text-[11px] text-slate-400">
                                —
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top text-right">
                          <div className="py-1.5">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected ? "default" : "outline"}
                              disabled={isAssigning}
                              onClick={() => toggleRow(key)}
                              className={
                                isSelected
                                  ? "bg-primary-600 text-xs hover:bg-primary-700"
                                  : "text-xs"
                              }
                              aria-label={`Toggle ${fullName} recommendation`}
                            >
                              {isSelected ? "Selected" : "Select"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t bg-white px-5 py-3">
          <div className="flex w-full flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                disabled={visibleKeys.length === 0 || isAssigning}
                aria-label="Select all AI recommendations"
                className="!border-2 !border-primary-500 !bg-white data-[state=checked]:!border-primary-600 data-[state=checked]:!bg-primary-600"
              />
              Select all AI recommendations
            </label>
            <div className="ml-auto flex items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAssigning}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isAssigning}
                onClick={onAdjustPreferences}
              >
                Adjust Preferences
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={!selectedKeys.size || isAssigning}
                onClick={handleAssign}
                className="bg-neutral-900 hover:bg-neutral-800"
              >
                <Sparkles />
                Assign
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
