"use client";

import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PERIOD_OPTIONS } from "./rostering-period";
import type { SchedulePeriod } from "./rostering-types";

type RosteringPeriodControlsProps = {
  onMovePeriod: (amount: number) => void;
  onPeriodChange: (period: SchedulePeriod) => void;
  period: SchedulePeriod;
  periodLabel: string;
};

export function RosteringPeriodControls({
  onMovePeriod,
  onPeriodChange,
  period,
  periodLabel,
}: RosteringPeriodControlsProps) {
  return (
    <>
      <Select
        value={period}
        onValueChange={(value) =>
          onPeriodChange(value as SchedulePeriod)
        }
      >
        <SelectTrigger
          className="h-9 w-32 rounded-md px-3 text-xs font-medium shadow-sm"
          aria-label="Schedule period"
        >
          <span className="flex min-w-0 items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            <SelectValue />
          </span>
        </SelectTrigger>
        <SelectContent>
          {PERIOD_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex h-9 items-center overflow-hidden rounded-md border bg-white text-xs shadow-sm">
        <CalendarDays className="ml-3 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="whitespace-nowrap px-2 font-medium">
          {periodLabel}
        </span>
        <button
          type="button"
          className="flex h-full items-center px-2 transition-colors hover:bg-muted"
          onClick={() => onMovePeriod(-1)}
          aria-label={`Previous ${period}`}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="flex h-full items-center px-2 transition-colors hover:bg-muted"
          onClick={() => onMovePeriod(1)}
          aria-label={`Next ${period}`}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}
