"use client";

import * as React from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { format, parse, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import FormFieldLayout from "./FormFieldLayout";
import { cn } from "@/lib/utils";

const DATE_FORMAT = "MM/dd/yyyy";

type FormDateFieldProps<TFieldValues extends FieldValues> = {
  label: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  error?: { message?: string };
  required?: boolean;
  placeholder?: string;
  className?: string;
  fromYear?: number;
  toYear?: number;
  desc?: string;
  tooltip?: string;
};

export default function FormDateField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  error,
  required = false,
  placeholder = "Select date",
  className,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  desc,
  tooltip,
}: FormDateFieldProps<TFieldValues>) {
  const [open, setOpen] = React.useState(false);
  const {
    field: { value, onChange },
  } = useController({ name, control });

  const parsedDate =
    typeof value === "string" && value
      ? parse(value, DATE_FORMAT, new Date())
      : undefined;
  const selectedDate =
    parsedDate && isValid(parsedDate) ? parsedDate : undefined;

  const handleSelect = (date: Date | undefined) => {
    onChange(date ? format(date, DATE_FORMAT) : "");
    setOpen(false);
  };

  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error?.message}
      className={className}
      desc={desc}
      tooltip={tooltip}
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={name}
            type="button"
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-sm border px-4 text-left text-sm",
              error && "border-red-500",
              !selectedDate && "text-gray-400",
            )}
          >
            {selectedDate ? format(selectedDate, DATE_FORMAT) : placeholder}
            <CalendarIcon className="h-4 w-4 text-gray-400" />
          </button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            captionLayout="dropdown"
            startMonth={new Date(fromYear, 0)}
            endMonth={new Date(toYear, 11)}
            disabled={(date) =>
              date.getFullYear() < fromYear || date.getFullYear() > toYear
            }
          />
        </PopoverContent>
      </Popover>
    </FormFieldLayout>
  );
}
