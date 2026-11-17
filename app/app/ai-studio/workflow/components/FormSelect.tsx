"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

/**
 * Value used for the placeholder item. Radix forbids empty item values, so the
 * "nothing selected" choice needs a sentinel that is mapped back to `""`.
 */
const EMPTY_VALUE = "__empty__";

export interface FormSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

/**
 * Drop-in replacement for a native `<select>` in the node settings forms.
 *
 * A native option list sizes itself to its longest option and is positioned by
 * the browser, so long values (Excel column names, Drive file names) overflow
 * the settings panel and run off-screen. This wraps the app's Radix Select,
 * which pins the popup to the trigger width, wraps long labels instead of
 * overflowing, and renders in a portal so the panel's scroll container can't
 * clip it.
 */
export function FormSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  id,
  size = "md",
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: FormSelectOption[];
  /** Label of the "nothing selected" choice. Omit to require a selection. */
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  /** `sm` matches the compact inputs used for request params. */
  size?: "sm" | "md";
  className?: string;
}) {
  const sizeClass =
    size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-2 text-sm";

  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next === EMPTY_VALUE ? "" : next)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        className={`h-auto w-full rounded-md ${sizeClass} disabled:cursor-not-allowed disabled:bg-gray-50 ${className}`}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="w-(--radix-select-trigger-width)">
        {placeholder !== undefined && (
          <SelectItem value={EMPTY_VALUE} className="text-gray-400">
            {placeholder}
          </SelectItem>
        )}
        {options.map((opt) => (
          <SelectItem
            key={opt.value}
            value={opt.value}
            disabled={opt.disabled}
            className="whitespace-normal break-words"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
