"use client";

import { format, isValid, parseISO, startOfDay } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type DatePickerProps = {
  className?: string;
  disabled?: boolean;
  invalid?: boolean;
  max?: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
};

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

export function DatePicker({
  className,
  disabled,
  invalid,
  max,
  min,
  onChange,
  placeholder = "Select date",
  value,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const selectedDate = useMemo(() => parseDate(value), [value]);
  const minimumDate = useMemo(() => parseDate(min), [min]);
  const maximumDate = useMemo(() => parseDate(max), [max]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-invalid={invalid || undefined}
          className={cn(
            "h-9 w-full justify-between px-3 text-left text-xs font-normal shadow-none",
            !selectedDate && "text-muted-foreground",
            invalid && "border-red-400 focus-visible:ring-red-100",
            className,
          )}
        >
          {selectedDate ? format(selectedDate, "dd/MM/yyyy") : placeholder}
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : "");
            setOpen(false);
          }}
          captionLayout="dropdown"
          startMonth={new Date(2000, 0)}
          endMonth={new Date(new Date().getFullYear() + 20, 11)}
          disabled={
            minimumDate || maximumDate
              ? (date) =>
                  Boolean(
                    (minimumDate &&
                      startOfDay(date) < startOfDay(minimumDate)) ||
                      (maximumDate &&
                        startOfDay(date) > startOfDay(maximumDate)),
                  )
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}
