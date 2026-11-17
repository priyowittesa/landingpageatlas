"use client";

import * as React from "react";
import {
  useController,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { allCountries as rawCountries } from "country-telephone-data";
import { Check, ChevronDown } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import FormFieldLayout from "./FormFieldLayout";
import { cn } from "@/lib/utils";

type CountryDialOption = {
  name: string;
  iso2: string;
  dialCode: string;
};

const dialCodeOptions: CountryDialOption[] = (
  rawCountries as CountryDialOption[]
).sort((a, b) => Number(a.dialCode) - Number(b.dialCode));

// Function for spliiting pre-filled value to the dial code select and input field
function splitPhoneValue(value: string | undefined, fallbackDialCode: string) {
  if (!value) return { dialCode: fallbackDialCode, number: "" };
  const match = dialCodeOptions.find((c) => value.startsWith(`+${c.dialCode}`));

  if (!match)
    return { dialCode: fallbackDialCode, number: value.replace(/^\+/, "") };

  return {
    dialCode: match.dialCode,
    number: value.slice(match.dialCode.length + 1),
  };
}

const CountryDialSelect = React.memo(function CountryDialSelect({
  dialCode,
  onSelect,
  hasError,
  triggerId,
}: {
  dialCode: string;
  onSelect: (dialCode: string) => void;
  hasError: boolean;
  triggerId: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={triggerId}
          type="button"
          className={cn(
            "flex h-full shrink-0 items-center gap-1 border-r bg-gray-50 px-3 text-sm",
            hasError && "border-red-500",
          )}
        >
          {`+${dialCode}`}
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </PopoverTrigger>

      <PopoverContent className="w-65 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country or code..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {dialCodeOptions.map((c) => (
                <CommandItem
                  key={`${c.iso2}-${c.dialCode}`}
                  value={`${c.name} +${c.dialCode}`}
                  onSelect={() => {
                    onSelect(c.dialCode);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      c.dialCode === dialCode ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1">{c.name}</span>
                  <span className="text-gray-400">+{c.dialCode}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

type FormPhoneNumberFieldProps<TFieldValues extends FieldValues> = {
  label: string;
  name: Path<TFieldValues>;
  control: Control<TFieldValues>;
  error?: { message?: string };
  required?: boolean;
  placeholder?: string;
  defaultDialCode?: string;
  className?: string;
};

export default function FormPhoneNumberField<TFieldValues extends FieldValues>({
  label,
  name,
  control,
  error,
  required = false,
  placeholder = "Enter phone number",
  defaultDialCode = "62",
  className,
}: FormPhoneNumberFieldProps<TFieldValues>) {
  const {
    field: { value, onChange },
  } = useController({ name, control });

  //   Initial render value
  const initial = React.useMemo(
    () => splitPhoneValue(value as string | undefined, defaultDialCode),
    [],
  );

  const [dialCode, setDialCode] = React.useState(initial.dialCode);
  const [number, setNumber] = React.useState(initial.number);

  const handleDialCodeChange = React.useCallback(
    (nextDialCode: string) => {
      setDialCode(nextDialCode);
      onChange(number ? `+${nextDialCode}${number}` : "");
    },
    [number, onChange],
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/[^\d]/g, "");
    setNumber(digitsOnly);
    onChange(digitsOnly ? `+${dialCode}${digitsOnly}` : "");
  };

  return (
    <FormFieldLayout
      label={label}
      htmlFor={name}
      required={required}
      error={error?.message}
      className={className}
    >
      <div
        className={cn(
          "flex h-10 items-stretch overflow-hidden rounded-sm border",
          error && "border-red-500",
        )}
      >
        <CountryDialSelect
          dialCode={dialCode}
          onSelect={handleDialCodeChange}
          hasError={!!error}
          triggerId={`${name}-dial-code`}
        />

        <Input
          id={name}
          inputMode="numeric"
          value={number}
          onChange={handleNumberChange}
          placeholder={placeholder}
          className="h-full flex-1 rounded-none border-0 px-4 text-sm focus-visible:ring-0"
        />
      </div>
    </FormFieldLayout>
  );
}
