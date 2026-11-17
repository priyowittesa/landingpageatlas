"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import type { DataAccessDatabase } from "../types";

export function DatabaseSelect({
  value,
  onChange,
  databases,
  emptyLabel,
  label
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  databases: DataAccessDatabase[];
  emptyLabel: string;
  label: string;
}) {
  return (
    <Select
      value={value ?? "__none"}
      onValueChange={(next) => onChange(next === "__none" ? null : next)}
    >
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__none">{emptyLabel}</SelectItem>
        {databases.map((database) => (
          <SelectItem key={database.id} value={database.id}>
            {database.id}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
