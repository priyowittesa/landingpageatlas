"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface FilterField {
  key: string;
  label: string;
  defaultValue: string;
  options: string[];
  onChange?: (value: string) => void;
}

export interface FilterBarProps {
  fields: FilterField[];
  applyLabel?: string;
  onApply?: () => void;
}

export function FilterBar({
  fields,
  applyLabel = "Apply Filter",
  onApply,
}: FilterBarProps) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div
        className="grid items-end gap-4"
        style={{
          gridTemplateColumns: `repeat(${fields.length}, minmax(0, 1fr)) auto`,
        }}
      >
        {fields.map((field) => (
          <div key={field.key}>
            <span className="text-sm font-medium text-foreground">
              {field.label}
            </span>
            <Select
              defaultValue={field.defaultValue}
              onValueChange={field.onChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((opt) => (
                  <SelectItem key={opt} value={opt}>
                    {opt}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}

        <Button className="ml-auto h-10 w-fit" onClick={onApply}>
          {applyLabel}
        </Button>
      </div>
    </div>
  );
}
