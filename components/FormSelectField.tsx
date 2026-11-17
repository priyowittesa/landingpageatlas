"use client";

import * as React from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Check, ChevronDown, Plus, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import FormFieldLayout from "./FormFieldLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type SelectOption = { label: string; value: string | number };

type FormSelectFieldProps<TFieldValues extends FieldValues> = {
  label: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  options: SelectOption[];
  error?: { message?: string };
  required?: boolean;
  placeholder?: string;
  multiple?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  search?: boolean;
  desc?: string;
  tooltip?: string;
  hideLabel?: boolean;
  onAddNew?: () => void;
};

export default function FormSelectField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  options,
  error,
  required = false,
  placeholder = "Select option",
  multiple = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No option found.",
  className,
  search = false,
  desc,
  tooltip,
  hideLabel = false,
  onAddNew,
}: FormSelectFieldProps<TFieldValues>) {
  const [open, setOpen] = React.useState(false);
  const {
    field: { value, onChange },
  } = useController({ name, control });

  const selectedValues: Array<string | number> = multiple
    ? Array.isArray(value)
      ? value
      : []
    : value !== undefined && value !== null && value !== ""
      ? [value as string | number]
      : [];

  //   Suitable for single and multiple select
  const toggleValue = (optionValue: string | number) => {
    if (multiple) {
      const next = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue];
      onChange(next);
    } else {
      onChange(optionValue);
      setOpen(false);
    }
  };

  const removeValue = (optionValue: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selectedValues.filter((v) => v !== optionValue));
  };

  const selectedOptions = options.filter((o) =>
    selectedValues.includes(o.value),
  );

  const select = (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={name}
            type="button"
            aria-label={label}
            className={cn(
              "flex min-h-10 w-full items-center justify-between gap-2 rounded-sm border px-4 py-2 text-left text-sm",
              error && "border-red-500",
              selectedOptions.length === 0 && "text-gray-400",
            )}
          >
            <div className="flex flex-1 flex-wrap gap-1">
              {selectedOptions.length === 0 && placeholder}

              {!multiple && selectedOptions[0]?.label}

              {multiple &&
                selectedOptions.map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="flex items-center gap-1 font-normal"
                  >
                    {option.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={(e) => removeValue(option.value, e)}
                    />
                  </Badge>
                ))}
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
          </button>
        </PopoverTrigger>

        <PopoverContent
          className="p-0"
          align="start"
          collisionPadding={16}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            {/* Searc input */}
            {search && <CommandInput placeholder={searchPlaceholder} />}

            <CommandList
              className="max-h-[min(15rem,var(--radix-popover-content-available-height))] overscroll-contain pr-1 [scrollbar-width:thin]"
              onWheel={(event) => {
                if (event.currentTarget.scrollHeight <= event.currentTarget.clientHeight) return;
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.scrollTop += event.deltaY;
              }}
            >
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);

                  return (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => toggleValue(option.value)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {onAddNew && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onAddNew}
          className="h-10 w-10 shrink-0 text-primary-700 hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
          aria-label={`Add new ${label.toLowerCase()}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  if (hideLabel) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {select}
        {error?.message && (
          <span className="text-xs text-red-600">{error.message}</span>
        )}
        {!error?.message && desc && (
          <span className="text-xs text-muted-foreground">{desc}</span>
        )}
      </div>
    );
  }

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
      {select}
    </FormFieldLayout>
  );
}
